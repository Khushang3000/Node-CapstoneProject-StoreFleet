// backend/src/user/routes/user.routes.js
import express from "express";
import {
  createNewUser,
  deleteUser,
  forgetPassword,
  getAllUsers,
  getUserDetails,
  getUserDetailsForAdmin,
  logoutUser,
  resetUserPassword,
  updatePassword,
  updateUserProfile,
  updateUserProfileAndRole, // Make sure this is imported
  userLogin,
} from "../controller/user.controller.js";
import { auth, authByUserRole } from "../../../middlewares/auth.js"; // Ensure auth.js is correct

const router = express.Router();

// --- User Authentication & Profile Routes ---
router.route("/signup").post(createNewUser);
router.route("/login").post(userLogin);
router.route("/logout").get(auth, logoutUser); // GET for logout is common, though POST is also acceptable

router.route("/details").get(auth, getUserDetails);
router.route("/profile/update").put(auth, updateUserProfile);

// --- Password Management Routes ---
router.route("/password/forget").post(forgetPassword);
router.route("/password/reset/:token").put(resetUserPassword); // PUT is appropriate for resource state change
router.route("/password/update").put(auth, updatePassword);


// --- Admin User Management Routes ---
router.route("/admin/users").get(auth, authByUserRole("admin"), getAllUsers); // Standardized path

router
  .route("/admin/users/:id") // Standardized path for specific user
  .get(auth, authByUserRole("admin"), getUserDetailsForAdmin)
  .delete(auth, authByUserRole("admin"), deleteUser);

// Requirement 6: Admin Role Management
// Route: PUT /kpl/storefleet/user/admin/kpdate/:id (as specified in requirements)
// This route allows admins to update other users' roles (and profiles as per controller)
router
  .route("/admin/kpdate/:id") // Using the path fragment from problem statement under an admin prefix
  .put(auth, authByUserRole("admin"), updateUserProfileAndRole);

export default router;