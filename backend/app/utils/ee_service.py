import ee
import os
import json
import threading
import datetime
import logging
from dotenv import load_dotenv
from functools import lru_cache # Import lru_cache

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

# --- GEE Initialization Handling ---
_ee_initialized = threading.local() # Thread-local storage for initialization status
def initialize_ee():
    """
    Initializes the Earth Engine library using service account credentials. 
    Ensures initialization happens only once per thread/context.
    """
    # Check if already initialized in the current thread/context
    if getattr(_ee_initialized, 'status', False):
        return

    logging.info("Attempting to initialize Earth Engine...")
    try:
        project_id = os.getenv('EE_PROJECT_ID')
        credential_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        service_account = os.getenv('EE_SERVICE_ACCOUNT')

        if not project_id:
            # Log a warning but proceed, GEE might infer project from credentials
            logging.warning("EE_PROJECT_ID environment variable not set. GEE will attempt to infer project from credentials.")
        
        if not service_account:
            # Log a warning but proceed, GEE might infer project from credentials
            logging.warning("EE_SERVICE_ACCOUNT environment variable not set. GEE will attempt to infer project from credentials.")

        if not credential_path:
            # This is usually critical for service account auth
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Please point it to your service account key file.")
        elif not os.path.exists(credential_path):
             raise FileNotFoundError(f"Service account key file not found at path specified by GOOGLE_APPLICATION_CREDENTIALS: {credential_path}")
        
        credentials=ee.ServiceAccountCredentials(service_account, credential_path)

        ee.Initialize(project=project_id, credentials=credentials, opt_url='https://earthengine-highvolume.googleapis.com')

        logging.info(f"Earth Engine Initialized Successfully for project: {project_id or 'inferred'}")
        _ee_initialized.status = True # Mark as initialized for this thread

    except ee.EEException as eee: # Catch specific GEE init errors
        logging.error(f"GEE Initialization Error: {eee}")
        _ee_initialized.status = False
        raise RuntimeError(f"Failed to initialize GEE: {eee}")
    except Exception as e:
        logging.exception("FATAL: Earth Engine Initialization Failed!") # Log full traceback
        _ee_initialized.status = False
        # Re-raise the original error for clarity
        raise

def ensure_ee_initialized(func):
    """Decorator to ensure Earth Engine is initialized before calling the function."""
    def wrapper(*args, **kwargs):
        initialize_ee() # Check and initialize if needed for this thread/context
        if not getattr(_ee_initialized, 'status', False):
             # Handle case where initialization failed previously in this context
             raise RuntimeError("Earth Engine is not initialized or initialization failed.")
        try:
            return func(*args, **kwargs)
        except ee.EEException as e:
            logging.error(f"Earth Engine API error in {func.__name__}: {e}")
            # Consider returning a default value (like None or []) or raising a custom app error
            raise RuntimeError(f"An Earth Engine error occurred: {e}")
        except Exception as e:
            logging.exception(f"Unexpected error in GEE function {func.__name__}")
            raise # Re-raise other unexpected errors
    return wrapper


@lru_cache(maxsize=None) # Cache the result so the Geometry isn't recreated unnecessarily
@ensure_ee_initialized # Ensures EE is initialized before creating the geometry
def get_roi():
    """
    Returns the defined Region of Interest as an ee.Geometry object.
    Initializes EE if necessary and caches the resulting geometry.
    """
    logging.debug("Creating or retrieving cached ROI geometry.")
    # Define the geometry *inside* the function
    return ee.Geometry.Polygon([
        [121.32444567711659, 14.072763551368185],
        [121.33560366661854, 14.072763551368185],
        [121.33560366661854, 14.08383615993436],
        [121.32444567711659, 14.08383615993436],
        [121.32444567711659, 14.072763551368185]
    ])


@ensure_ee_initialized
def apply_stretch(image, band):
    """Applies a 90% stretch (5th to 95th percentile) to enhance visualization."""
    try:
        # Calculate 5th and 95th percentiles
        percentiles = image.select(band).reduceRegion(
            reducer=ee.Reducer.percentile([5, 95]),
            geometry=get_roi(),
            scale=30,
            maxPixels=1e9
        ).getInfo()

        min_val = percentiles.get(f'{band}_p5')
        max_val = percentiles.get(f'{band}_p95')

        if min_val is None or max_val is None:
            logging.warning(f"Could not calculate 5th/95th percentiles for band '{band}'. Using default range.")
            default_min, default_max = (-1, 1) if band == 'chlorophyll' else (0, 50)
            default_palette = ["blue", "green", "yellow", "red"]
            return image.visualize(bands=[band], min=default_min, max=default_max, palette=default_palette)

        if min_val == max_val:
            logging.warning(f"Min and Max percentiles are equal for band '{band}'. Adjusting range slightly.")
            min_val -= 0.01
            max_val += 0.01

        palette = ["blue", "green", "yellow", "red"]
        return image.visualize(bands=[band], min=min_val, max=max_val, palette=palette)

    except ee.EEException as e: # Catch specific GEE errors
        logging.error(f"GEE error applying stretch for band {band}: {e}")
        default_min, default_max = (-0.5, 0.5) if band == 'chlorophyll' else (0, 3000)
        default_palette = ["blue", "green", "yellow", "red"]
        return image.visualize(bands=[band], min=default_min, max=default_max, palette=default_palette)
    except Exception as e: # Catch other errors
        logging.exception(f"Unexpected error applying 90% stretch for band {band}")
        # Fallback visualization
        default_min, default_max = (-0.5, 0.5) if band == 'chlorophyll' else (0, 3000)
        default_palette = ["blue", "green", "yellow", "red"]
        return image.visualize(bands=[band], min=default_min, max=default_max, palette=default_palette)

