# BAYSENSE: Water Quality and Fishery Monitoring App

## Overview

BAYSENSE is a web-based application designed to monitor water quality parameters and fishery conditions using remote sensing data from **Google Earth Engine (GEE)** and meteorological data from **OpenWeatherMap**. The app provides insights into key water quality indicators derived from Sentinel-2's multispectral images such as **Chlorophyll-a (chl-a)**, **Turbidity**, and **Total Suspended Solids (TSS)**, as well as meteorological data including **rainfall** and **gust speed**. This tool is aims to help fishery managers, environmental scientists, and policymakers to make informed decisions regarding water resource management and aquaculture operations.

## Key Features

1. **Water Quality Monitoring**:
   - **Chlorophyll-a (chl-a)**: Tracks the concentration of chlorophyll-a, an indicator of algal biomass and water health.
   - **Turbidity**: Measures the clarity of water, which is crucial for assessing sediment load and pollution levels.
   - **Total Suspended Solids (TSS)**: Monitors the amount of suspended particles in the water, which can affect light penetration and aquatic life.

2. **Meteorological Data**:
   - **Rainfall**: Provides real-time rainfall data to help predict potential runoff and its impact on water quality.
   - **Gust Speed**: Monitors wind speed to assess its efffects as they can cause damage to the infrastructure and equipment of the fish farms, as well as stress and injury to the fish

3. **Interactive Dashboard**:
   - A user-friendly interface with interactive maps and charts to visualize water quality and meteorological data over time.
   - Customizable date ranges and parameter selections for detailed analysis.

4. **Profile Management**:
   - Users can manage their fish cages and view water quality measurements specific to their locations.
   - Historical data tracking for long-term analysis and trend identification.

5. **Admin Panel**:
   - Administrators can manage user registrations, view registered users, and monitor farms.
   - Access to advanced analytics and reporting tools.

## Technology Stack

- **Frontend**: React.js with Mantine UI components for a responsive and modern user interface.
- **Backend**: Node.js/Express.js and PostegreSQL for handling API requests and data processing.
- **Data Sources**:
  - **Google Earth Engine (GEE)**: For remote sensing data on water quality parameters (chl-a, turbidity, TSS).
  - **OpenWeatherMap**: For meteorological data (rainfall, gust speed).

## How It Works

1. **Data Collection**:
   - Water quality data is fetched from Google Earth Engine using its API, which processes satellite imagery to derive chl-a, turbidity, and TSS values.
   - Meteorological data is retrieved from OpenWeatherMap's API, providing real-time and historical weather data.

2. **Data Visualization**:
   - The app's dashboard displays interactive maps and charts, allowing users to visualize water quality and weather data over selected time periods.
   - Users can filter data by specific parameters and date ranges for more detailed analysis.

3. **User Interaction**:
   - Users can log in to access personalized dashboards, manage their fish cages, and view water quality measurements specific to their locations.
   - Administrators have access to an admin panel for managing users and farms.

## Installation and Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/jhiedy/BAYSENSE-APP.git
   cd baysense-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
 
3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory and add the following variables:
     ```env
     REACT_APP_GEE_API_KEY=your_gee_api_key
     REACT_APP_OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
     ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```

5. **Access the App**:
   - Open your browser and navigate to `http://localhost:5137`.

## Usage

1. **Login/Signup**:
   - New users can create an account, while existing users can log in to access the dashboard.

2. **Dashboard**:
   - The main dashboard displays an interactive map with water quality and meteorological data.
   - Users can select different parameters (chl-a, turbidity, TSS) and date ranges to view specific data.

3. **Profile Page**:
   - Users can manage their fish cages and view water quality measurements specific to their locations.

4. **Admin Panel**:
   - Administrators can manage user registrations, view registered users, and monitor farms.

## Acknowledgments

- **Google Earth Engine** for providing remote sensing data.
- **OpenWeatherMap** for meteorological data.
- **Mantine** for the UI components.
- **React** for the frontend framework.

---

Thank you for using BAYSENSE! I hope this tool helps you in monitoring and managing water quality and fishery conditions effectively.