
import { sendPasswordResetEmail } from "../../../utils/emails/passwordReset.js";
import { sendWelcomeEmail } from "../../../utils/emails/welcomeMail.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { sendToken } from "../../../utils/sendToken.js";
import {
  createNewUserRepo,
  deleteUserRepo,
  findUserForPasswordResetRepo,
  findUserRepo,
  findUserByIdRepo,
  getAllUsersRepo,
  updateUserProfileRepo,
  updateUserRoleAndProfileRepo,
} from "../models/user.repository.js";
import UserModel from "../models/user.schema.js"; 
import crypto from "crypto";

export const createNewUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
        return next(new ErrorHandler(400, "Name, email, and password are required."));
    }
    
    const newUser = await createNewUserRepo({ name, email, password });

    
    try {
      await sendWelcomeEmail(newUser); 
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      
    }

    await sendToken(newUser, res, 201); 

  } catch (err) {
   
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return next(new ErrorHandler(400, "Email already exists. Please try a different email."));
    }
    if (err.name === 'ValidationError') { 
        return next(new ErrorHandler(400, err.message));
    }
    console.error("Error in createNewUser:", err);
    return next(new ErrorHandler(500, "Error occurred during registration."));
  }
};

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "Please enter both email and password."));
    }

    const user = await findUserRepo({ email: email.toLowerCase() }, true); 
    if (!user) {
      return next(
        new ErrorHandler(401, "Invalid email or password.") 
      );
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Invalid email or password."));
    }
    await sendToken(user, res, 200);
  } catch (error) {
    console.error("Error in userLogin:", error);
    return next(new ErrorHandler(500, "Login failed. Please try again later."));
  }
};

export const logoutUser = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict", 
    })
    .json({ success: true, message: "Logout successful." });
};


export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler(400, "Please provide your email address."));
    }

    
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      
      console.log(`Forget password attempt for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: "If your email address is registered, you will receive a password reset token shortly.",
      });
    }

    const resetToken = user.getResetPasswordToken(); 
    await user.save({ validateBeforeSave: false }); 

    try {
      
      await sendPasswordResetEmail(user, resetToken);
      res.status(200).json({
        success: true,
        message: `Password reset token sent successfully to ${user.email}. Please check your inbox for the token and instructions.`,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorHandler(500, "Failed to send password reset email. Please try again."));
    }

  } catch (error) {
    console.error("Error in forgetPassword:", error);
    return next(new ErrorHandler(500, "Error processing forget password request."));
  }
};


export const resetUserPassword = async (req, res, next) => {
  try {
    const { token } = req.params; 
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return next(new ErrorHandler(400, "New password and confirm password are required."));
    }
    if (newPassword !== confirmPassword) {
      return next(new ErrorHandler(400, "Passwords do not match."));
    }
    if (newPassword.length < 6) { 
        return next(new ErrorHandler(400, "Password must be at least 6 characters long."));
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await findUserForPasswordResetRepo(hashedToken);

    if (!user) {
      return next(
        new ErrorHandler(400, "Password reset token is invalid or has expired. Please request a new one.")
      );
    }

    user.password = newPassword; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); 

    await sendToken(user, res, 200); 

  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    return next(new ErrorHandler(500, "Error resetting password."));
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const userDetails = await findUserByIdRepo(req.user._id);
    if (!userDetails) {
        return next(new ErrorHandler(404, "User not found."));
    }
    res.status(200).json({ success: true, user: userDetails });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    return next(new ErrorHandler(500, "Error fetching user details."));
  }
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ErrorHandler(400, "All password fields are required."));
    }
    if (newPassword !== confirmPassword) {
      return next(
        new ErrorHandler(400, "New password and confirm password do not match.")
      );
    }
    if (newPassword.length < 6) {
        return next(new ErrorHandler(400, "New password must be at least 6 characters long."));
    }

    const user = await findUserByIdRepo(req.user._id, true); 
    if (!user) return next(new ErrorHandler(404, "User not found."));

    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Incorrect current password."));
    }

    user.password = newPassword; 
    await user.save();

    await sendToken(user, res, 200);
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return next(new ErrorHandler(500, "Error updating password."));
  }
};

export const updateUserProfile = async (req, res, next) => {
  const { name } = req.body;
  const dataToUpdate = {};

  if (name) dataToUpdate.name = name;
  

  if (Object.keys(dataToUpdate).length === 0) {
    return next(new ErrorHandler(400, "No data provided for update."));
  }

  try {
    const updatedUser = await updateUserProfileRepo(req.user._id, dataToUpdate);
    if (!updatedUser) {
        return next(new ErrorHandler(404, "User not found for update."));
    }
    res.status(200).json({ success: true, message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    if (error.name === 'ValidationError') {
        return next(new ErrorHandler(400, error.message));
    }
    console.error("Error in updateUserProfile:", error);
    return next(new ErrorHandler(500, "Error updating user profile."));
  }
};



export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersRepo();
    res.status(200).json({ success: true, users: allUsers });
  } catch (error) {
    console.error("Error in getAllUsers (admin):", error);
    return next(new ErrorHandler(500, "Error fetching all users."));
  }
};

export const getUserDetailsForAdmin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const userDetails = await findUserByIdRepo(userId);
    if (!userDetails) {
      return next(new ErrorHandler(404, "User not found with the provided ID."));
    }
    res.status(200).json({ success: true, user: userDetails });
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return next(new ErrorHandler(400, "Invalid User ID format."));
    }
    console.error("Error in getUserDetailsForAdmin:", error);
    return next(new ErrorHandler(500, "Error fetching user details."));
  }
};


export const updateUserProfileAndRole = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.id;
    const { name, email, role } = req.body;

    const dataForUpdate = {};
    if (name) dataForUpdate.name = name;
    if (email) dataForUpdate.email = email.toLowerCase();
    if (role) {
        if (!['user', 'admin'].includes(role)) {
            return next(new ErrorHandler(400, "Invalid role specified. Allowed roles are 'user' or 'admin'."));
        }
        dataForUpdate.role = role;
    }

    if (Object.keys(dataForUpdate).length === 0) {
        return next(new ErrorHandler(400, "No data provided for update (name, email, or role)."));
    }

    const updatedUser = await updateUserRoleAndProfileRepo(userIdToUpdate, dataForUpdate);

    if (!updatedUser) {
      return next(new ErrorHandler(404, "User not found for update."));
    }

    res.status(200).json({
      success: true,
      message: "User profile and/or role updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return next(new ErrorHandler(400, "Email already exists. Please use a different email."));
    }
    if (error.name === 'ValidationError') {
        return next(new ErrorHandler(400, error.message));
    }
    if (error.kind === 'ObjectId') {
        return next(new ErrorHandler(400, "Invalid User ID format."));
    }
    console.error("Error in updateUserProfileAndRole (admin):", error);
    return next(new ErrorHandler(500, "Error updating user profile and role."));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedUser = await deleteUserRepo(userId);
    if (!deletedUser) {
      return next(new ErrorHandler(404, "User not found with the provided ID."));
    }
    res.status(200).json({
        success: true,
        message: "User deleted successfully.",
        user: deletedUser
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
        return next(new ErrorHandler(400, "Invalid User ID format."));
    }
    console.error("Error in deleteUser (admin):", error);
    return next(new ErrorHandler(500, "Error deleting user."));
  }
};