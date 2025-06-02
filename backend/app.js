
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url'; 


const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);         


const configPath = path.resolve(__dirname, "config", "uat.env");



import express from "express";
import cookieParser from "cookie-parser";


import productRoutes from "./src/product/routes/product.routes.js";
import userRoutes from "./src/user/routes/user.routes.js";
import orderRoutes from "./src/order/routes/order.routes.js";


import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.js";

const app = express();


app.use(express.json()); 
app.use(cookieParser()); 


app.use("/api/storefleet/product", productRoutes);
app.use("/api/storefleet/user", userRoutes);
app.use("/api/storefleet/order", orderRoutes);


app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});


app.use(errorHandlerMiddleware);

export default app;