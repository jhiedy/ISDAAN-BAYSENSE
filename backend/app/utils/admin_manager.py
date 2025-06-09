import os
import psycopg2
import bcrypt
import getpass 
import re
import argparse
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# --- Database Connection Details ---
DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')

# --- Password Validation ---
def is_valid_password(password):
    """
    Validates password strength.
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    if len(password) < 8:
        print("Password must be at least 8 characters long.")
        return False
    if not re.search(r"[A-Z]", password):
        print("Password must contain at least one uppercase letter.")
        return False
    if not re.search(r"[a-z]", password):
        print("Password must contain at least one lowercase letter.")
        return False
    if not re.search(r"[0-9]", password):
        print("Password must contain at least one number.")
        return False
    return True

# --- Database Helper Functions ---
def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        print("Please ensure your .env file is correctly configured with database credentials.")
        exit(1)

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """Executes a SQL query and optionally fetches results or commits changes."""
    conn = None
    cur = None
    result = None
    success = False
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(query, params)

        if commit:
            conn.commit()
            success = True
        
        if fetch_one:
            result = cur.fetchone()
            success = True
        elif fetch_all:
            result = cur.fetchall()
            success = True
        elif not commit:
            success = True

    except psycopg2.Error as e:
        if conn and not commit: # Only rollback if not committing (commit implies prior success or handled error)
             conn.rollback()
        print(f"Database query error: {e}")
        # For unique constraint violation on username during creation
        if e.pgcode == '23505': # Unique violation code for PostgreSQL
             print("Error: An admin with that username already exists.")
        success = False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
    
    if fetch_one or fetch_all:
        return result
    return success

# --- Admin Management Functions ---
def authenticate_script_user():
    """Authenticates the user running the script against the Admin table."""
    print("--- Admin Script Authentication ---")
    username = input("Enter your existing admin username: ").strip()
    password = getpass.getpass("Enter your admin password: ")

    # Fetch the hashed password from the database for the given username
    admin_record = execute_query('SELECT password FROM "Admin" WHERE username = %s', (username,), fetch_one=True)

    if admin_record and bcrypt.checkpw(password.encode('utf-8'), admin_record[0].encode('utf-8')):
        print("Script authentication successful.\n")
        return username # Return the username of the authenticated admin
    else:
        print("Authentication failed. Exiting script.")
        exit(1)

def list_admins():
    """Lists all admin accounts."""
    print("\n--- Admin Accounts ---")
    # Adjust columns if your schema is different
    admins = execute_query('SELECT admin_id, username, created_at FROM "Admin" ORDER BY username;', fetch_all=True)
    
    if admins is None: # Indicates a query execution error
        print("Could not retrieve admin list due to a database error.")
        return
        
    if not admins:
        print("No admin accounts found.")
        return

    print(f"{'ID':<5} {'Username':<25} {'Created At':<30}")
    print("-" * 60)
    for admin in admins:
        admin_id, username, created_at_val = admin
        # Format created_at if it's not None
        created_at_str = created_at_val.strftime('%Y-%m-%d %H:%M:%S') if isinstance(created_at_val, datetime) else 'N/A'
        print(f"{admin_id:<5} {username:<25} {created_at_str:<30}")
    print("-" * 60)


def create_admin(current_admin_username):
    """Creates a new admin account."""
    print("\n--- Create New Admin ---")
    new_username = input("Enter username for the new admin: ").strip()
    if not new_username:
        print("Username cannot be empty.")
        return

    existing = execute_query('SELECT admin_id FROM "Admin" WHERE username = %s', (new_username,), fetch_one=True)
    if existing: # Checks if any row was returned
        print(f"Admin username '{new_username}' already exists.")
        return

    while True:
        new_password = getpass.getpass("Enter password for the new admin: ")
        confirm_password = getpass.getpass("Confirm password: ")
        if new_password != confirm_password:
            print("Passwords do not match. Please try again.")
        elif not is_valid_password(new_password):
            print("Please try again.")
        else:
            break
    
    # Hash the password using bcrypt
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Add created_at timestamp
    created_at_ts = datetime.now()

    if execute_query('INSERT INTO "Admin" (username, password, created_at, updated_at) VALUES (%s, %s, %s, %s)', 
                     (new_username, hashed_password, created_at_ts, created_at_ts), commit=True):
        print(f"Admin account '{new_username}' created successfully.")
    else:
        print(f"Failed to create admin account '{new_username}'. Check logs for details.")


def change_admin_password(current_admin_username):
    """Changes the password for an existing admin account."""
    print("\n--- Change Admin Password ---")
    target_username = input("Enter username of the admin whose password you want to change: ").strip()
    if not target_username:
        print("Username cannot be empty.")
        return

    admin_exists = execute_query('SELECT admin_id FROM "Admin" WHERE username = %s', (target_username,), fetch_one=True)
    if not admin_exists:
        print(f"Admin username '{target_username}' not found.")
        return

    while True:
        new_password = getpass.getpass(f"Enter new password for '{target_username}': ")
        confirm_password = getpass.getpass("Confirm new password: ")
        if new_password != confirm_password:
            print("Passwords do not match. Please try again.")
        elif not is_valid_password(new_password):
            print("Please try again.")
        else:
            break

    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    updated_at_ts = datetime.now()

    if execute_query('UPDATE "Admin" SET password = %s, updated_at = %s WHERE username = %s', (hashed_password, updated_at_ts, target_username), commit=True):
        print(f"Password for admin '{target_username}' changed successfully.")
    else:
        print(f"Failed to change password for admin '{target_username}'.")


def delete_admin(current_admin_username):
    """Deletes an admin account."""
    print("\n--- Delete Admin Account ---")
    target_username = input("Enter username of the admin to delete: ").strip()
    if not target_username:
        print("Username cannot be empty.")
        return

    if target_username == current_admin_username:
        print("Error: You cannot delete your own currently authenticated account using this script.")
        print("If you need to delete this account, ask another admin or do it directly in the database with extreme caution.")
        return

    admin_record = execute_query('SELECT admin_id, username FROM "Admin" WHERE username = %s', (target_username,), fetch_one=True)
    if not admin_record:
        print(f"Admin username '{target_username}' not found.")
        return

    admin_id, admin_username_db = admin_record # Unpack fetched record

    confirm = input(f"Are you sure you want to delete admin '{admin_username_db}' (ID: {admin_id})? This action CANNOT be undone. (yes/no): ").strip().lower()
    if confirm == 'yes':
        if execute_query('DELETE FROM "Admin" WHERE admin_id = %s', (admin_id,), commit=True):
            print(f"Admin account '{admin_username_db}' deleted successfully.")
        else:
            print(f"Failed to delete admin account '{admin_username_db}'.")
    else:
        print("Deletion cancelled.")

# --- Main Script Logic ---
if __name__ == "__main__":
    if not all([DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT]):
        print("Database configuration environment variables (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT) are not fully set.")
        print("Please create a .env file in the script's directory or set them in your environment.")
        exit(1)

    # Authenticate the user running the script
    authenticated_admin_username = authenticate_script_user()

    parser = argparse.ArgumentParser(
        description="BAYSENSE Admin Account Management Script. Requires script authentication.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands", required=True)
    
    # Run script: (python admin_manager.py <arg>)
    # args: list, create, chpass, delete
    parser_list = subparsers.add_parser("list", help="List all admin accounts.")
    parser_create = subparsers.add_parser("create", help="Create a new admin account.")
    parser_chpass = subparsers.add_parser("chpass", help="Change an admin's password.")
    parser_delete = subparsers.add_parser("delete", help="Delete an admin account.")

    args = parser.parse_args()

    if args.command == "list":
        list_admins()
    elif args.command == "create":
        create_admin(authenticated_admin_username)
    elif args.command == "chpass":
        change_admin_password(authenticated_admin_username)
    elif args.command == "delete":
        delete_admin(authenticated_admin_username)
    else:
        parser.print_help()

    print("\nScript finished.")