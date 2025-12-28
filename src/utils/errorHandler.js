/**
 * Standardized Error Handling Utility
 * Provides consistent error handling across the admin panel
 */

import { notifyError } from "./notifications";

/**
 * Extract error message from various error formats
 * @param {Error|Object} error - Error object from API or exception
 * @returns {string} Human-readable error message
 */
export const getErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred";

  // RTK Query error format
  if (error?.data?.message) {
    return error.data.message;
  }

  // Standard error object
  if (error?.message) {
    return error.message;
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Network error
  if (
    error?.status === "FETCH_ERROR" ||
    error?.error === "TypeError: Failed to fetch"
  ) {
    return "Unable to connect to server. Please check your connection and try again.";
  }

  // 401 Unauthorized
  if (error?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  // 403 Forbidden
  if (error?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  // 404 Not Found
  if (error?.status === 404) {
    return "The requested resource was not found.";
  }

  // 500 Server Error
  if (error?.status === 500) {
    return "A server error occurred. Please try again later.";
  }

  // Default fallback
  return "An unexpected error occurred. Please try again.";
};

/**
 * Handle API errors consistently
 * @param {Error|Object} error - Error from API call
 * @param {Object} options - Options for error handling
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.showNotification - Whether to show toast notification (default: true)
 * @param {string} options.defaultMessage - Default error message if none found
 * @returns {string} Error message
 */
export const handleApiError = (error, options = {}) => {
  const {
    onError,
    showNotification = true,
    defaultMessage = "An error occurred. Please try again.",
    endpoint,
    ...metadata
  } = options;

  const errorMessage = getErrorMessage(error) || defaultMessage;

  // Call custom error handler if provided
  if (onError && typeof onError === "function") {
    onError(error, errorMessage);
  }

  // Show notification if enabled
  if (showNotification) {
    notifyError(errorMessage);
  }

  // Log error to console (only in development)
  if (import.meta.env.DEV) {
    console.error(`API Error: ${endpoint || "Unknown"}`, error, {
      endpoint,
      ...metadata,
    });
  }

  return errorMessage;
};

/**
 * Handle form validation errors
 * @param {Object} errors - Validation errors object
 * @param {Function} setFieldError - Function to set field errors
 */
export const handleValidationErrors = (errors, setFieldError) => {
  if (!errors || typeof errors !== "object") return;

  Object.keys(errors).forEach((field) => {
    const errorMessage = Array.isArray(errors[field])
      ? errors[field][0]
      : errors[field];

    if (setFieldError) {
      setFieldError(field, errorMessage);
    }
  });
};

/**
 * Create error boundary error object
 * @param {Error} error - Caught error
 * @param {ErrorInfo} errorInfo - React error info
 * @returns {Object} Formatted error object
 */
export const formatErrorBoundaryError = (error, errorInfo) => {
  return {
    message: error?.message || "An unexpected error occurred",
    stack: error?.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Check if error is a network error
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return (
    error?.status === "FETCH_ERROR" ||
    error?.error === "TypeError: Failed to fetch" ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("NetworkError")
  );
};

/**
 * Check if error is an authentication error
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error?.status === 401 || error?.status === 403;
};

/**
 * Retry handler for failed API calls
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Promise that resolves or rejects
 */
export const retryApiCall = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or client errors (4xx)
      if (isAuthError(error) || (error?.status >= 400 && error?.status < 500)) {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};
