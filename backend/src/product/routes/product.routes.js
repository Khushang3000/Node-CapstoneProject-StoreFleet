import express from "express";
import {
  addNewProduct,
  deleteProduct,
  deleteReview,
  getAllProducts,
  getAllReviewsOfAProduct,
  getProductDetails,
  rateProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { auth, authByUserRole } from "../../../middlewares/auth.js";

const router = express.Router();


router.route("/products").get(getAllProducts);
router.route("/details/:id").get(getProductDetails);
router.route("/reviews/:id").get(getAllReviewsOfAProduct);


router.route("/add").post(auth, authByUserRole("admin"), addNewProduct);
router.route("/update/:id").put(auth, authByUserRole("admin"), updateProduct);


router
  .route("/delete/:id")
  .delete(auth, authByUserRole("admin"), deleteProduct);


router.route("/rate/:id").put(auth, rateProduct);


router.route("/review/delete").delete(auth, deleteReview);

export default router;
