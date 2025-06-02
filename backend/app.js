// backend/app.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

// Import Routers
import productRoutes from "./src/product/routes/product.routes.js";
import userRoutes from "./src/user/routes/user.routes.js";
import orderRoutes from "./src/order/routes/order.routes.js";

// Import Error Handling Middleware
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.js";

// Configure dotenv path
// Assumes app.js is in 'backend/' and uat.env is in 'backend/config/'
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const configPath = path.resolve(__dirname, "config", "uat.env");
dotenv.config({ path: configPath });

const app = express();

// Core Middlewares
app.use(express.json()); // For parsing application/json request bodies
app.use(cookieParser()); // For parsing cookies

// API Routes
app.use("/api/storefleet/product", productRoutes);
app.use("/api/storefleet/user", userRoutes);
app.use("/api/storefleet/order", orderRoutes);

// Catch-all for 404 Not Found routes
// This should be placed after all your API routes are defined.
app.use((req, res, next) => {
    // Create an error object to be handled by the global error handler
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error); // Pass the error to the global error handler
});

// Global Error Handling Middleware
// This must be the LAST piece of middleware added to the app.
app.use(errorHandlerMiddleware);

export default app;