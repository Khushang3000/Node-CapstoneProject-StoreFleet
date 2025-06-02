
import UserModel from "./user.schema.js";

export const createNewUserRepo = async (userData) => {
  const user = new UserModel(userData);
  return await user.save();
};


export const findUserRepo = async (filter, selectPassword = false) => {
  const query = UserModel.findOne(filter);
  return selectPassword ? await query.select("+password") : await query;
};


export const findUserByIdRepo = async (userId, selectPassword = false) => {
    const query = UserModel.findById(userId);
    return selectPassword ? await query.select("+password") : await query;
};


export const findUserForPasswordResetRepo = async (hashedResetToken) => {
  return await UserModel.findOne({
    resetPasswordToken: hashedResetToken,
    resetPasswordExpire: { $gt: Date.now() }, 
  }).select("+password"); 
};


export const updateUserProfileRepo = async (userId, dataToUpdate) => {
 
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
  return await UserModel.find({}); 
};

export const deleteUserRepo = async (userId) => {
  return await UserModel.findByIdAndDelete(userId);
};


export const updateUserRoleAndProfileRepo = async (userIdToUpdate, dataForUpdate) => {
 
  const { password, ...allowedUpdates } = dataForUpdate;
   if (password) {
      console.warn("Attempted to update password via updateUserRoleAndProfileRepo. This is not allowed by this function.");
      
   }
  return await UserModel.findByIdAndUpdate(userIdToUpdate, allowedUpdates, {
    new: true, 
    runValidators: true, 
  });
};