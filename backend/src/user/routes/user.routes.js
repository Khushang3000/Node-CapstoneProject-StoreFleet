
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
  updateUserProfileAndRole, 
  userLogin,
} from "../controller/user.controller.js";
import { auth, authByUserRole } from "../../../middlewares/auth.js"; 

const router = express.Router();


router.route("/signup").post(createNewUser);
router.route("/login").post(userLogin);
router.route("/logout").get(auth, logoutUser); 

router.route("/details").get(auth, getUserDetails);
router.route("/profile/update").put(auth, updateUserProfile);


router.route("/password/forget").post(forgetPassword);
router.route("/password/reset/:token").put(resetUserPassword);
router.route("/password/update").put(auth, updatePassword);



router.route("/admin/users").get(auth, authByUserRole("admin"), getAllUsers); 

router
  .route("/admin/users/:id") 
  .get(auth, authByUserRole("admin"), getUserDetailsForAdmin)
  .delete(auth, authByUserRole("admin"), deleteUser);


router
  .route("/admin/kpdate/:id") 
  .put(auth, authByUserRole("admin"), updateUserProfileAndRole);

export default router;