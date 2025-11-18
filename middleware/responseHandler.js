/**
 * Response Handler Middleware
 * Provides consistent API response structure for success and error cases
 */

/**
 * Success response middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */

import dotenv from 'dotenv';
dotenv.config();


export const successResponse = (req, res, next) => {
  // Add success response method to res object
  res.success = (data = null, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    });
  };
  next();
};

/**
 * Error response middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorResponse = (req, res, next) => {
  // Add error response method to res object
  res.error = (message = 'An error occurred', statusCode = 500, error = null) => {
    const errorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };

    // Include error details in development environment
    if (process.env.NODE_ENV !== 'production' && error) {
      errorResponse.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return res.status(statusCode).json(errorResponse);
  };
  next();
};

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle MongoDB errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.error('Duplicate key error', 409, err);
    }
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.error('Validation error', 400, err);
  }
  
  // Handle cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.error('Invalid data format', 400, err);
  }
  
  // Default error response
  res.error(err.message || 'Internal server error', err.statusCode || 500, err);
};

/**
 * Not found middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notFound = (req, res) => {
  res.error(`Route not found: ${req.originalUrl}`, 404);
};