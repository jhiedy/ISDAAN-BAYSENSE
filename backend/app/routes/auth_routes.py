from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
import jwt 
import datetime
from app import db
from app.models import User, Admin
from functools import wraps

print(jwt.__file__)

# Create a Blueprint for authentication routes
auth_routes = Blueprint('auth_routes', __name__)

# Initialize Bcrypt for password hashing
bcrypt = Bcrypt()

# JWT token expiration time
TOKEN_EXPIRATION = datetime.timedelta(hours=1)

# Helper function to generate JWT token
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + TOKEN_EXPIRATION  # Use timezone-aware datetime
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')  # Use SECRET_KEY from Flask config
    return token

# Helper function to verify JWT token
def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])  # Use SECRET_KEY from Flask config
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

# Decorator to protect routes that require authentication
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # Handle admin tokens
            if payload.get('is_admin'):
                admin_id = payload['admin_id']
                admin = Admin.query.get(admin_id)
                if not admin:
                    return jsonify({'error': 'Admin not found'}), 404
                return f(admin, *args, **kwargs)
            # Handle user tokens
            else:
                user_id = payload['user_id']
                user = User.query.get(user_id)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                return f(user, *args, **kwargs)
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication error: {str(e)}'}), 401

    return decorated

# Route to get current user's data
@auth_routes.route('/api/me', methods=['GET'])
@token_required
def get_current_user(user):
    return jsonify({
        "name": user.name,
        "email": user.email,
        "contact_no": user.contact_no,
    })
    
@auth_routes.route('/api/admin/me', methods=['GET'])
@token_required
def get_current_admin(user_or_admin):
    if not getattr(user_or_admin, 'is_admin', False):
        return jsonify({'error': 'Admin access required'}), 403
        
    admin = user_or_admin
    return jsonify({
        'username': admin.username,
        'admin_id': admin.admin_id
    })

# Signup route
@auth_routes.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    contact_no = data.get('contact_no')
    farm_affiliation = data.get('farm_affiliation')

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400
    
    # Check if the farm_affiliation is valid
    if not FishFarm.query.get(farm_affiliation):
        return jsonify({'error': 'Invalid farm affiliation'}), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create new user
    new_user = User(
        name=name,
        email=email,
        password=hashed_password,  # Save the hashed password
        contact_no=contact_no,
        farm_affiliation=farm_affiliation,
        is_registered=False,
        is_verified=False,
    )
    db.session.add(new_user)
    db.session.commit()

    # Generate JWT token for the new user
    token = generate_token(new_user.user_id)

    return jsonify({
        'message': 'User created successfully',
        'user_id': new_user.user_id,
        'token': token
    }), 201

@auth_routes.route('/api/auth/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    admin = Admin.query.filter_by(username=username).first()

    if admin and bcrypt.check_password_hash(admin.password, password):
        payload = {
            'admin_id': admin.admin_id,
            'is_admin': True,
            'exp': datetime.datetime.now(datetime.timezone.utc) + TOKEN_EXPIRATION
        }
        token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({
            'message': 'Admin login successful',
            'admin_id': admin.admin_id,
            'token': token
        }), 200
    else:
        return jsonify({'error': 'Invalid admin credentials'}), 401

# Login route
@auth_routes.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Find the user by email
    user = User.query.filter_by(email=email).first()

    # Check if the user exists and the password is correct
    if user and bcrypt.check_password_hash(user.password, password):
        # Check if user is registered and verified
        if not user.is_registered:
            return jsonify({'error': 'Account not yet registered. Please wait for admin approval.'}), 401
        if not user.is_verified:
            return jsonify({'error': 'Account not yet verified. Please contact admin.'}), 401
            
        # Generate JWT token
        token = generate_token(user.user_id)
        return jsonify({
            'message': 'Login successful',
            'user_id': user.user_id,
            'token': token
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401