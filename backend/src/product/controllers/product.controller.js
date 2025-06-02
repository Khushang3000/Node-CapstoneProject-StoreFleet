// backend/src/product/controllers/product.controller.js
import { ErrorHandler } from "../../../utils/errorHandler.js";
import {
  addNewProductRepo,
  deleProductRepo,
  findProductRepo,
  getAllProductsRepo,
  getProductDetailsRepo,
  getTotalCountsOfProduct,
  updateProductRepo,
} from "../model/product.repository.js";
// ProductModel import is generally not needed here if all DB ops are in the repository.

export const addNewProduct = async (req, res, next) => {
  try {
    // Assuming req.body.images is an array of objects like [{ public_id: "...", url: "..." }]
    // Image upload logic to a service like Cloudinary would typically occur before this,
    // and req.body.images would be populated with the results.
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.category || !req.body.stock || !req.body.images || !req.body.images.length) {
        return next(new ErrorHandler(400, "Missing required product fields: name, description, price, category, stock, and at least one image are required."));
    }

    const productData = {
      ...req.body,
      createdBy: req.user._id, // Populated by 'auth' middleware
    };

    const product = await addNewProductRepo(productData);
    res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new ErrorHandler(400, error.message));
    }
    console.error("Error in addNewProduct:", error);
    return next(new ErrorHandler(500, "Error occurred while adding the product."));
  }
};

// Requirement 7: Product Filtering & Pagination
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      keyword, // For searching by product name
      category,
      page,
      limit,
      "price[gte]": priceGte,
      "price[lte]": priceLte,
      "rating[gte]": ratingGte,
      sortBy, // Field to sort by e.g., 'price', 'rating', 'createdAt'
      order = 'asc', // Sort order: 'asc' or 'desc'
    } = req.query;

    const filters = {}; // For exact matches or range queries
    const searchFilter = {}; // Specifically for text search like $regex

    // 1. Search by keyword in product name (case-insensitive)
    if (keyword) {
      searchFilter.name = { $regex: keyword, $options: "i" };
    }

    // 2. Filter by category
    if (category) {
      filters.category = category;
    }

    // 3. Filter by price range
    if (priceGte || priceLte) {
      filters.price = {};
      if (priceGte) {
        const gte = parseFloat(priceGte);
        if (!isNaN(gte)) filters.price.$gte = gte;
      }
      if (priceLte) {
        const lte = parseFloat(priceLte);
        if (!isNaN(lte)) filters.price.$lte = lte;
      }
    }

    // 4. Filter by rating
    if (ratingGte) {
        const gte = parseFloat(ratingGte);
        if (!isNaN(gte)) filters.rating = { $gte: gte };
    }

    // 5. Pagination
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const itemsPerPage = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * itemsPerPage;
    const paginationOptions = { skip, limit: itemsPerPage };

    // 6. Sorting
    const sortOptions = {};
    if (sortBy && ['name', 'price', 'rating', 'createdAt', 'updatedAt'].includes(sortBy)) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Default sort by newest
    }

    const products = await getAllProductsRepo({
      filters,
      searchFilter,
      pagination: paginationOptions,
      sort: sortOptions,
    });

    const totalProductsCount = await getTotalCountsOfProduct(filters, searchFilter);
    const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          itemsPerPage,
          totalItems: totalProductsCount,
          itemsOnPage: products.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return next(new ErrorHandler(500, "Error fetching products."));
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    // Image update logic would be more complex, involving deleting old & uploading new images.
    // For now, assuming req.body might contain updated image URLs if any.
    if (Object.keys(req.body).length === 0) {
        return next(new ErrorHandler(400, "No data provided for update."));
    }

    const updatedProduct = await updateProductRepo(productId, req.body);
    if (!updatedProduct) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new ErrorHandler(400, error.message));
    }
    if (error.kind === 'ObjectId' && error.path === '_id') {
        return next(new ErrorHandler(400, "Invalid Product ID format."));
    }
    console.error("Error in updateProduct:", error);
    return next(new ErrorHandler(500, "Error occurred while updating the product."));
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    // Add logic here to delete associated product images from cloud storage (e.g., Cloudinary)
    // based on the public_ids stored in deletedProduct.images.

    const deletedProduct = await deleProductRepo(productId);
    if (!deletedProduct) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, message: "Product deleted successfully.", product: deletedProduct });
  } catch (error) {
    if (error.kind === 'ObjectId' && error.path === '_id') {
        return next(new ErrorHandler(400, "Invalid Product ID format."));
    }
    console.error("Error in deleteProduct:", error);
    return next(new ErrorHandler(500, "Error occurred while deleting the product."));
  }
};

