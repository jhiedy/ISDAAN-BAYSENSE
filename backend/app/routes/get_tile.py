# BAYSENSE-APP/backend/app/routes/get_tile.py
from flask import Blueprint, jsonify, request
from app.utils.ee_service import (
    get_composite_tiles, 
    get_specific_date_tiles, 
    get_composite_rgb_tiles, 
    get_specific_date_rgb_tiles,
    get_dates,
    get_parameter_values,
    get_point_parameter_values
)
# Removed unused import ee

tile_routes = Blueprint("tile_routes", __name__)

@tile_routes.route('/get_composite_tile', methods=['GET'])
def get_composite_tile_route(): # Renamed to avoid conflict with imported function
    parameter = request.args.get('parameter', 'chlorophyll')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    tile_url, stretch_params = get_composite_tiles(parameter, start_date, end_date, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "Failed to generate tiles or invalid parameter"}), 400

    return jsonify({
        "tile_url": tile_url,
        "legend_min": stretch_params['min'] if stretch_params else None,
        "legend_max": stretch_params['max'] if stretch_params else None
    })

@tile_routes.route('/get_specific_date_tile', methods=['GET'])
def get_specific_date_tile_route(): # Renamed
    parameter = request.args.get('parameter', 'chlorophyll')
    date = request.args.get('date')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    tile_url, stretch_params = get_specific_date_tiles(parameter, date, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "No imagery available for the specified date or invalid parameter"}), 404

    return jsonify({
        "tile_url": tile_url,
        "legend_min": stretch_params['min'] if stretch_params else None,
        "legend_max": stretch_params['max'] if stretch_params else None
    })

@tile_routes.route('/get_composite_rgb_tile', methods=['GET'])
def get_composite_rgb_tile_route(): # Renamed
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    tile_url = get_composite_rgb_tiles(start_date, end_date, cloud_cover) # RGB might not have stretch params this way
    
    if not tile_url:
        return jsonify({"error": "Failed to generate RGB tiles"}), 500

    # RGB visualization usually has fixed min/max, not dynamic percentile stretch
    # So, not returning legend_min/max here unless you implement dynamic stretch for RGB too
    return jsonify({"tile_url": tile_url}) 

@tile_routes.route('/get_specific_date_rgb_tile', methods=['GET'])
def get_specific_date_rgb_tile_route(): # Renamed
    date = request.args.get('date')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    tile_url = get_specific_date_rgb_tiles(date, cloud_cover) # RGB might not have stretch params
    
    if not tile_url:
        return jsonify({"error": "No imagery available for the specified date"}), 404

    return jsonify({"tile_url": tile_url})

@tile_routes.route('/get_available_dates', methods=['GET'])
def get_available_dates_route(): # Renamed
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    available_dates = get_dates(start_date, end_date, cloud_cover)
    return jsonify({"available_dates": available_dates})

# Legacy routes - update them to also return stretch params if they call the modified functions
@tile_routes.route('/get_tile', methods=['GET'])
def get_tile_legacy_route(): # Renamed
    parameter = request.args.get('parameter', 'chlorophyll')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    date = request.args.get('date')
    
    tile_url = None
    stretch_params = None

    if date:
        tile_url, stretch_params = get_specific_date_tiles(parameter, date, cloud_cover)
    else:
        tile_url, stretch_params = get_composite_tiles(parameter, start_date, end_date, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "Failed to generate tiles or invalid parameter"}), 400

    return jsonify({
        "tile_url": tile_url,
        "legend_min": stretch_params['min'] if stretch_params else None,
        "legend_max": stretch_params['max'] if stretch_params else None
    })

@tile_routes.route('/get_rgb_tile', methods=['GET'])
def get_rgb_tile_legacy_route(): # Renamed
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))
    date = request.args.get('date')
    
    tile_url = None
    if date:
        tile_url = get_specific_date_rgb_tiles(date, cloud_cover)
    else:
        tile_url = get_composite_rgb_tiles(start_date, end_date, cloud_cover)
    
    if not tile_url:
        return jsonify({"error": "Failed to generate RGB tiles"}), 500

    return jsonify({"tile_url": tile_url}) # RGB usually has fixed stretch

@tile_routes.route('/get_parameter_values', methods=['GET'])
def get_parameter_values_route():
    parameter = request.args.get('parameter', 'chlorophyll')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    try:
        values = get_parameter_values(parameter, start_date, end_date, cloud_cover)
        return jsonify({"values": values})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tile_routes.route('/get_point_parameter_values', methods=['GET'])
def get_point_parameter_values_route():
    parameter = request.args.get('parameter', 'chlorophyll')
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    cloud_cover = int(request.args.get('cloud_cover', 20))

    if lat is None or lng is None:
        return jsonify({"error": "Latitude and longitude parameters are required"}), 400

    try:
        values = get_point_parameter_values(parameter, (lng, lat), start_date, end_date, cloud_cover)
        return jsonify({"values": values})
    except Exception as e:
        return jsonify({"error": str(e)}), 500