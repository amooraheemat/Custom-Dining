/**
 * Custom API error class that extends the built-in Error class
 * @extends {Error}
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Custom error code
   * @param {object} [details] - Additional error details
   */
  constructor(message, statusCode, code, details = {}) {
    super(message);
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // This is to distinguish operational errors from programming errors
    this.code = code || 'INTERNAL_SERVER_ERROR';
    this.details = details;
    
    // Log the error stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error(this.stack);
    }
  }
  
  /**
   * Create a bad request error (400)
   * @param {string} [message='Bad Request'] - Error message
   * @param {string} [code='BAD_REQUEST'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details) {
    return new ApiError(message, 400, code, details);
  }
  
  /**
   * Create an unauthorized error (401)
   * @param {string} [message='Unauthorized'] - Error message
   * @param {string} [code='UNAUTHORIZED'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details) {
    return new ApiError(message, 401, code, details);
  }
  
  /**
   * Create a forbidden error (403)
   * @param {string} [message='Forbidden'] - Error message
   * @param {string} [code='FORBIDDEN'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details) {
    return new ApiError(message, 403, code, details);
  }
  
  /**
   * Create a not found error (404)
   * @param {string} [message='Not Found'] - Error message
   * @param {string} [code='NOT_FOUND'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static notFound(message = 'Not Found', code = 'NOT_FOUND', details) {
    return new ApiError(message, 404, code, details);
  }
  
  /**
   * Create a conflict error (409)
   * @param {string} [message='Conflict'] - Error message
   * @param {string} [code='CONFLICT'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict', code = 'CONFLICT', details) {
    return new ApiError(message, 409, code, details);
  }
  
  /**
   * Create a validation error (422)
   * @param {string} [message='Validation Error'] - Error message
   * @param {object} [errors] - Validation errors
   * @param {string} [code='VALIDATION_ERROR'] - Error code
   * @returns {ApiError}
   */
  static validationError(message = 'Validation Error', errors, code = 'VALIDATION_ERROR') {
    return new ApiError(message, 422, code, { errors });
  }
  
  /**
   * Create an internal server error (500)
   * @param {string} [message='Internal Server Error'] - Error message
   * @param {string} [code='INTERNAL_SERVER_ERROR'] - Error code
   * @param {object} [details] - Additional error details
   * @returns {ApiError}
   */
  static internal(message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR', details) {
    return new ApiError(message, 500, code, details);
  }
  
  /**
   * Convert error to JSON
   * @returns {object} - JSON representation of the error
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      ...(Object.keys(this.details).length > 0 && { details: this.details })
    };
  }
}

export { ApiError };
