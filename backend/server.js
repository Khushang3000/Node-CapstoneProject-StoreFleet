
import app from "./app.js"; 
import http from 'http';     
import { connectDB } from "./config/db.js";

import { setupErrorHandlers } from './middlewares/errorHandlerMiddleware.js';

const PORT = process.env.PORT || 3001; 


const httpServer = http.createServer(app);


httpServer.listen(PORT, async () => { 
  console.log(`Attempting to start server on port ${PORT}...`);
  try {
    await connectDB(); 
    console.log(`Server is running at http://localhost:${PORT}`);

    
    setupErrorHandlers(httpServer);

  } catch (dbError) {
    console.error(`Failed to connect to the database: ${dbError.message}`);
    console.error("Server startup failed due to database connection error. Exiting...");
    
    httpServer.close(() => {
      process.exit(1); 
    });
    
    setTimeout(() => {
        console.error("Force exiting after DB connection failure during startup.");
        process.exit(1);
    }, 5000); 
  }
});


httpServer.on('error', (error) => {
  console.error(`Server failed to start with error: ${error.message}`);
  if (error.syscall !== 'listen') {
    throw error;
  }
  
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