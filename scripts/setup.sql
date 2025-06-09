-- Create ENUM types
CREATE TYPE alert_status AS ENUM ('pending', 'dismissed', 'resolved');
CREATE TYPE cage_status AS ENUM ('good', 'at risk');
CREATE TYPE alert_type AS ENUM ('water quality', 'meteorological');

-- Table: User
CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_no VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for faster lookups
CREATE INDEX idx_user_email ON "User"(email);

-- Table: Admin
CREATE TABLE "Admin" (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Alerts
CREATE TABLE "Alerts" (
    alert_id SERIAL PRIMARY KEY,
	fla VARCHAR(20) NOT NULL,
    alert_type alert_type NOT NULL,
    alert_message TEXT NOT NULL,
    datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status alert_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on cage_id and datetime for faster lookups
CREATE INDEX idx_alerts_datetime ON "Alerts"(datetime);

-- Table: ParameterThresholds
CREATE TABLE "ParameterThresholds" (
    threshold_id SERIAL PRIMARY KEY,
    fla VARCHAR(20) NOT NULL,
    
    -- Water quality parameters
    chla_min FLOAT NOT NULL,
    chla_max FLOAT NOT NULL,
    turbidity_min FLOAT NOT NULL,
    turbidity_max FLOAT NOT NULL,
    tss_min FLOAT NOT NULL,
    tss_max FLOAT NOT NULL,
    
    -- Meteorological parameters
    gust_speed_max FLOAT NOT NULL,
    rainfall_max FLOAT NOT NULL,
    
    -- Ensure each fishpen has only one set of thresholds
    CONSTRAINT unique_pen
        UNIQUE (fla)
);

-- Optional: Add comments to document the units
COMMENT ON COLUMN "ParameterThresholds".chla_min IS 'Minimum Chlorophyll-a threshold (µg/L)';
COMMENT ON COLUMN "ParameterThresholds".chla_max IS 'Maximum Chlorophyll-a threshold (µg/L)';
COMMENT ON COLUMN "ParameterThresholds".turbidity_min IS 'Minimum turbidity threshold (NTU)';
COMMENT ON COLUMN "ParameterThresholds".turbidity_max IS 'Maximum turbidity threshold (NTU)';
COMMENT ON COLUMN "ParameterThresholds".tss_min IS 'Minimum Total Suspended Sediments threshold (mg/L)';
COMMENT ON COLUMN "ParameterThresholds".tss_max IS 'Maximum Total Suspended Sediments threshold (mg/L)';
COMMENT ON COLUMN "ParameterThresholds".gust_speed_max IS 'Maximum gust speed threshold (m/s)';
COMMENT ON COLUMN "ParameterThresholds".rainfall_max IS 'Maximum rainfall threshold (mm/h)';