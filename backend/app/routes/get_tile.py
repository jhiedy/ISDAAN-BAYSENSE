from flask import Blueprint, jsonify, request
import os
import json
from dotenv import load_dotenv

# Import the updated, asset-specific functions from ee_service
from app.utils.isdaan_ee_service import (
    get_composite_tiles_for_asset,
    get_specific_date_tiles_for_asset,
    get_composite_rgb_tiles_for_asset,
    get_specific_date_rgb_tiles_for_asset,
    get_available_dates_for_asset,
    get_parameter_values_per_polygon,
    get_asset_details 
)

# Load environment variables
load_dotenv()

# Load the asset ID from environment variables to be used in all routes
ISDAAN_FLAS_ASSET_ID = os.getenv("ISDAAN_FLAS_ASSET_ID")

tile_routes = Blueprint("tile_routes", __name__)

@tile_routes.route('/get_available_dates', methods=['GET'])
def get_available_dates_route():
    """
    Gets a list of available dates with imagery for the specified asset.
    """
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2025-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    available_dates = get_available_dates_for_asset(start_date, end_date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
    return jsonify({"available_dates": available_dates})

@tile_routes.route('/get_composite_tile', methods=['GET'])
def get_composite_tile_route():
    """
    Generates a composite (median) tile layer for a given parameter and date range.
    """
    parameter = request.args.get('parameter', 'chlorophyll')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2025-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    tile_url, stretch_params = get_composite_tiles_for_asset(parameter, start_date, end_date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "Failed to generate tiles or invalid parameter"}), 400

    return jsonify({
        "tile_url": tile_url,
        "legend_min": stretch_params['min'] if stretch_params else None,
        "legend_max": stretch_params['max'] if stretch_params else None
    })

@tile_routes.route('/get_specific_date_tile', methods=['GET'])
def get_specific_date_tile_route():
    """
    Generates a tile layer for a specific date and parameter.
    """
    parameter = request.args.get('parameter', 'chlorophyll')
    date = request.args.get('date')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    tile_url, stretch_params = get_specific_date_tiles_for_asset(parameter, date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "No imagery available for the specified date or invalid parameter"}), 404

    return jsonify({
        "tile_url": tile_url,
        "legend_min": stretch_params['min'] if stretch_params else None,
        "legend_max": stretch_params['max'] if stretch_params else None
    })

@tile_routes.route('/get_composite_rgb_tile', methods=['GET'])
def get_composite_rgb_tile_route():
    """
    Generates a true-color (RGB) composite tile layer.
    """
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2025-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    tile_url = get_composite_rgb_tiles_for_asset(start_date, end_date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "Failed to generate RGB tiles"}), 500

    return jsonify({"tile_url": tile_url})

@tile_routes.route('/get_specific_date_rgb_tile', methods=['GET'])
def get_specific_date_rgb_tile_route():
    """
    Generates a true-color (RGB) tile layer for a specific date.
    """
    date = request.args.get('date')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    tile_url = get_specific_date_rgb_tiles_for_asset(date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "No imagery available for the specified date"}), 404

    return jsonify({"tile_url": tile_url})

@tile_routes.route('/get_parameter_values', methods=['GET'])
def get_parameter_values_route():
    """
    Gets time-series data for a parameter, calculated for each polygon in the asset.
    """
    parameter = request.args.get('parameter', 'chlorophyll')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2025-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    try:
        values = get_parameter_values_per_polygon(parameter, start_date, end_date, ISDAAN_FLAS_ASSET_ID, cloud_cover)
        return jsonify(values)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tile_routes.route('/get_asset_features', methods=['GET'])
def get_asset_features_route():
    """
    Gets the details of all features in the asset, including properties and geometry.
    """
    try:
        # get_asset_details returns a JSON string, so we parse it back to a dict
        # to let Flask handle the JSO correctly with the right content type.
        features_json_string = get_asset_details(ISDAAN_FLAS_ASSET_ID)
        features_dict = json.loads(features_json_string)
        return jsonify(features_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500