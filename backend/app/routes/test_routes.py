from flask import Blueprint, jsonify
from app import db
from sqlalchemy import text

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