
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
    unique: true, 
    validate: [validator.isEmail, "Please enter a valid email address."],
    trim: true,
    lowercase: true, 
  },
  password: {
    type: String,
    required: [true, "Please enter your password."],
    minLength: [6, "Password must be at least 6 characters long."],
    select: false, 
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
}, { timestamps: true }); 



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




userSchema.methods.getJWTToken = function () {
  if (!process.env.JWT_Secret || !process.env.JWT_Expire) {
    console.error("CRITICAL: JWT_Secret or JWT_Expire is not defined in environment variables. JWT generation will fail.");
  
  }
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_Secret, {
    expiresIn: process.env.JWT_Expire,
  });
};


userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword) return false;
  
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

  return resetToken; 
};

const UserModel = mongoose.model("User", userSchema);
export default UserModel;