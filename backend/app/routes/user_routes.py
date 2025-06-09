from flask import Blueprint, jsonify, request
from app.models import User, FishFarm
from app import db
from app.routes.auth_routes import bcrypt 
from sqlalchemy import or_

user_routes = Blueprint('user_routes', __name__)

# Retrieve all registered and verified users
@user_routes.route('/api/retrieve-registered-users', methods=['GET'])
def retrieve_registered_users():
    """
    Retrieve a list of all registered and verified users.
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Fetch all users that are registered and verified by the admin from the database
        registered_users = User.query.filter(
            (User.is_registered == True) & (User.is_verified == True)
        )
        
        # Paginate the results
        paginated_users = registered_users.paginate(page=page, per_page=per_page, error_out=False)
        
        # Convert the list of User objects to a list of dictionaries
        users_list = []
        for user in paginated_users.items:
            user_data = {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "contact_no": user.contact_no,
                "created_at": user.created_at,
                "is_registered": user.is_registered,
                "is_verified": user.is_verified,
                "farm_affiliation": None
            }
            
            if user.farm_affiliation:
                farm = FishFarm.query.get(user.farm_affiliation)
                if farm:
                    user_data["farm_affiliation"] = farm.farm_name
            
            users_list.append(user_data)
        
        # Return the list of registered users and pagination as response
        return jsonify({
            "users": users_list,
            "total_count": paginated_users.total,
            "page": paginated_users.page,
            "per_page": paginated_users.per_page
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve registered users", "details": str(e)}), 500

# Retrieve users by farm_id
@user_routes.route('/api/retrieve-users-by-farm/<int:farm_id>', methods=['GET'])
def retrieve_users_by_farm(farm_id):
    """
    Retrieve users associated with a specific farm_id.
    """
    try:
        # Fetch users that belong to the specified farm_id
        users = User.query.filter_by(farm_affiliation=farm_id).all()
        
        if not users:
            return jsonify({"message": "No users found for the given farm ID"}), 404
        
        # Convert the list of User objects to a list of dictionaries
        users_list = [{
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "contact_no": user.contact_no,
            "is_registered": user.is_registered,
            "is_verified": user.is_verified,
            "farm_affiliation": user.farm_affiliation
        } for user in users]
        
        # Return the list of users as response
        return jsonify(users_list), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve users by farm ID", "details": str(e)}), 500

# Update a specific user by ID
@user_routes.route('/api/update-user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Update a specific user by ID.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json()
        user.name = data.get('name', user.name)
        user.email = data.get('email', user.email)
        user.contact_no = data.get('contact_no', user.contact_no)
        
        # Handle password update with proper hashing
        password = data.get('password')
        if password:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            user.password = hashed_password
        
        user.is_registered = data.get('is_registered', user.is_registered)
        user.is_verified = data.get('is_verified', user.is_verified)
        user.farm_affiliation = data.get('farm_affiliation', user.farm_affiliation)
        
        db.session.commit()
        return jsonify({
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "contact_no": user.contact_no,
            "is_registered": user.is_registered,
            "is_verified": user.is_verified,
            "farm_affiliation": user.farm_affiliation
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update user", "details": str(e)}), 500

# Delete a specific user by ID
@user_routes.route('/api/delete-user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    Delete a specific user by ID.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete user", "details": str(e)}), 500
    
@user_routes.route('/api/retrieve-pending-registrations', methods=['GET'])
def retrieve_pending_registrations():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query for users who are not registered or not verified
        query = User.query.filter(
            (User.is_registered == False) | (User.is_verified == False)
        )
        
        # Paginate the results
        paginated_users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Get farm names for each user
        users_with_farms = []
        for user in paginated_users.items:
            user_data = {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "contact_no": user.contact_no,
                "created_at": user.created_at,
                "is_registered": user.is_registered,
                "is_verified": user.is_verified,
                "farm_affiliation": None
            }
            
            if user.farm_affiliation:
                farm = FishFarm.query.get(user.farm_affiliation)
                if farm:
                    user_data["farm_affiliation"] = farm.farm_name
            
            users_with_farms.append(user_data)
        
        return jsonify({
            "users": users_with_farms,
            "total_count": paginated_users.total,
            "page": paginated_users.page,
            "per_page": paginated_users.per_page
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to retrieve pending registrations", "details": str(e)}), 500
    
@user_routes.route('/api/search-registered-users', methods=['GET'])
def search_registered_users():
    """
    Retrieve a paginated list of registered and verified users filtered by a search term.
    The search term filters by user name or email (case-insensitive).
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search_term = request.args.get('search_term', '', type=str)

        # Base query for registered and verified users
        query = User.query.filter(
            User.is_registered == True,
            User.is_verified == True
        )

        # Apply search filter if search_term is provided
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                    # Add other fields to search here if needed, e.g., contact_no
                    # User.contact_no.ilike(search_pattern)
                )
            )

        # Add ordering
        query = query.order_by(User.name) # Or User.created_at, etc.

        # Paginate the results
        paginated_users = query.paginate(page=page, per_page=per_page, error_out=False)

        # Convert the list of User objects to a list of dictionaries
        users_list = []
        for user in paginated_users.items:
            user_data = {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "contact_no": user.contact_no,
                "created_at": user.created_at.isoformat(), # Use isoformat for consistency
                "is_registered": user.is_registered,
                "is_verified": user.is_verified,
                "farm_affiliation": None
            }

            # Fetch farm name if affiliation exists
            if user.farm_affiliation:
                farm = FishFarm.query.get(user.farm_affiliation)
                if farm:
                    user_data["farm_affiliation"] = farm.farm_name

            users_list.append(user_data)

        # Return the list of registered users and pagination as response
        return jsonify({
            "users": users_list,
            "total_count": paginated_users.total,
            "page": paginated_users.page,
            "per_page": paginated_users.per_page
        }), 200
    except Exception as e:
        # Consider logging the error e
        return jsonify({"error": "Failed to search registered users", "details": str(e)}), 500


@user_routes.route('/api/search-pending-users', methods=['GET'])
def search_pending_users():
    """
    Retrieve a paginated list of pending (unregistered or unverified) users
    filtered by a search term.
    The search term filters by user name or email (case-insensitive).
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search_term = request.args.get('search_term', '', type=str)

        # Base query for pending users (not registered OR not verified)
        query = User.query.filter(
            or_(
                User.is_registered == False,
                User.is_verified == False
            )
        )

        # Apply search filter if search_term is provided
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                    # Add other fields to search here if needed
                )
            )

        # Add ordering
        query = query.order_by(User.created_at.desc()) # Show newest pending first

        # Paginate the results
        paginated_users = query.paginate(page=page, per_page=per_page, error_out=False)

        # Convert the list of User objects to a list of dictionaries
        users_list = []
        for user in paginated_users.items:
            user_data = {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "contact_no": user.contact_no,
                "created_at": user.created_at.isoformat(), # Use isoformat
                "is_registered": user.is_registered,
                "is_verified": user.is_verified,
                "farm_affiliation": None
            }

            # Fetch farm name if affiliation exists
            if user.farm_affiliation:
                farm = FishFarm.query.get(user.farm_affiliation)
                if farm:
                    user_data["farm_affiliation"] = farm.farm_name

            users_list.append(user_data)

        # Return the list of pending users and pagination as response
        return jsonify({
            "users": users_list,
            "total_count": paginated_users.total,
            "page": paginated_users.page,
            "per_page": paginated_users.per_page
        }), 200
    except Exception as e:
        # Consider logging the error e
        return jsonify({"error": "Failed to search pending users", "details": str(e)}), 500