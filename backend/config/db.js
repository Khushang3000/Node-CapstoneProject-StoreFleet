// backend/config/db.js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const mongoURI = process.env.mongoURI;
    if (!mongoURI) {
        console.error("FATAL ERROR: mongoURI is not defined in environment variables.");
        process.exit(1); // Exit if mongoURI is missing
    }

    const res = await mongoose.connect(mongoURI, {
      // useNewUrlParser: true, // Deprecated and default in Mongoose 6+
      // useUnifiedTopology: true, // Deprecated and default in Mongoose 6+
      // For Mongoose 6+, these options are no longer needed and can be removed.
      // Mongoose will use reasonable defaults.
    });
    console.log(`MongoDB connected successfully with server: ${res.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection FAILED!");
    console.error(error.message); // Log the error message
    // console.error(error); // Uncomment for full error stack during debugging
    process.exit(1); // Exit process with failure code if DB connection fails
  }
};