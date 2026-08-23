import ApiError from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  // Default status code
  let statusCode = err.statusCode || 500;

  // Always log the full error server-side (including stack)
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Determine appropriate message to send to client
  let message;

  // If we have an ApiError, or explicit 4xx operational status code
  if (err instanceof ApiError || err.name === "ApiError" || (err.statusCode && err.statusCode < 500)) {
    message = err.message || "Request failed";
    statusCode = err.statusCode || 400;
  } else if (err.message === "Invalid credentials") {
    message = "Invalid credentials";
    statusCode = 401;
  } else {
    // Handle known operational errors with generic messages
    if (statusCode === 500) {
      // Mongoose duplicate key error
      if (err.code === 11000) {
        message = "Resource already exists";
        statusCode = 409; // Conflict
      }
      // Mongoose validation error
      else if (err.name === "ValidationError") {
        message = "Invalid input data";
        statusCode = 400;
      }
      // Mongoose cast error (e.g., invalid ObjectId)
      else if (err.name === "CastError") {
        message = "Invalid resource identifier";
        statusCode = 400;
      }
      // JSON Web Token errors
      else if (err.name === "JsonWebTokenError") {
        message = "Invalid token";
        statusCode = 401;
      }
      else if (err.name === "TokenExpiredError") {
        message = "Token expired";
        statusCode = 401;
      }
      // In production, hide internal error details for unexpected 500 errors
      else if (process.env.NODE_ENV === "production") {
        message = "Internal Server Error";
      }
      // In development, show error message
      else {
        message = err.message || "Server Error";
      }
    } else {
      message = err.message || "Error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorMiddleware;