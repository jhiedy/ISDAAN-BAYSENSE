import {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification
} from './notifications'; // Assuming notifications utility exists

/**
 * Handles form submission with loading state and error handling.
 * Wraps an async submit function, manages loading state, and shows notifications.
 * @param {Function} submitFn - The async function to execute (e.g., API call).
 * @param {Object} options - Configuration options.
 * @param {Function} [options.onSuccess] - Callback on successful submission (receives result).
 * @param {Function} [options.onError] - Callback on submission error (receives error).
 * @param {Function} [options.setLoading] - State setter function for loading state.
 * @param {string} [options.successMessage='Operation completed successfully'] - Message for success notification.
 * @param {boolean} [options.showNotifications=true] - Whether to show success/error notifications.
 */
export const handleFormSubmit = async (
  submitFn,
  {
    onSuccess,
    onError,
    setLoading,
    successMessage = 'Operation completed successfully',
    showNotifications = true
  } = {}
) => {
  try {
    setLoading?.(true); // Set loading state if setter provided
    const result = await submitFn();

    // Show success notification if enabled
    if (showNotifications && successMessage) {
      showSuccessNotification(successMessage);
    }

    // Execute success callback if provided
    if (onSuccess) {
      await onSuccess(result); // Allow onSuccess to be async if needed
    }

    return result; // Return the result of the submit function

  } catch (error) {
    // Extract a user-friendly error message
    const errorMessage = error.response?.data?.error // Check for backend error structure
                      || error.response?.data?.message // Alternative backend error structure
                      || error.message // Fallback to generic error message
                      || 'An unexpected error occurred. Please try again.';

    // Show error notification if enabled
    if (showNotifications) {
      showErrorNotification(errorMessage);
    }

    // Execute error callback if provided
    if (onError) {
      await onError(error); // Allow onError to be async
    }

  } finally {
    setLoading?.(false); // Ensure loading state is turned off
  }
};

/**
 * Validates that specified fields in a form object are not empty or just whitespace.
 * @param {Object.<string, any>} fields - Object containing field values (e.g., { name: 'John', email: '' }).
 * @param {string[]} requiredFields - Array of field names that are required.
 * @returns {{isValid: boolean, errors: Object.<string, string>}} - Object indicating validity and containing error messages for invalid fields.
 */
export const validateRequiredFields = (fields, requiredFields) => {
  const errors = {};

  requiredFields.forEach(field => {
    // Check if field exists and is not null/undefined/empty string after trimming whitespace
    if (!fields[field] || String(fields[field]).trim() === '') {
      // Capitalize first letter for better error message
      const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      errors[field] = `${fieldName} is required.`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors // e.g., { email: "Email is required.", password: "Password is required." }
  };
};

/**
 * Validates email format using a regular expression.
 * @param {string} email - Email string to validate.
 * @returns {boolean} - True if the email format is valid, false otherwise.
 */
export const validateEmail = (email) => {
  if (!email) return false; // An empty string is not a valid email
  // Standard robust email regex
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};


/**
 * Validates maximum character length for a field.
 * @param {string} value - The field value to check.
 * @param {number} maxLength - The maximum allowed length.
 * @param {string} [fieldName='Field'] - The name of the field for the error message.
 * @returns {{isValid: boolean, message: string | null}} - Object indicating validity and error message if invalid.
 */
export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
    // Only validate if value exists
    if (value && String(value).length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName} cannot exceed ${maxLength} characters.`
      };
    }
    // If value is empty or within limit, it's valid regarding max length
    return { isValid: true, message: null };
};

/**
 * Validates Philippine mobile number format (09xxxxxxxxx or +639xxxxxxxxx).
 * @param {string} contactNo - Contact number string to validate.
 * @returns {{isValid: boolean, message: string | null}} - Object indicating validity and error message if invalid.
 */
export const validateContactNo = (contactNo) => {
    // Allow empty strings to pass (required validation should handle emptiness)
    if (!contactNo || String(contactNo).trim() === '') {
        return { isValid: true, message: null };
    }
    // Regex for 11-digit (09...) or 13-digit (+639...) formats
    const phMobileRegex = /^(09\d{9}|\+639\d{9})$/;
    if (!phMobileRegex.test(String(contactNo))) {
      return {
        isValid: false,
        message: 'Invalid contact no. (Use 09xxxxxxxxx or +639xxxxxxxxx)'
      };
    }
    // If format matches, it's valid
    return { isValid: true, message: null };
};

/**
 * Validates password strength based on configurable criteria.
 * @param {string} password - Password string to validate.
 * @param {object} [options] - Validation options.
 * @param {number} [options.minLength=8] - Minimum required length.
 * @param {boolean} [options.requireUppercase=true] - Must contain an uppercase letter.
 * @param {boolean} [options.requireLowercase=true] - Must contain a lowercase letter.
 * @param {boolean} [options.requireNumber=true] - Must contain a number.
 * @param {boolean} [options.requireSymbol=false] - Must contain a symbol (from [@$!%*?&]).
 * @returns {{isValid: boolean, message: string | null}} - Object indicating validity and the first validation error message if invalid.
 */
export const validateStrongPassword = (
    password,
    {
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumber = true,
        requireSymbol = false // Set to true to enforce symbols
    } = {}
) => {
    // Allow empty strings to pass (required validation should handle emptiness)
    if (!password) {
         return { isValid: true, message: null };
    }

    const pwd = String(password); // Ensure it's a string

    if (pwd.length < minLength) {
        return { isValid: false, message: `Password must be at least ${minLength} characters long.` };
    }
    if (requireUppercase && !/[A-Z]/.test(pwd)) {
        return { isValid: false, message: 'Password must contain an uppercase letter.' };
    }
    if (requireLowercase && !/[a-z]/.test(pwd)) {
        return { isValid: false, message: 'Password must contain a lowercase letter.' };
    }
    if (requireNumber && !/\d/.test(pwd)) {
        return { isValid: false, message: 'Password must contain a number.' };
    }
    // Example symbol check (adjust regex characters [@$!%*?&] as needed)
    if (requireSymbol && !/[@$!%*?&]/.test(pwd)) {
        return { isValid: false, message: 'Password must contain a special symbol (e.g., @$!%*?&).' };
    }

    // If all checks pass
    return { isValid: true, message: null };
};


// --- resetFormFields (Keep or remove based on usage) ---
/**
 * Resets form fields managed by useState hooks.
 * @param {Object.<string, any>} fields - Object containing current field values.
 * @param {Object.<string, any>} initialValues - Object containing initial values for fields.
 * @param {Function} setFieldValue - A function that takes (fieldName, newValue) to update state.
 */
export const resetFormFields = (fields, initialValues, setFieldValue) => {
  Object.keys(fields).forEach(field => {
    // Provide a default empty string if initialValue is undefined/null
    setFieldValue(field, initialValues[field] ?? '');
  });
};

/**
 * Handles API errors and displays appropriate notifications.
 * @param {Error} error - The error object from axios or fetch.
 * @param {object} [options] - Configuration options.
 * @param {string} [options.defaultMessage='An unexpected error occurred'] - Default message if specific one isn't found.
 * @param {boolean} [options.showNotification=true] - Whether to show the error notification.
 * @returns {string} - The extracted error message.
 */
export const handleApiError = (
    error,
    { defaultMessage = 'An unexpected error occurred', showNotification = true } = {}
) => {
    const errorMessage = error.response?.data?.error
                      || error.response?.data?.message
                      || error.message
                      || defaultMessage;

    if (showNotification) {
      showErrorNotification(errorMessage);
    }

    return errorMessage;
};