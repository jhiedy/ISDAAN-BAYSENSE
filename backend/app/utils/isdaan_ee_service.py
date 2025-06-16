import ee
import os
import json
import threading
import datetime
import logging
from dotenv import load_dotenv
from functools import lru_cache

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

@lru_cache(maxsize=5)
@ensure_ee_initialized
def load_ee_asset(asset_id: str) -> ee.FeatureCollection:
    """
    Loads an Earth Engine FeatureCollection asset.
    Caches the result to avoid redundant loads.
    """
    logging.info(f"Loading EE asset: {asset_id}")
    try:
        return ee.FeatureCollection(asset_id)
    except ee.EEException as e:
        logging.error(f"Failed to load Earth Engine asset '{asset_id}': {e}")
        raise

@ensure_ee_initialized
def get_asset_details(asset_id: str) -> str:
    """
    Returns all details (properties and geometry) from the specified EE asset
    in a GeoJSON-compliant JSON format.
    """
    logging.info(f"Fetching details including geometry for asset: {asset_id}")
    try:
        asset = load_ee_asset(asset_id)
        asset_info = asset.getInfo() # returns a GeoJSON dictionary
        
        return json.dumps(asset_info, indent=2)
    except Exception as e:
        logging.error(f"Error fetching details for asset {asset_id}: {e}")
        return json.dumps({"error": str(e)})

@ensure_ee_initialized
def get_combined_roi(asset_id: str) -> ee.Geometry:
    """
    Creates a single, combined geometry from all polygons in an EE asset.
    This is used for generating map tiles that cover the entire area of interest.
    """
    logging.debug(f"Creating combined ROI from asset: {asset_id}")
    asset = load_ee_asset(asset_id)
    # Dissolve all polygons into a single geometry
    return asset.union(maxError=1).geometry()

@ensure_ee_initialized
def filter_collection(roi: ee.Geometry, start_date: str, end_date: str, cloud_cover: int = 20) -> ee.ImageCollection:
    """Filter Sentinel-2 collection by date, a given ROI, and cloud cover."""
    return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(roi) \
        .filterDate(start_date, end_date) \
        .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', cloud_cover)
@ensure_ee_initialized
def get_available_dates_for_asset(start_date: str, end_date: str, asset_id: str, cloud_cover: int = 20):
    """Fetch available dates for Sentinel-2 imagery for a given asset and date range."""
    roi = get_combined_roi(asset_id)
    collection = filter_collection(roi, start_date, end_date, cloud_cover)
    try:
        available_dates = collection.aggregate_array('system:time_start').getInfo()
        if not available_dates:
            return []
        # Convert timestamps (in ms) to 'YYYY-MM-DD' format
        return sorted(list(set([datetime.datetime.fromtimestamp(ts / 1000, datetime.timezone.utc).strftime('%Y-%m-%d')
                for ts in available_dates])))
    except Exception as e:
        logging.error(f"Error fetching available dates for asset {asset_id}: {e}")
        return []

@ensure_ee_initialized
def apply_water_mask(image: ee.Image) -> ee.Image:
    """Apply MNDWI water mask to an image."""
    mndwi = image.normalizedDifference(['B3', 'B8']).rename("MNDWI")
    water_mask = mndwi.gt(0)  # Keep only water pixels
    return image.updateMask(water_mask)

