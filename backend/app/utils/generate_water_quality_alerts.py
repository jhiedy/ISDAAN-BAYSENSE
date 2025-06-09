import logging
import os
from datetime import datetime, timedelta, date
from sqlalchemy import create_engine, func, and_
from sqlalchemy.orm import sessionmaker, joinedload
from sqlalchemy.exc import SQLAlchemyError

try:
    from app.models import Cage, Alerts, ParameterThresholds, db
    from app.utils.ee_service import get_point_parameter_values
    from app.config import Config
except ImportError as e:
    print(f"Import Error: {e}. Ensure the script is run from a context where the models, ee_service, and config are accessible.")
    print("You might need to adjust PYTHONPATH or run as a module (e.g. python -m alerts.generate_water_quality_alerts).")
    exit(1)


# --- Configuration ---
DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI
PARAMETERS_TO_CHECK = ['chlorophyll', 'turbidity', 'tss']
GEE_LOOKBACK_DAYS = 14
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Database Setup ---
engine = create_engine(DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_threshold(parameter_name, value, thresholds):
    """Checks if a value is outside the min/max threshold for a parameter."""
    model_prefix = parameter_name
    if parameter_name == 'chlorophyll':
        model_prefix = 'chla'

    min_val = getattr(thresholds, f"{model_prefix}_min", None)
    max_val = getattr(thresholds, f"{model_prefix}_max", None)

    if value is None:
        return False, f"No data available for {parameter_name.capitalize()}"

    if min_val is None or max_val is None:
        return False, f"No thresholds defined for {parameter_name.capitalize()}"

    try:
        value = float(value)
    except (ValueError, TypeError):
        return False, f"Invalid {parameter_name.capitalize()} reading: {value}"

    # Parameter-specific messaging
    if parameter_name == 'chlorophyll':
        if value < min_val:
            return True, (f"Chlorophyll too low: {value:.2f} (min {min_val:.2f}). "
                         "Low algal activity may reduce oxygen levels.")
        elif value > max_val:
            return True, (f"Chlorophyll too high: {value:.2f} (max {max_val:.2f}). "
                         "Potential algal bloom, may cause oxygen depletion.")

    elif parameter_name == 'turbidity':
        if value < min_val:
            return True, (f"Turbidity too low: {value:.2f} (min {min_val:.2f}). "
                         "Water unusually clear, may lack nutrients.")
        elif value > max_val:
            return True, (f"Turbidity too high: {value:.2f} (max {max_val:.2f}). "
                         "Reduces light penetration, may stress fish.")

    elif parameter_name == 'tss':
        if value < min_val:
            return True, (f"Suspended solids too low: {value:.2f} (min {min_val:.2f}). "
                         "Insufficient particles for filter feeders.")
        elif value > max_val:
            return True, (f"Suspended solids too high: {value:.2f} (max {max_val:.2f}). "
                         "May clog fish gills, indicates possible runoff.")

    return False, (f"{parameter_name.capitalize()} normal: {value:.2f} "
                  f"(range {min_val:.2f}-{max_val:.2f} ")


def check_existing_alert(db_session, cage_id, target_date, parameter_name):
    """Checks if an alert for this cage, parameter, and date already exists."""
    try:
        alert_exists = db_session.query(Alerts).filter(
            Alerts.cage_id == cage_id,
            func.date(Alerts.datetime) == target_date,
            Alerts.alert_message.like(f'%{parameter_name.capitalize()}%too %')
        ).first()
        return alert_exists is not None
    except SQLAlchemyError as e:
        logging.error(f"Database error checking existing alerts for cage {cage_id} on {target_date}: {e}")
        return True


def generate_alerts():
    """Fetches GEE data, compares with thresholds, generates alerts and updates cage status."""
    logging.info("Starting alert generation process...")
    db = SessionLocal()

    try:
        today = date.today()
        start_date = (today - timedelta(days=GEE_LOOKBACK_DAYS)).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')

        cages = db.query(Cage).options(joinedload(Cage.thresholds)).all()
        logging.info(f"Found {len(cages)} cages to check.")

        if not cages:
            logging.info("No cages found in the database.")
            return

        alerts_to_add = []
        cages_to_update = set()

        for cage in cages:
            if not cage.thresholds:
                logging.warning(f"Cage ID {cage.cage_id} ({cage.cage_name}) has no associated thresholds. Skipping.")
                continue

            logging.info(f"Processing Cage ID: {cage.cage_id}, Name: {cage.cage_name}, Location: ({cage.lon}, {cage.lat})")
            cage_coords = [cage.lon, cage.lat]
            latest_data_for_cage = {}
            latest_overall_date_obj = None

            for param in PARAMETERS_TO_CHECK:
                try:
                    logging.debug(f"Fetching GEE data for {param} for cage {cage.cage_id}...")
                    param_values = get_point_parameter_values(
                        parameter=param,
                        point_coords=cage_coords,
                        start_date=start_date,
                        end_date=end_date
                    )

                    if param_values:
                        latest_entry = max(param_values, key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d').date())
                        latest_date_str = latest_entry['date']
                        latest_value = latest_entry['value']
                        latest_date_obj = datetime.strptime(latest_date_str, '%Y-%m-%d').date()

                        if latest_value is not None:
                            latest_data_for_cage[param] = {'value': latest_value, 'date': latest_date_str}
                            if latest_overall_date_obj is None or latest_date_obj > latest_overall_date_obj:
                                latest_overall_date_obj = latest_date_obj
                        else:
                            logging.warning(f"GEE returned None value for {param} for cage {cage.cage_id} on {latest_date_str}.")
                    else:
                        logging.warning(f"No GEE data found for {param} for cage {cage.cage_id} between {start_date} and {end_date}.")

                except Exception as e:
                    logging.error(f"Error fetching GEE data for {param} for cage {cage.cage_id}: {e}")
                    continue

            if latest_overall_date_obj is None:
                logging.warning(f"No GEE data found for any parameter for cage {cage.cage_id} in the lookback period.")
                continue

            logging.info(f"Latest data found for cage {cage.cage_id} on {latest_overall_date_obj.strftime('%Y-%m-%d')}")

            for param, data in latest_data_for_cage.items():
                data_date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
                if data_date_obj == latest_overall_date_obj:
                    value = data['value']
                    is_breached, message = check_threshold(param, value, cage.thresholds)

                    if is_breached:
                        logging.warning(f"Threshold breach for Cage {cage.cage_id}: {message}")
                        if not check_existing_alert(db, cage.cage_id, latest_overall_date_obj, param):
                            new_alert = Alerts(
                                cage_id=cage.cage_id,
                                alert_type='water quality',
                                alert_message=message,
                                datetime=datetime.combine(latest_overall_date_obj, datetime.min.time()),
                                status='pending'
                            )
                            alerts_to_add.append(new_alert)
                            cages_to_update.add(cage.cage_id)

        if alerts_to_add:
            db.add_all(alerts_to_add)

        if cages_to_update:
            db.query(Cage).filter(Cage.cage_id.in_(cages_to_update)).update(
                {Cage.status: 'at risk'},
                synchronize_session=False
            )

        if alerts_to_add or cages_to_update:
            db.commit()
            logging.info(f"Committed {len(alerts_to_add)} new alerts and {len(cages_to_update)} status updates.")
        else:
            logging.info("No new alerts or status updates needed.")

    except SQLAlchemyError as e:
        logging.error(f"Database error during alert generation: {e}")
        db.rollback()
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        db.rollback()
    finally:
        db.close()
        logging.info("Alert generation complete.")

if __name__ == "__main__":
    generate_alerts()