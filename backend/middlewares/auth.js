
import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/errorHandler.js";
import UserModel from "../src/user/models/user.schema.js"; 

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
    
    const user = await UserModel.findById(decodedData.id);

    if (!user) {
        
        res.clearCookie("token"); 
        return next(new ErrorHandler(401, "User not found or token invalid. Please login again."));
    }

    req.user = user; 
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


export const authByUserRole = (...allowedRoles) => {
  return (req, res, next) => {
    
    if (!req.user || !req.user.role) {
        
        return next(
            new ErrorHandler(403, "Authentication error: User role not available. Access denied.")
        );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          403, 
          `Access Denied: Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }
    
    next();
  };
};