export const getProductDetails = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const productDetails = await getProductDetailsRepo(productId);
    if (!productDetails) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, product: productDetails });
  } catch (error) {
     if (error.kind === 'ObjectId' && error.path === '_id') {
        return next(new ErrorHandler(400, "Invalid Product ID format."));
    }
    console.error("Error in getProductDetails:", error);
    return next(new ErrorHandler(500, "Error fetching product details."));
  }
};

// Requirement 8: Review Management (Partially addressed, ensuring numberOfReviews and rating are updated)
export const rateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    if (rating == null) {
      return next(new ErrorHandler(400, "Rating value is required."));
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) { // Assuming 1-5 rating scale
        return next(new ErrorHandler(400, "Rating must be a number between 1 and 5."));
    }

    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }

    const review = {
      user: userId,
      name: userName,
      rating: numericRating,
      comment: comment || "",
      createdAt: new Date(), // Add timestamp to review
    };

    const existingReviewIndex = product.reviews.findIndex(
      (rev) => rev.user.toString() === userId.toString()
    );

    if (existingReviewIndex >= 0) {
      product.reviews[existingReviewIndex] = review; // Update existing review
    } else {
      product.reviews.push(review); // Add new review
    }

    // Recalculate average rating and number of reviews
    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    } else {
      product.rating = 0;
    }
    product.numberOfReviews = product.reviews.length; // Update based on product.schema.js change

    await product.save({ validateBeforeSave: true }); // Enable validation

    res.status(200).json({ // 200 OK for update or creation of sub-resource
        success: true,
        message: "Review submitted successfully.",
        product // Send back the updated product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new ErrorHandler(400, error.message));
    }
    if (error.kind === 'ObjectId' && error.path === '_id') {
        return next(new ErrorHandler(400, "Invalid Product ID format."));
    }
    console.error("Error in rateProduct:", error);
    return next(new ErrorHandler(500, "Error occurred while rating the product."));
  }
};

export const getAllReviewsOfAProduct = async (req, res, next) => {
  try {
    const product = await findProductRepo(req.params.id);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }
    res.status(200).json({ success: true, reviews: product.reviews });
  } catch (error) {
    if (error.kind === 'ObjectId' && error.path === '_id') {
        return next(new ErrorHandler(400, "Invalid Product ID format."));
    }
    console.error("Error in getAllReviewsOfAProduct:", error);
    return next(new ErrorHandler(500, "Error fetching product reviews."));
  }
};

// Requirement 8: Review Management Fix
export const deleteReview = async (req, res, next) => {
  try {
    const { productId, reviewId } = req.query; // Get reviewId from query params

    if (!productId || !reviewId) {
      return next(
        new ErrorHandler(
          400,
          "Product ID and Review ID are required as query parameters."
        )
      );
    }

    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found."));
    }

    const reviewIndex = product.reviews.findIndex(
      (rev) => rev._id.toString() === reviewId.toString()
    );

    if (reviewIndex < 0) {
      return next(new ErrorHandler(404, "Review not found on this product."));
    }

    const reviewToDelete = product.reviews[reviewIndex];

    // Requirement 8: Restrict review deletion to review owner ONLY
    if (reviewToDelete.user.toString() !== req.user._id.toString()) {
      // Allow admin to delete any review as well (common enhancement, but sticking to "owner only" for strictness)
      // if (req.user.role !== 'admin' && reviewToDelete.user.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler(403, "Forbidden: You are not authorized to delete this review.")
      );
    }

    // Remove the review
    product.reviews.splice(reviewIndex, 1);

    // Requirement 8: Update product ratings automatically when review is deleted
    // Recalculate average rating and number of reviews
    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    } else {
      product.rating = 0; // Reset rating if no reviews are left
    }
    product.numberOfReviews = product.reviews.length; // Update number of reviews

    await product.save({ validateBeforeSave: true }); // Enable validation

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      product, // Send back the updated product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new ErrorHandler(400, error.message));
    }
    if (error.kind === 'ObjectId') { // Handles invalid productId or reviewId format if direct DB op was attempted
        return next(new ErrorHandler(400, "Invalid ID format for product or review."));
    }
    console.error("Error in deleteReview:", error);
    return next(new ErrorHandler(500, "Error occurred while deleting the review."));
  }
};