// backend/middlewares/errorHandlerMiddleware.js
// ErrorHandler class should be imported if it's defined in "../utils/errorHandler.js"
// For example: import { ErrorHandler } from "../utils/errorHandler.js";

export const errorHandlerMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // Handling Mongoose duplicate key error (E11000) specifically (for Requirement 2)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `Duplicate value entered for ${field} field. Please choose another value.`;
    err.statusCode = 400; // Bad Request
  }

  // Handling Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    err.message = messages.join(', ');
    err.statusCode = 400;
  }

  // Handling JWT errors that might not be caught by the auth middleware before reaching here
  if (err.name === 'JsonWebTokenError') {
    err.message = "Invalid token. Please login again.";
    err.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    err.message = "Token expired. Please login again.";
    err.statusCode = 401;
  }

  // Log the error for debugging (optional: only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error("ERROR 💥:", err);
  } else {
    // In production, you might want to log less detailed errors to the console
    // or use a dedicated logging service.
    if (err.isOperational) { // isOperational is a custom property you can add to ErrorHandler
        console.error("OPERATIONAL ERROR:", err.message);
    } else {
        console.error("PROGRAMMING OR UNKNOWN ERROR:", err);
    }
  }


  res.status(err.statusCode).json({
    success: false,
    message: err.message, // Send only the message to the client
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Optionally send stack in dev
  });
};

/**
 * Graceful shutdown function
 * @param {object} server - The HTTP server instance
 */
const gracefulShutdown = (server, exitCode = 1) => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
        console.log("HTTP server closed.");
        // Add any other cleanup tasks here (e.g., close database connections if not handled elsewhere)
        process.exit(exitCode);
    });

    // If server hasn't finished in a timeout period, force shutdown
    setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(exitCode);
    }, 10000); // 10 seconds timeout
};



export const setupErrorHandlers = (server) => {
  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err); // Log the full error object
    gracefulShutdown(server, 1);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    // For unhandled rejections, err might not be an Error instance
    if (err instanceof Error) {
        console.error(err.name, err.message);
        console.error(err); // Log the full error object
    } else {
        console.error("Unknown unhandled rejection:", err);
    }
    gracefulShutdown(server, 1);
  });

  console.log("Error handlers (uncaughtException, unhandledRejection) set up.");
};