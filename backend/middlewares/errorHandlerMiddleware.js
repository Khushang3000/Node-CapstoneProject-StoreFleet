

export const errorHandlerMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `Duplicate value entered for ${field} field. Please choose another value.`;
    err.statusCode = 400; 
  }

  
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    err.message = messages.join(', ');
    err.statusCode = 400;
  }

  
  if (err.name === 'JsonWebTokenError') {
    err.message = "Invalid token. Please login again.";
    err.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    err.message = "Token expired. Please login again.";
    err.statusCode = 401;
  }

  
  if (process.env.NODE_ENV !== 'production') {
    console.error("ERROR 💥:", err);
  } else {
    
    
    if (err.isOperational) { 
        console.error("OPERATIONAL ERROR:", err.message);
    } else {
        console.error("PROGRAMMING OR UNKNOWN ERROR:", err);
    }
  }


  res.status(err.statusCode).json({
    success: false,
    message: err.message, 
  });
};


const gracefulShutdown = (server, exitCode = 1) => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
        console.log("HTTP server closed.");
       
        process.exit(exitCode);
    });

    
    setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(exitCode);
    }, 10000); 
};



export const setupErrorHandlers = (server) => {
  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err); 
    gracefulShutdown(server, 1);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    
    if (err instanceof Error) {
        console.error(err.name, err.message);
        console.error(err); 
    } else {
        console.error("Unknown unhandled rejection:", err);
    }
    gracefulShutdown(server, 1);
  });

  console.log("Error handlers (uncaughtException, unhandledRejection) set up.");
};