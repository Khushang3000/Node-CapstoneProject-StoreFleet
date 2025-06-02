// backend/src/user/models/user.schema.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User name is required."],
    maxLength: [30, "User name cannot exceed 30 characters."],
    minLength: [2, "User name should have at least 2 characters."],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "User email is required."],
    unique: true, // This will trigger E11000 for duplicate emails
    validate: [validator.isEmail, "Please enter a valid email address."],
    trim: true,
    lowercase: true, // Good practice to store emails in lowercase
  },
  password: {
    type: String,
    required: [true, "Please enter your password."],
    minLength: [6, "Password must be at least 6 characters long."],
    select: false, // Password won't be sent back in queries by default
  },
  profileImg: {
    public_id: {
      type: String,
      default: "default_profile_public_id",
    },
    url: {
      type: String,
      default: "https://via.placeholder.com/150/0000FF/808080?Text=User",
    },
  },
  role: {
    type: String,
    default: "user",
    enum: {
        values: ["user", "admin"],
        message: '{VALUE} is not a supported role.'
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// --- Pre-save Hooks ---

// Requirement 3: Password Hashing Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- Instance Methods ---

// Generate JWT Token
userSchema.methods.getJWTToken = function () {
  if (!process.env.JWT_Secret || !process.env.JWT_Expire) {
    console.error("CRITICAL: JWT_Secret or JWT_Expire is not defined in environment variables. JWT generation will fail.");
    // Consider throwing an error: throw new Error("JWT configuration missing.");
  }
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_Secret, {
    expiresIn: process.env.JWT_Expire,
  });
};

// Compare User Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword) return false;
  // Ensure 'this.password' is available. If the user object was fetched without '+password', this will be undefined.
  // The findUserRepo (when withPassword=true) and findUserForPasswordResetRepo handle selecting the password.
  return await bcrypt.compare(enteredPassword, this.password);
};

// Requirement 4: Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

  return resetToken; // Return the plain (unhashed) token
};

const UserModel = mongoose.model("User", userSchema);
export default UserModel;