@ensure_ee_initialized
def get_visualization_and_params(image: ee.Image, parameter: str, roi: ee.Geometry):
    """
    Processes an image for a given parameter, applies a percentile stretch
    based on the ROI, and returns the visualized image and stretch parameters.
    """
    masked_image = image.clip(roi)
    
    # Determine the band name for processing
    if parameter == 'chlorophyll':
        processed_band_name = "chlorophyll_nd"
        processed_image = masked_image.normalizedDifference(['B5', 'B4']).rename(processed_band_name)
    elif parameter == 'turbidity':
        processed_band_name = "turbidity_nd"
        processed_image = masked_image.normalizedDifference(['B4', 'B3']).rename(processed_band_name)
    elif parameter == 'tss':
        processed_band_name = "tss_nd"
        processed_image = masked_image.normalizedDifference(['B2', 'B8']).rename(processed_band_name)
    else:
        logging.warning(f"Invalid parameter '{parameter}' received.")
        return None, None

    stretch_min, stretch_max = -1, 1
    palette = ["blue", "green", "yellow", "red"]

    try:
        percentiles = processed_image.select(processed_band_name).reduceRegion(
            reducer=ee.Reducer.percentile([5, 95]),
            geometry=roi,
            scale=30,
            maxPixels=1e9
        ).getInfo()

        min_val = percentiles.get(f'{processed_band_name}_p5')
        max_val = percentiles.get(f'{processed_band_name}_p95')

        if min_val is not None and max_val is not None:
            stretch_min = float(min_val)
            stretch_max = float(max_val)
            if stretch_min == stretch_max:
                stretch_min -= 0.01
                stretch_max += 0.01
        else:
            logging.warning(f"Could not calculate percentiles for {parameter}. Using default range [-1, 1].")

    except Exception as e:
        logging.exception(f"Error calculating percentiles for {parameter}: {e}. Using default range [-1, 1].")

    vis_image = processed_image.visualize(
        bands=[processed_band_name], min=stretch_min, max=stretch_max, palette=palette
    )
    
    stretch_params = {'min': stretch_min, 'max': stretch_max}
    return vis_image, stretch_params

@ensure_ee_initialized
def get_composite_tiles_for_asset(parameter: str, start_date: str, end_date: str, asset_id: str, cloud_cover: int = 20):
    """
    Generates composite map tiles for a specified parameter and EE asset.
    """
    roi = get_combined_roi(asset_id)
    collection = filter_collection(roi, start_date, end_date, cloud_cover)
    median_image = collection.median()
    
    vis_image, stretch_params = get_visualization_and_params(median_image, parameter, roi)
    
    if vis_image is None:
        return None, None
        
    tile_url = vis_image.getMapId()['tile_fetcher'].url_format
    return tile_url, stretch_params

@ensure_ee_initialized
def get_specific_date_tiles_for_asset(parameter: str, date: str, asset_id: str, cloud_cover: int = 20):
    """Generate tiles for a specific parameter and date for a given EE asset."""
    roi = get_combined_roi(asset_id)
    next_day = datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)
    next_day_str = next_day.strftime('%Y-%m-%d')
    
    collection = filter_collection(roi, date, next_day_str, cloud_cover)
    
    count = collection.size().getInfo()
    if count == 0:
        logging.warning(f"No image found for parameter '{parameter}' on date {date} for asset {asset_id}")
        return None, None # No image found for this date
        
    image = collection.first()
    vis_image, stretch_params = get_visualization_and_params(image, parameter, roi)

    if vis_image is None:
        return None, None # Visualization failed
        
    tile_url = vis_image.getMapId()['tile_fetcher'].url_format
    return tile_url, stretch_params

@ensure_ee_initialized
def _prepare_parameter_image(image: ee.Image, parameter: str):
    """Helper to calculate a parameter for an image and set the date."""    
    if parameter == 'chlorophyll':
        processed = image.normalizedDifference(['B5', 'B4']).rename(parameter)
    elif parameter == 'turbidity':
        processed = image.normalizedDifference(['B4', 'B3']).rename(parameter)
    elif parameter == 'tss':
        processed = image.normalizedDifference(['B2', 'B8']).rename(parameter)
    else:
        return None # Return None if the parameter is invalid
        
    date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
    return processed.set('date', date)

@ensure_ee_initialized
def get_parameter_values_per_polygon(parameter: str, start_date: str, end_date: str, asset_id: str, cloud_cover: int = 20):
    """
    Fetches time-series data for a parameter for each polygon in the specified EE asset.
    The output is a dictionary where keys are polygon identifiers.
    """
    try:
        asset = load_ee_asset(asset_id)

        feature_names = asset.aggregate_array('Name').getInfo() 
        
        # Get the combined geometry for efficient initial filtering
        combined_roi = get_combined_roi(asset_id)
        collection = filter_collection(combined_roi, start_date, end_date, cloud_cover)
        
        processed_collection = collection.map(lambda img: _prepare_parameter_image(img, parameter))

        results = {}

        for name in feature_names:
            # Filter the asset to get the geometry of the current polygon
            feature = asset.filter(ee.Filter.eq('Name', name)).first()
            geometry = feature.geometry()
            
            def reduce_region(image):
                """Closure to reduce each image in the collection over the polygon's geometry."""
                stats = image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=geometry,
                    scale=30, # Scale for Sentinel-2
                    maxPixels=1e9
                ).get(parameter)
                return ee.Feature(None, {'value': stats, 'date': image.get('date')})

            time_series = processed_collection.map(reduce_region).getInfo()
            
            # Clean and format the results
            polygon_values = [
                item['properties'] for item in time_series['features'] 
                if item['properties'].get('date') and item['properties'].get('value') is not None
            ]
            polygon_values.sort(key=lambda x: x['date']) # Sort by date
            
            results[name] = polygon_values

        return results

    except Exception as e:
        logging.error(f"Error in get_parameter_values_per_polygon: {e}")
        return {}

