/**
   * Fetches available dates for imagery within the date range
   * @param {Date} startDate - The start date 
   * @param {Date} endDate - The end date
   * @param {number} cloudCover - Maximum cloud cover percentage
   * @returns {Promise<Array>} - Array of available dates as strings
   */
export const fetchAvailableDates = async (startDate, endDate, cloudCover = 20) => {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/get_available_dates?start_date=${startDateStr}&end_date=${endDateStr}&cloud_cover=${cloudCover}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch available dates');
      }
      
      const data = await response.json();
      return data.available_dates || [];
    } catch (error) {
      console.error("Error fetching available dates:", error);
      return [];
    }
  };
  
  /**
   * Gets the latest available date from a list of date strings
   * @param {Array} availableDates - Array of date strings
   * @returns {Date|null} - Date object for the latest date or null
   */
  export const getLatestAvailableDate = (availableDates) => {
    if (!availableDates || availableDates.length === 0) {
      return null;
    }
    
    // Sort dates in ascending order
    const sortedDates = [...availableDates].sort();
    // Get the latest date (last in sorted array)
    const latestDate = sortedDates[sortedDates.length - 1];
    
    return new Date(latestDate);
  };
  
  /**
   * Checks if a date is available in the available dates list
   * @param {Date} date - The date to check
   * @param {Array} availableDates - Array of available date strings
   * @returns {boolean} - Whether the date is available
   */
  export const isDateAvailable = (date, availableDates) => {
    if (!date || !availableDates || availableDates.length === 0) {
      return false;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  };