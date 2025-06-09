/**
 * Fetches parameter values for water quality analysis.
 * @param {string} parameter - The parameter to analyze ('chlorophyll', 'turbidity', 'tss')
 * @param {Date} startDate - The start date for the analysis
 * @param {Date} endDate - The end date for the analysis
 * @param {number} cloudCover - Maximum cloud cover percentage (0-100)
 * @param {Function} setLoading - Function to update loading state
 * @param {Function} onError - Function to handle errors
 * @returns {Promise<Array>} - Array of parameter values with dates
 */
export const fetchParameterValues = async (
  parameter,
  startDate,
  endDate,
  cloudCover = 20,
  setLoading = () => {},
  onError = () => {}
) => {
  setLoading(true);

  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/get_parameter_values?parameter=${parameter}&start_date=${startDateStr}&end_date=${endDateStr}&cloud_cover=${cloudCover}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch parameter values");
    }

    const data = await response.json();

    // Convert chlorophyll values from μg to mg
    const convertedValues = data.values
      ? data.values.map((item) => {
          if (parameter === "chlorophyll") {
            return {
              ...item,
              value: item.value,
            };
          }
          return item;
        })
      : [];

    return convertedValues;
  } catch (error) {
    console.error("Error fetching parameter values:", error);
    onError(error.message || "An error occurred while fetching parameter data");
    return [];
  } finally {
    setLoading(false);
  }
};

/**
 * Fetches parameter values for a specific geographic point for water quality analysis.
 * @param {string} parameter - The parameter to analyze ('chlorophyll', 'turbidity', 'tss')
 * @param {Object} coordinates - The geographic coordinates { lat: number, lng: number }
 * @param {Date} startDate - The start date for the analysis
 * @param {Date} endDate - The end date for the analysis
 * @param {number} cloudCover - Maximum cloud cover percentage (0-100)
 * @param {Function} setLoading - Function to update loading state
 * @param {Function} onError - Function to handle errors
 * @returns {Promise<Array>} - Array of parameter values with dates
 */
export const fetchPointParameterValues = async (
  parameter,
  coordinates,
  startDate,
  endDate,
  cloudCover = 20,
  setLoading = () => {},
  onError = () => {}
) => {
  setLoading(true);

  try {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/get_point_parameter_values?parameter=${parameter}&lat=${coordinates.lat}&lng=${coordinates.lng}&start_date=${startDateStr}&end_date=${endDateStr}&cloud_cover=${cloudCover}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch point parameter values"
      );
    }

    const data = await response.json();

    // Convert chlorophyll values from μg to mg
    const convertedValues = data.values
      ? data.values.map((item) => {
          if (parameter === "chlorophyll") {
            return {
              ...item,
              value: item.value
            };
          }
          return item;
        })
      : [];

    return convertedValues;
  } catch (error) {
    console.error("Error fetching point parameter values:", error);
    onError(
      error.message || "An error occurred while fetching point parameter data"
    );
    return [];
  } finally {
    setLoading(false);
  }
};

/**
 * Formats parameter data for display and analysis
 * @param {Array} data - Raw parameter values from API
 * @param {Object} selectedParam - Parameter information with label and unit
 * @returns {Object} - Formatted data and statistics
 */
export const processParameterData = (data, selectedParam) => {
  if (!data || data.length === 0) {
    return {
      chartData: [],
      stats: {
        min: null,
        max: null,
        avg: null,
        count: 0,
      },
    };
  }

  // Add formatted date for display
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString(),
    // Round values to 2 decimal places for display
    displayValue: Number(item.value).toFixed(2),
  }));

  // Calculate statistics
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;

  return {
    chartData,
    stats: {
      min: min.toFixed(5),
      max: max.toFixed(5),
      avg: avg.toFixed(5),
      count: values.length,
      unit: selectedParam.unit,
    },
  };
};

/**
 * Formats and downloads parameter data as CSV
 * @param {Array} chartData - The chart data to download
 * @param {string} parameterLabel - The parameter label for the filename
 */
export const downloadParameterData = (chartData, parameterLabel) => {
  if (!chartData || chartData.length === 0) {
    console.warn("No data available to download");
    return;
  }

  const csvContent = [
    ["Date", "Value"],
    ...chartData.map((row) => [row.date, row.value]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${parameterLabel}_data.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