@ensure_ee_initialized
def create_rgb_visualization(image: ee.Image) -> ee.Image:
    """Create RGB visualization from Sentinel-2 image."""
    rgb_vis = {
        'bands': ['B4', 'B3', 'B2'],
        'min': 0,
        'max': 3000,
        'gamma': 1.0
    }
    return image.visualize(**rgb_vis)

@ensure_ee_initialized
def get_composite_rgb_tiles_for_asset(start_date: str, end_date: str, asset_id: str, cloud_cover: int = 20) -> str:
    """Generate composite RGB visualization tiles for a given EE asset."""
    roi = get_combined_roi(asset_id)
    collection = filter_collection(roi, start_date, end_date, cloud_cover)
    median_image = collection.median().clip(roi) # Explicitly clip the final image
    rgb_image = create_rgb_visualization(median_image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url

@ensure_ee_initialized
def get_specific_date_rgb_tiles_for_asset(date: str, asset_id: str, cloud_cover: int = 20) -> str:
    """Generate specific date RGB visualization tiles for a given EE asset."""
    roi = get_combined_roi(asset_id)
    next_day = datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)
    next_day_str = next_day.strftime('%Y-%m-%d')
    
    collection = filter_collection(roi, date, next_day_str, cloud_cover)
    
    count = collection.size().getInfo()
    if count == 0:
        logging.warning(f"No image found for date {date} and asset {asset_id}")
        return None
        
    image = collection.first().clip(roi) # Explicitly clip the image
    rgb_image = create_rgb_visualization(image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url

@ensure_ee_initialized
def create_geometry_from_coordinates(coordinates_list):
    """
    Creates an ee.Geometry from a list of polygon coordinates.
    Each polygon is defined by a list of coordinate points.
    """
    polygons = []
    for coords in coordinates_list:
        # Convert coordinates to ee.Geometry.Polygon
        polygon = ee.Geometry.Polygon(coords)
        polygons.append(polygon)
    
    # Combine all polygons into a single geometry
    return ee.Geometry.MultiPolygon([poly.coordinates() for poly in polygons])

@ensure_ee_initialized
def get_composite_rgb_tiles_for_polygons(start_date: str, end_date: str, coordinates_list: list, cloud_cover: int = 20) -> str:
    """
    Generate composite RGB visualization tiles for given polygon coordinates.
    Similar to get_composite_rgb_tiles_for_asset but uses direct coordinates instead of an asset.
    """
    roi = create_geometry_from_coordinates(coordinates_list)
    collection = filter_collection(roi, start_date, end_date, cloud_cover)
    median_image = collection.median().clip(roi)
    rgb_image = create_rgb_visualization(median_image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url

@ensure_ee_initialized
def get_specific_date_rgb_tiles_for_polygons(date: str, coordinates_list: list, cloud_cover: int = 20) -> str:
    """
    Generate specific date RGB visualization tiles for given polygon coordinates.
    Similar to get_specific_date_rgb_tiles_for_asset but uses direct coordinates instead of an asset.
    """
    roi = create_geometry_from_coordinates(coordinates_list)
    next_day = datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)
    next_day_str = next_day.strftime('%Y-%m-%d')
    
    collection = filter_collection(roi, date, next_day_str, cloud_cover)
    
    count = collection.size().getInfo()
    if count == 0:
        logging.warning(f"No image found for date {date} for the provided polygons")
        return None
        
    image = collection.first().clip(roi)
    rgb_image = create_rgb_visualization(image)
    tile_url = rgb_image.getMapId()['tile_fetcher'].url_format
    return tile_url