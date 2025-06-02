// backend/src/user/models/user.repository.js
import UserModel from "./user.schema.js";

export const createNewUserRepo = async (userData) => {
  const user = new UserModel(userData);
  return await user.save();
};

/**
 * Finds a user based on a filter.
 * @param {object} filter - MongoDB filter object (e.g., { email: 'test@example.com' }).
 * @param {boolean} selectPassword - Whether to include the password in the returned document.
 * @returns {Promise<UserModel|null>} The user document or null if not found.
 */
export const findUserRepo = async (filter, selectPassword = false) => {
  const query = UserModel.findOne(filter);
  return selectPassword ? await query.select("+password") : await query;
};

/**
 * Finds a user by their ID.
 * @param {string} userId - The ID of the user.
 * @param {boolean} selectPassword - Whether to include the password.
 * @returns {Promise<UserModel|null>}
 */
export const findUserByIdRepo = async (userId, selectPassword = false) => {
    const query = UserModel.findById(userId);
    return selectPassword ? await query.select("+password") : await query;
};

/**
 * Finds a user for password reset using a hashed token.
 * Also selects the password field to allow updating it.
 * @param {string} hashedResetToken - The hashed reset token.
 * @returns {Promise<UserModel|null>}
 */
export const findUserForPasswordResetRepo = async (hashedResetToken) => {
  return await UserModel.findOne({
    resetPasswordToken: hashedResetToken,
    resetPasswordExpire: { $gt: Date.now() }, // Check if token is not expired
  }).select("+password"); // Select password so it can be updated and re-hashed by pre-save hook
};

/**
 * Updates a user's profile information (excluding password and role).
 * @param {string} userId - The ID of the user to update.
 * @param {object} dataToUpdate - Data to update (e.g., name, profileImg).
 * @returns {Promise<UserModel|null>} The updated user document.
 */
export const updateUserProfileRepo = async (userId, dataToUpdate) => {
  // Explicitly exclude password and role from being updated by this function
  const { password, role, ...updatableData } = dataToUpdate;
  if (password) {
      console.warn("Attempted to update password via updateUserProfileRepo. This is not allowed by this function.");
  }
  if (role) {
      console.warn("Attempted to update role via updateUserProfileRepo. Use updateUserRoleAndProfileRepo for role changes.");
  }

  return await UserModel.findByIdAndUpdate(userId, updatableData, {
    new: true,
    runValidators: true,
  });
};

export const getAllUsersRepo = async () => {
  return await UserModel.find({}); // For admin view
};

export const deleteUserRepo = async (userId) => {
  return await UserModel.findByIdAndDelete(userId);
};

/**
 * Updates a user's profile and/or role (typically by an admin).
 * Requirement 6: Admin Role Management.
 * @param {string} userIdToUpdate - The ID of the user to update.
 * @param {object} dataForUpdate - Data to update (can include name, email, role).
 * @returns {Promise<UserModel|null>} The updated user document.
 */
export const updateUserRoleAndProfileRepo = async (userIdToUpdate, dataForUpdate) => {
  // Admin can update role, name, email. Password should not be updated here.
  // The controller should validate the dataForUpdate (e.g., ensure 'role' is valid).
  const { password, ...allowedUpdates } = dataForUpdate;
   if (password) {
      console.warn("Attempted to update password via updateUserRoleAndProfileRepo. This is not allowed by this function.");
      // Consider throwing an error or simply ignoring the password field
   }
  return await UserModel.findByIdAndUpdate(userIdToUpdate, allowedUpdates, {
    new: true, // Return the modified document
    runValidators: true, // Ensure schema validations are run
  });
};