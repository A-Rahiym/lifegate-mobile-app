/**
 * Shared error extraction utility
 * Handles axios errors, string errors, and error objects
 * Used by auth service and stores
 */

export const extractErrorMessage = (error: any): any => {
  // Axios response errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.details) {
    return error.response.data.details;
  }

  // For validation errors - combine field errors
  if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
    const errors = error.response.data.errors;
    const messages = Object.values(errors).flat().join(', ');
    return messages || 'Validation failed';
  }

  // Network errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your connection.';
  }
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return 'Cannot connect to server. Please try again.';
  }
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  // Direct error message
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};
