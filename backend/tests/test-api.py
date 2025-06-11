import requests
import json
import datetime

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(endpoint, log_file, params=None):
    """Helper function to test an endpoint and write results to a log file."""
    log_file.write(f"--- Testing {BASE_URL}{endpoint} ---\n")
    if params:
        log_file.write(f"Parameters: {json.dumps(params)}\n")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", params=params)
        
        # Log the HTTP status code
        log_file.write(f"Status: {response.status_code}\n\n")

        # Check if the request was successful and log the body
        if response.status_code == 200:
            log_file.write("Response Body (JSON):\n")
            # Use json.dumps for pretty printing with indentation
            pretty_json_response = json.dumps(response.json(), indent=4)
            log_file.write(pretty_json_response + "\n")
        else:
            log_file.write(f"Error Response Body:\n{response.text}\n")
            
    except requests.exceptions.ConnectionError as e:
        error_message = f"Connection Error: Could not connect to {BASE_URL}. Is the Flask app running?\n"
        log_file.write(error_message)
    
    # Add a separator for readability
    log_file.write("\n" + "="*60 + "\n\n")


if __name__ == "__main__":
    # Generate a timestamped log file name
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_filename = f"tests/test_logs/api_test_log_{timestamp}.txt"
    
    print(f"Starting API tests. Results will be saved to '{log_filename}'...")

    # Open the log file in write mode ('w') and run the tests
    with open(log_filename, 'w') as log_file:
        # Test 1: Get all feature details
        test_endpoint("/get_asset_features", log_file)

        # Test 2: Get parameter values for chlorophyll for a specific month
        test_endpoint("/get_parameter_values", log_file, params={
            "parameter": "chlorophyll", 
            "start_date": "2024-05-01", 
            "end_date": "2024-05-31"
        })
        
        # Test 3: Get a composite tile URL for turbidity
        test_endpoint("/get_composite_tile", log_file, params={"parameter": "turbidity"})
        
        # Test 4: Get an RGB tile URL for a specific date
        try:
            print("Fetching available dates for specific-date test...")
            available_dates_resp = requests.get(f"{BASE_URL}/get_available_dates").json()
            if available_dates_resp.get("available_dates"):
                # Use the most recent available date
                specific_date = available_dates_resp["available_dates"][-1]
                print(f"Found available date: {specific_date}. Testing specific date RGB tile...")
                test_endpoint("/get_specific_date_rgb_tile", log_file, params={"date": specific_date})
            else:
                log_file.write("--- Skipping specific date tile test: No available dates found ---\n\n")
                print("--- Skipping specific date tile test: No available dates found ---")
        except requests.exceptions.RequestException as e:
            log_file.write(f"--- Could not fetch available dates to run specific date test. Error: {e} ---\n\n")
            print(f"--- Could not fetch available dates to run specific date test. Error: {e} ---")

        # Test 5: Test a failing case (missing required 'date' parameter)
        test_endpoint("/get_specific_date_tile", log_file)
    
    print(f"Testing complete. Log file '{log_filename}' has been created.")