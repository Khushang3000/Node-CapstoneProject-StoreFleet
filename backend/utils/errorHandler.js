// backend/utils/errorHandler.js
export class ErrorHandler extends Error {
  constructor(statusCode, message) { // Changed 'error' to 'message' for clarity, as super(message) is standard
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Custom property to distinguish operational errors

    Error.captureStackTrace(this, this.constructor);
  }
}