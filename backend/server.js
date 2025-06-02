// backend/server.js
import app from "./app.js"; // The configured Express app
import http from 'http';     // Node.js native HTTP module
import { connectDB } from "./config/db.js";
// Assuming setupErrorHandlers is exported from your errorHandlerMiddleware.js
// and it's designed to accept the httpServer instance for graceful shutdown.
import { setupErrorHandlers } from './middlewares/errorHandlerMiddleware.js';

const PORT = process.env.PORT || 3001; // Use a fallback port if not defined in .env

// Create an HTTP server instance using the Express app
const httpServer = http.createServer(app);

// Start the HTTP server
httpServer.listen(PORT, async () => { // Removed 'err' parameter as listen callback doesn't directly receive it like this for success
  console.log(`Attempting to start server on port ${PORT}...`);
  try {
    await connectDB(); // Connect to the database
    console.log(`Server is running at http://localhost:${PORT}`);

    // Setup handlers for uncaught exceptions and unhandled rejections
    // This is crucial and needs the actual httpServer instance for graceful shutdown.
    setupErrorHandlers(httpServer);

  } catch (dbError) {
    console.error(`Failed to connect to the database: ${dbError.message}`);
    console.error("Server startup failed due to database connection error. Exiting...");
    // Attempt to close server if it somehow started listening but DB failed during this async block
    // (though listen callback implies it's already listening before this async block fully resolves)
    httpServer.close(() => {
      process.exit(1); // Exit if DB connection fails
    });
    // Force exit if server close hangs after DB error
    setTimeout(() => {
        console.error("Force exiting after DB connection failure during startup.");
        process.exit(1);
    }, 5000); // 5 seconds timeout
  }
});

// Handle errors during the httpServer.listen() call itself (e.g., port in use)
httpServer.on('error', (error) => {
  console.error(`Server failed to start with error: ${error.message}`);
  if (error.syscall !== 'listen') {
    throw error;
  }
  // Specific listen errors
  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${PORT} requires elevated privileges.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${PORT} is already in use.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});