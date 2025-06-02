
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


export const addNewProduct = async (req, res, next) => {
  try {
    
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.category || !req.body.stock || !req.body.images || !req.body.images.length) {
        return next(new ErrorHandler(400, "Missing required product fields: name, description, price, category, stock, and at least one image are required."));
    }

    const productData = {
      ...req.body,
      createdBy: req.user._id, 
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


export const getAllProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      page,
      limit,
      "price[gte]": priceGte,
      "price[lte]": priceLte,
      "rating[gte]": ratingGte,
      sortBy, 
      order = 'asc', 
    } = req.query;

    const filters = {}; 
    const searchFilter = {}; 

    
    if (keyword) {
      searchFilter.name = { $regex: keyword, $options: "i" };
    }

    
    if (category) {
      filters.category = category;
    }

    
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

  
    if (ratingGte) {
        const gte = parseFloat(ratingGte);
        if (!isNaN(gte)) filters.rating = { $gte: gte };
    }

   
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const itemsPerPage = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * itemsPerPage;
    const paginationOptions = { skip, limit: itemsPerPage };

    
    const sortOptions = {};
    if (sortBy && ['name', 'price', 'rating', 'createdAt', 'updatedAt'].includes(sortBy)) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; 
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
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) { 
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
      createdAt: new Date(), 
    };

    const existingReviewIndex = product.reviews.findIndex(
      (rev) => rev.user.toString() === userId.toString()
    );

    if (existingReviewIndex >= 0) {
      product.reviews[existingReviewIndex] = review; 
    } else {
      product.reviews.push(review); 
    }

    
    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    } else {
      product.rating = 0;
    }
    product.numberOfReviews = product.reviews.length; 

    await product.save({ validateBeforeSave: true }); 

    res.status(200).json({ 
        success: true,
        message: "Review submitted successfully.",
        product 
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


export const deleteReview = async (req, res, next) => {
  try {
    const { productId, reviewId } = req.query; 

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

    
    if (reviewToDelete.user.toString() !== req.user._id.toString()) {
      
      return next(
        new ErrorHandler(403, "Forbidden: You are not authorized to delete this review.")
      );
    }

    
    product.reviews.splice(reviewIndex, 1);

    
    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    } else {
      product.rating = 0; 
    }
    product.numberOfReviews = product.reviews.length; 

    await product.save({ validateBeforeSave: true }); 

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      product, 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(new ErrorHandler(400, error.message));
    }
    if (error.kind === 'ObjectId') { 
        return next(new ErrorHandler(400, "Invalid ID format for product or review."));
    }
    console.error("Error in deleteReview:", error);
    return next(new ErrorHandler(500, "Error occurred while deleting the review."));
  }
};