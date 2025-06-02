// backend/app.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url'; // For ES module __dirname equivalent

// --- DOTENV CONFIGURATION - CRITICAL: SHOULD BE AT THE VERY TOP ---
const __filename = fileURLToPath(import.meta.url); // Gets the full path to the current file (app.js)
const __dirname = path.dirname(__filename);         // Gets the directory name of app.js (e.g., C:\...\backend)

// Constructs the path to uat.env, assuming it's in 'config/uat.env' relative to app.js's directory
const configPath = path.resolve(__dirname, "config", "uat.env");

// console.log("------------------------------------------------------");
// console.log("Attempting to load .env file from path:", configPath);
// const loadEnvResult = dotenv.config({ path: configPath });

// if (loadEnvResult.error) {
//   console.error("FATAL ERROR: Could not load .env file.");
//   console.error("dotenv error details:", loadEnvResult.error);
//   console.error("Please ensure the .env file exists at the specified path and is readable.");
//   // You might want to exit if the .env file is critical and not found,
//   // though db.js already exits if mongoURI is missing.
//   // process.exit(1);
// } else if (loadEnvResult.parsed && Object.keys(loadEnvResult.parsed).length === 0) {
//   console.warn("WARNING: .env file was found and loaded, but it is EMPTY or contains no valid variables.");
//   console.warn("Path checked:", configPath);
//   // This means process.env variables might not be set as expected.
// } else if (loadEnvResult.parsed) {
//   console.log("Successfully loaded .env file.");
//   console.log("Loaded environment variables:", loadEnvResult.parsed); // Optional: Uncomment to see all loaded variables
//   if (!loadEnvResult.parsed.mongoURI) {
//     console.warn("WARNING: .env file loaded, but 'mongoURI' is NOT defined within it.");
//   }
//   if (!loadEnvResult.parsed.PORT) {
//     console.warn("WARNING: .env file loaded, but 'PORT' is NOT defined within it (will use fallback).");
//   }
// } else {
//     // This case should ideally not be hit if .error is not present, but as a fallback.
//     console.warn("WARNING: dotenv.config() did not return an error, but no parsed variables were found. Check .env file content and path.");
//     console.warn("Path checked:", configPath);
// }
// console.log("------------------------------------------------------");
// --- END DOTENV CONFIGURATION ---

import express from "express";
import cookieParser from "cookie-parser";

// Import Routers
import productRoutes from "./src/product/routes/product.routes.js";
import userRoutes from "./src/user/routes/user.routes.js";
import orderRoutes from "./src/order/routes/order.routes.js";

// Import Error Handling Middleware
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.js";

const app = express();

// Core Middlewares
app.use(express.json()); // For parsing application/json request bodies
app.use(cookieParser()); // For parsing cookies

// API Routes
app.use("/api/storefleet/product", productRoutes);
app.use("/api/storefleet/user", userRoutes);
app.use("/api/storefleet/order", orderRoutes);

// Catch-all for 404 Not Found routes
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Global Error Handling Middleware
app.use(errorHandlerMiddleware);

export default app;