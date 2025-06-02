// backend/src/product/model/product.repository.js
import ProductModel from "./product.schema.js";

export const addNewProductRepo = async (productData) => {
  const product = new ProductModel(productData);
  return await product.save();
};

/**
 * Retrieves a paginated, filtered, searched, and sorted list of products.
 * @param {object} queryOptions - Options for querying products.
 * @param {object} [queryOptions.filters={}] - MongoDB filter object (for category, price range, rating).
 * @param {object} [queryOptions.searchFilter={}] - MongoDB filter object for text search (e.g., on name).
 * @param {object} [queryOptions.pagination={ skip: 0, limit: 10 }] - Pagination options { skip, limit }.
 * @param {object} [queryOptions.sort={ createdAt: -1 }] - MongoDB sort object.
 * @returns {Promise<ProductModel[]>} Array of product documents.
 */
export const getAllProductsRepo = async ({
  filters = {},
  searchFilter = {},
  pagination = { skip: 0, limit: 10 }, // Default limit to 10
  sort = { createdAt: -1 } // Default sort by newest
}) => {
  // Combine general filters and search-specific filters
  const combinedFilters = { ...filters, ...searchFilter };

  return await ProductModel.find(combinedFilters)
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.limit);
};

export const updateProductRepo = async (productId, updatedData) => {
  return await ProductModel.findByIdAndUpdate(productId, updatedData, {
    new: true, // Return the modified document rather than the original
    runValidators: true, // Ensure schema validations are run on update
  });
};

export const deleProductRepo = async (productId) => {
  return await ProductModel.findByIdAndDelete(productId);
};

export const getProductDetailsRepo = async (productId) => {
  return await ProductModel.findById(productId);
};

/**
 * Gets the total count of products, optionally based on filters and search criteria.
 * @param {object} [filters={}] - MongoDB filter object.
 * @param {object} [searchFilter={}] - MongoDB filter object for text search.
 * @returns {Promise<number>} Total count of matching products.
 */
export const getTotalCountsOfProduct = async (filters = {}, searchFilter = {}) => {
  const combinedFilters = { ...filters, ...searchFilter };
  return await ProductModel.countDocuments(combinedFilters);
};

// This function is used by review operations to fetch the product.
export const findProductRepo = async (productId) => {
  return await ProductModel.findById(productId);
};