@ensure_ee_initialized
def apply_water_mask(image):
    """Apply MNDWI water mask to an image."""
    mndwi = image.normalizedDifference(['B3', 'B8']).rename("MNDWI")
    water_mask = mndwi.gt(0)  # Keep only water pixels
    return image.updateMask(water_mask)

@ensure_ee_initialized
def get_visualization_and_params(image, parameter):
    """
    Processes an image for a given parameter, applies a stretch for visualization,
    and returns both the visualized image and the stretch parameters (min, max).
    """
    masked_image = apply_water_mask(image).clip(get_roi())
    
    # Determine the band name for processing and for percentile calculation
    if parameter == 'chlorophyll':
        processed_band_name = "chlorophyll_nd" # internal name for the normalized diff
        original_image_for_stretch = masked_image.normalizedDifference(['B5', 'B4']).rename(processed_band_name)
    elif parameter == 'turbidity':
        processed_band_name = "turbidity_nd"
        original_image_for_stretch = masked_image.normalizedDifference(['B4', 'B3']).rename(processed_band_name)
    elif parameter == 'tss':
        processed_band_name = "tss_nd"
        original_image_for_stretch = masked_image.normalizedDifference(['B2', 'B8']).rename(processed_band_name)
    else:
        logging.warning(f"Invalid parameter '{parameter}' received in get_visualization_and_params.")
        return None, None

    stretch_min, stretch_max = -1, 1 # Default values if percentiles fail
    palette = ["blue", "green", "yellow", "red"] # Default palette

    try:
        percentiles = original_image_for_stretch.select(processed_band_name).reduceRegion(
            reducer=ee.Reducer.percentile([5, 95]),
            geometry=get_roi(),
            scale=30,
            maxPixels=1e9
        ).getInfo()

        p5_key = f'{processed_band_name}_p5'
        p95_key = f'{processed_band_name}_p95'

        min_val_raw = percentiles.get(p5_key)
        max_val_raw = percentiles.get(p95_key)

        if min_val_raw is not None and max_val_raw is not None:
            stretch_min = float(min_val_raw)
            stretch_max = float(max_val_raw)
            if stretch_min == stretch_max: # Avoid min == max for visualization
                stretch_min -= 0.01
                stretch_max += 0.01
        else:
            logging.warning(f"Could not calculate 5th/95th percentiles for {parameter}. Using default range [-1, 1].")
            # Defaults are already set

    except Exception as e:
        logging.exception(f"Error calculating percentiles for {parameter}: {e}. Using default range [-1, 1].")
        # Defaults are already set

    # Visualize the *original_image_for_stretch* which contains the raw index values
    vis_image = original_image_for_stretch.visualize(
        bands=[processed_band_name], min=stretch_min, max=stretch_max, palette=palette
    )
    
    stretch_params = {'min': stretch_min, 'max': stretch_max}
    return vis_image, stretch_params

@ensure_ee_initialized
def filter_collection(start_date, end_date, cloud_cover=20):
    """Filter Sentinel-2 collection by date, bounds, and cloud cover."""
    return ee.ImageCollection('COPERNICUS/S2_HARMONIZED') \
        .filterBounds(get_roi()) \
        .filterDate(start_date, end_date) \
        .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', cloud_cover)

@ensure_ee_initialized
def get_dates(start_date, end_date, cloud_cover=20):
    """Fetch available dates for Sentinel-2 imagery within the given range."""
    collection = filter_collection(start_date, end_date, cloud_cover)
    try:
        available_dates = collection.aggregate_array('system:time_start').getInfo()
        if not available_dates:
            return []
        return [datetime.datetime.fromtimestamp(ts / 1000, datetime.timezone.utc).strftime('%Y-%m-%d')
                for ts in available_dates]
    except Exception as e:
        logging.error(f"Error fetching available dates: {e}")
        return []

