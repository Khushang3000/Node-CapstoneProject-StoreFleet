
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const mongoURI = process.env.mongoURI;
    if (!mongoURI) {
        console.error("FATAL ERROR: mongoURI is not defined in environment variables.");
        process.exit(1); 
    }

    const res = await mongoose.connect(mongoURI, {
      
    });
    console.log(`MongoDB connected successfully with server: ${res.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection FAILED!");
    console.error(error.message);
    
    process.exit(1); 
  }
};