// backend/middlewares/auth.js
import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/errorHandler.js";
import UserModel from "../src/user/models/user.schema.js"; // Ensure this path is correct relative to auth.js

export const auth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return next(new ErrorHandler(401, "Login required to access this resource. Please login."));
    }

    if (!process.env.JWT_Secret) {
        console.error("CRITICAL: JWT_Secret is not defined. Authentication will fail.");
        return next(new ErrorHandler(500, "Server configuration error. Unable to authenticate."));
    }

    const decodedData = jwt.verify(token, process.env.JWT_Secret);
    // In user.schema.js, we added 'role' to the JWT payload.
    // So, decodedData should ideally contain id and role.
    // req.user = await UserModel.findById(decodedData.id); // This makes another DB call.

    // Optimization: If JWT contains enough non-sensitive user data (like ID and role),
    // you might not need to fetch the full user object from DB on every authenticated request.
    // However, fetching ensures the user still exists and has not been disabled/deleted.
    // For this project, fetching user is fine.
    const user = await UserModel.findById(decodedData.id);

    if (!user) {
        // This case handles if the user was deleted after token issuance or token is for a non-existent user
        res.clearCookie("token"); // Clear the invalid token
        return next(new ErrorHandler(401, "User not found or token invalid. Please login again."));
    }

    req.user = user; // Attach the full user object to the request
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
        return next(new ErrorHandler(401, "Invalid token. Please login again."));
    }
    if (error.name === 'TokenExpiredError') {
        return next(new ErrorHandler(401, "Token expired. Please login again."));
    }
    console.error("Authentication error in auth middleware:", error);
    return next(new ErrorHandler(401, "Authentication failed. Please login again."));
  }
};

// Requirement 5: Fix authByUserRole("admin") middleware
// Restrict access ONLY to users with "admin" role (or specified roles)
export const authByUserRole = (...allowedRoles) => {
  return (req, res, next) => {
    // This middleware assumes 'auth' middleware has already run and populated req.user.
    if (!req.user || !req.user.role) {
        // This case should ideally not be reached if 'auth' runs first and req.user is mandatory.
        return next(
            new ErrorHandler(403, "Authentication error: User role not available. Access denied.")
        );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          403, // Forbidden
          `Access Denied: Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }
    // If user's role is in the allowedRoles array, proceed
    next();
  };
};