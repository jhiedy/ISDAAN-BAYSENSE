from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv
import click
from flask.cli import with_appcontext
from flask_bcrypt import Bcrypt
import logging

# Load environment variables
load_dotenv()

# Initialize SQLAlchemy
db = SQLAlchemy()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)

    # Configure CORS
    cors_origins_str = os.getenv('CORS_ALLOWED_ORIGINS')
    if cors_origins_str:
        origins_list = [origin.strip() for origin in cors_origins_str.split(',')]
        logging.info(f"Configuring CORS for origins: {origins_list}")
        CORS(app, origins=origins_list)
    else:
        logging.warning("CORS_ALLOWED_ORIGINS environment variable not set. "
                        "CORS might not allow frontend connections in production.")
        raise ValueError("CORS_ALLOWED_ORIGINS environment variable is required but not set.")

    # Configure the database
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    
    # Register CLI commands
    register_commands(app)

    # Register blueprints (routes)
    from app.routes.auth_routes import auth_routes
    from app.routes.test_routes import test_routes
    app.register_blueprint(auth_routes)
    app.register_blueprint(test_routes)
    
    from app.routes.get_tile import tile_routes
    from app.routes.get_weather import weather_routes
    app.register_blueprint(tile_routes)
    app.register_blueprint(weather_routes)

    
    return app

def register_commands(app):
    @app.cli.command("create-admin")
    @click.argument("username")
    @click.argument("password")
    @with_appcontext
    def create_admin(username, password):
        """Create initial admin account"""
        from app.models import Admin
        
        # Check if admin already exists
        if Admin.query.first():
            click.echo("Admin already exists in database")
            return
        
        # Create new admin
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        admin = Admin(username=username, password=hashed_password)
        
        db.session.add(admin)
        db.session.commit()
        click.echo(f"Admin account created successfully: {username}")
        
        # For security, recommend changing password immediately
        click.echo("\nSECURITY WARNING: Change this password immediately after first login!")