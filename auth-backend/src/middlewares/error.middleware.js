const errorMiddleware = (err, req, res, next) => {
  // Default status code
  let statusCode = err.statusCode || 500;

  // Always log the full error server-side (including stack)
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Determine appropriate message to send to client
  let message;

  // If we have a custom ApiError, use its message (assumed safe)
  if (err instanceof ApiError) {
    message = err.message;
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
      // In production, hide internal error details for any other 500 error
      else if (process.env.NODE_ENV === "production") {
        message = "Internal Server Error";
      }
      // In development, we can show the error message (but still no stack trace)
      else {
        message = err.message || "Server Error";
      }
    } else {
      // For non-500 errors (e.g., 400 from validation), use the error message if set,
      // otherwise fallback to a generic message.
      message = err.message || "Error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

// ApiError class (keep it here or import; we define locally to avoid circular)
// Better to import from utils/ApiError.js but to keep simple we re-declare same shape.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export default errorMiddleware;