@ensure_ee_initialized
def create_rgb_visualization(image):
    """Create RGB visualization from Sentinel-2 image."""
    rgb_vis = {
        'bands': ['B4', 'B3', 'B2'],
        'min': 0,
        'max': 3000,
        'gamma': 1.0
    }
    return image.visualize(**rgb_vis)

@ensure_ee_initialized
def get_composite_tiles(parameter, start_date, end_date, cloud_cover=20):
    collection = filter_collection(start_date, end_date, cloud_cover)
    median_image = collection.median() 
    
    vis_image, stretch_params = get_visualization_and_params(median_image, parameter)
    
    if vis_image is None:
        return None, None # Return None for both if processing failed
        
    tile_url = vis_image.getMapId()['tile_fetcher'].url_format
    return tile_url, stretch_params

@ensure_ee_initialized
def get_specific_date_tiles(parameter, date, cloud_cover=20):
    next_day = datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)
    next_day_str = next_day.strftime('%Y-%m-%d')
    collection = filter_collection(date, next_day_str, cloud_cover)
    count = collection.size().getInfo()
    if count == 0:
        return None, None # No image found
        
    image = collection.first()
    vis_image, stretch_params = get_visualization_and_params(image, parameter)

    if vis_image is None:
        return None, None
        
    tile_url = vis_image.getMapId()['tile_fetcher'].url_format
    return tile_url, stretch_params

@ensure_ee_initialized
def get_composite_rgb_tiles(start_date, end_date, cloud_cover=20):
    """Generate RGB visualization composite tiles from Sentinel-2."""
    collection = filter_collection(start_date, end_date, cloud_cover)
    median_image = collection.median().clip(get_roi()) # Explicit clip for RGB
    rgb_image = create_rgb_visualization(median_image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url

@ensure_ee_initialized
def get_specific_date_rgb_tiles(date, cloud_cover=20):
    """Generate RGB visualization tiles from Sentinel-2 for a specific date."""
    next_day = datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)
    next_day_str = next_day.strftime('%Y-%m-%d')
    collection = filter_collection(date, next_day_str, cloud_cover)
    count = collection.size().getInfo()
    if count == 0:
        return None
    image = collection.first().clip(get_roi()) # Explicit clip for RGB
    rgb_image = create_rgb_visualization(image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url

@ensure_ee_initialized
def _prepare_parameter_image(image, parameter):
    """Helper function to process an image for a specific parameter."""
    masked_image = apply_water_mask(image)
    
    if parameter == 'chlorophyll':
        processed = masked_image.normalizedDifference(['B5', 'B4']).rename(parameter)
    elif parameter == 'turbidity':
        processed = masked_image.normalizedDifference(['B4', 'B3']).rename(parameter)
    elif parameter == 'tss':
        processed = masked_image.normalizedDifference(['B2', 'B8']).rename(parameter)
    else:
        return None
        
    date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
    return processed.set('date', date)

@ensure_ee_initialized
def _process_parameter_time_series(processed_collection, parameter, geometry, scale=30):
    """Helper function to process time series data for a parameter."""
    def reduce_region(image):
        date = image.get('date')
        stats = image.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry,
            scale=scale
        ).get(parameter)
        return ee.Feature(None, {parameter: stats, 'date': date})
    
    parameter_time_series = processed_collection.map(reduce_region)
    parameter_values = parameter_time_series.aggregate_array(parameter).getInfo()
    dates = parameter_time_series.aggregate_array('date').getInfo()
    
    # Pair dates and values, then filter out invalid entries
    paired = list(zip(dates, parameter_values))
    filtered = [(date, value) for date, value in paired if date is not None and value is not None]
    
    # Unpack and sort by date
    values = [{'date': date, 'value': value} for date, value in filtered]
    values.sort(key=lambda x: x['date'])
    
    return values

@ensure_ee_initialized
def get_parameter_values(parameter, start_date, end_date, cloud_cover=20):
    """Fetch parameter values for analysis from Sentinel-2 imagery."""
    try:
        collection = filter_collection(start_date, end_date, cloud_cover)
        processed_collection = collection.map(lambda img: _prepare_parameter_image(img, parameter))
        return _process_parameter_time_series(processed_collection, parameter, get_roi())
    except Exception as e:
        print(f"Error in get_parameter_values: {str(e)}")
        return []

@ensure_ee_initialized
def get_point_parameter_values(parameter, point_coords, start_date, end_date, cloud_cover=20):
    """Fetch parameter values at a specific point from Sentinel-2 imagery."""
    try:
        point = ee.Geometry.Point(point_coords)
        collection = filter_collection(start_date, end_date, cloud_cover).filterBounds(point)
        processed_collection = collection.map(lambda img: _prepare_parameter_image(img, parameter))
        return _process_parameter_time_series(processed_collection, parameter, point, 10)  # Using 10m scale for point
    except Exception as e:
        print(f"Error in get_point_parameter_values: {str(e)}")
        return []
