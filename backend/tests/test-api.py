import requests
import json
import datetime
import os

# --- Configuration ---
BASE_URL = "http://127.0.0.1:5000"
LOG_DIRECTORY = os.path.join("tests", "test_logs") # Define the target directory for logs

def test_endpoint(endpoint, log_file, params=None):
    """
    Helper function to test an endpoint, log the full response
    """
    test_status = "FAILED"  # Default status is FAILED

    try:
        log_file.write(f"--- Testing {BASE_URL}{endpoint} ---\n")
        if params:
            log_file.write(f"Parameters: {json.dumps(params)}\n")
        
        response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=300)
        
        # Log the HTTP status code
        log_file.write(f"Status Code: {response.status_code}\n\n")

        # Log the response body
        if response.status_code == 200:
            test_status = "SUCCESS"  # Update status to SUCCESS on 200 OK
            log_file.write("Response Body (JSON):\n")
            # Use json.dumps for pretty printing with indentation
            pretty_json_response = json.dumps(response.json(), indent=4)
            log_file.write(pretty_json_response + "\n")
        else:
            log_file.write(f"Error Response Body:\n{response.text}\n")
            
    except requests.exceptions.RequestException as e:
        # This catches connection errors, timeouts, etc. Status remains FAILED.
        error_message = f"CRITICAL ERROR during request: {e}\n"
        log_file.write(error_message)
        print(f"ERROR testing {endpoint}: {e}")
    
    finally:
        # Log the FINAL result
        log_file.write(f"\nResult: {test_status}\n")
        log_file.write("\n" + "="*60 + "\n\n")


if __name__ == "__main__":
    # --- Setup ---
    # Create the log directory if it doesn't exist
    os.makedirs(LOG_DIRECTORY, exist_ok=True)
    
    # Generate a timestamped log file name inside the specified directory
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_filename = os.path.join(LOG_DIRECTORY, f"api_test_log_{timestamp}.txt")
    
    print(f"Starting API tests. Results will be saved to '{log_filename}'...")

    # --- Test Execution ---
    with open(log_filename, 'w') as log_file:
        # Test 1: Get all feature details
        test_endpoint("/get_asset_features", log_file)

        # Test 2: Get parameter values for chlorophyll
        test_endpoint("/get_parameter_values", log_file, params={
            "parameter": "turbidity", 
            "start_date": "2025-01-01", 
            "end_date": "2025-04-01"
        })
        
        # Test 3: Get a composite tile URL for turbidity
        test_endpoint("/get_composite_tile", log_file, params={"parameter": "turbidity"})
        
        # Test 4: Get an RGB tile URL for a specific, valid date
        try:
            print("Fetching available dates for specific-date test...")
            available_dates_resp = requests.get(f"{BASE_URL}/get_available_dates").json()
            if available_dates_resp and available_dates_resp.get("available_dates"):
                specific_date = available_dates_resp["available_dates"][-1] # Use the most recent date
                print(f"Found available date: {specific_date}. Testing specific date RGB tile...")
                test_endpoint("/get_specific_date_rgb_tile", log_file, params={"date": specific_date})
            else:
                log_file.write("--- Skipping specific date tile test: No available dates found ---\n\n")
                print("--- Skipping specific date tile test: No available dates found ---")
        except requests.exceptions.RequestException as e:
            log_file.write(f"--- Could not fetch available dates to run specific date test. Error: {e} ---\n\n")
            print(f"--- Could not fetch available dates to run specific date test. Error: {e} ---")

        # Test 5: Test a failing case (missing required 'date' parameter, should return 400)
        test_endpoint("/get_specific_date_tile", log_file)
    
    print(f"Testing complete. Log file '{log_filename}' has been created.")