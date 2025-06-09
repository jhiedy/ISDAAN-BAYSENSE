from app import db
from datetime import timezone, datetime as dt
from sqlalchemy import Enum as SQLAlchemyEnum

class User(db.Model):
    __tablename__ = 'User'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    contact_no = db.Column(db.String(15), nullable=False)
    is_registered = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=dt.now(timezone.utc), nullable=False)

class ParameterThresholds(db.Model):
    __tablename__ = 'ParameterThresholds'
    threshold_id = db.Column(db.Integer, primary_key=True)
    fla = db.Column(db.String(20), nullable=False)
    
    # Water quality parameters
    chla_min = db.Column(db.Float, nullable=False)  # Chlorophyll-a minimum
    chla_max = db.Column(db.Float, nullable=False)  # Chlorophyll-a maximum
    turbidity_min = db.Column(db.Float, nullable=False)  # Turbidity minimum
    turbidity_max = db.Column(db.Float, nullable=False)  # Turbidity maximum
    tss_min = db.Column(db.Float, nullable=False)  # Total Suspended Sediments minimum
    tss_max = db.Column(db.Float, nullable=False)  # Total Suspended Sediments maximum
    
    # Meteorological parameters
    gust_speed_max = db.Column(db.Float, nullable=False)  # Maximum gust speed (m/s)
    rainfall_max = db.Column(db.Float, nullable=False)  # Maximum rainfall (mm/h)
    
    # Default values for thresholds
    DEFAULT_CHLA_MIN = 0.0
    DEFAULT_CHLA_MAX = 0.5
    DEFAULT_TURBIDITY_MIN = 0.0
    DEFAULT_TURBIDITY_MAX = 0.5
    DEFAULT_TSS_MIN = 0.0
    DEFAULT_TSS_MAX = 0.5
    DEFAULT_GUST_SPEED_MAX = 15.0
    DEFAULT_RAINFALL_MAX = 50.0

class Admin(db.Model):
    __tablename__ = 'Admin'
    admin_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    
    @property
    def is_admin(self):
        return True

class Alerts(db.Model):
    __tablename__ = 'Alerts'
    alert_id = db.Column(db.Integer, primary_key=True)
    fla = db.Column(db.String(20), nullable=False)
    alert_type = db.Column(SQLAlchemyEnum('water quality', 'meteorological', name='alert_type', create_type=False), nullable=False)
    alert_message = db.Column(db.Text, nullable=False)
    datetime = db.Column(db.DateTime, nullable=False)
    status = db.Column(SQLAlchemyEnum('pending', 'dismissed', 'resolved', name='alert_status', create_type=False), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, nullable=False, default=dt.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=dt.now(timezone.utc), onupdate=dt.now(timezone.utc))

    def __init__(self, **kwargs):
        super(Alerts, self).__init__(**kwargs)
        if self.datetime is None:
            self.datetime = dt.now(timezone.utc)