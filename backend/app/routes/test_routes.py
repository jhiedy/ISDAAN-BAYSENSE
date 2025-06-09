from flask import Blueprint, jsonify
from app import db
from sqlalchemy import text
from app.models import FishFarm

test_routes = Blueprint('test_routes', __name__)

"""
Routes for checking the connection of the backend to the database
"""

@test_routes.route('/api/test-db', methods=['GET'])
def test_db():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'message': 'Database connection successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@test_routes.route('/api/fish-farms', methods=['GET'])
def get_fish_farms():
    try:
        # Query all fish farms
        fish_farms = FishFarm.query.all()

        # Convert the result to a list of dictionaries
        fish_farms_list = []
        for farm in fish_farms:
            fish_farms_list.append({
                'farm_id': farm.farm_id,
                'farm_name': farm.farm_name,
                'owner': farm.owner,
                'date_established': farm.date_established.isoformat() if farm.date_established else None
            })

        return jsonify({'fish_farms': fish_farms_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500