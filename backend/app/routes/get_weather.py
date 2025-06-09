from flask import Blueprint, jsonify, request
import requests
import os
from dotenv import load_dotenv

"""
Routes for fetching weather data from OpenWeatherMap API
"""


# Load environment variables from .env file
load_dotenv()

weather_routes = Blueprint("weather_routes", __name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

@weather_routes.route('/get_weather', methods=['GET'])
def get_weather():
    """Fetch 5-day / 3-hour forecast from OpenWeatherMap."""
    
    lat = request.args.get('lat', "14.0782")
    lon = request.args.get('lon', "121.3301")
    
    # Check the OpenWeather API key
    if not OPENWEATHER_API_KEY:
        return jsonify({"error": "Missing OpenWeatherMap API key"}), 500

    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch weather data", "details": data}), response.status_code
        
        # Extract relevant weather data
        forecast = []
        for entry in data["list"]:
            forecast.append({
                "datetime": entry["dt_txt"],
                "temperature": entry["main"]["temp"],  # °C
                "humidity": entry["main"]["humidity"],  # %
                "rainfall": entry.get("rain", {}).get("3h", 0),  # mm
                "gust_speed": entry.get("wind", {}).get("gust", 0)  # m/s
            })
        
        return jsonify({"location": data["city"]["name"], "forecast": forecast})
    
    except Exception as e:
        return jsonify({"error": "Failed to fetch weather data", "details": str(e)}), 500

