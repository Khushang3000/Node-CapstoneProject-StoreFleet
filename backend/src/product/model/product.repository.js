
import ProductModel from "./product.schema.js";

export const addNewProductRepo = async (productData) => {
  const product = new ProductModel(productData);
  return await product.save();
};


export const getAllProductsRepo = async ({
  filters = {},
  searchFilter = {},
  pagination = { skip: 0, limit: 10 },
  sort = { createdAt: -1 } 
}) => {
 
  const combinedFilters = { ...filters, ...searchFilter };

  return await ProductModel.find(combinedFilters)
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.limit);
};

export const updateProductRepo = async (productId, updatedData) => {
  return await ProductModel.findByIdAndUpdate(productId, updatedData, {
    new: true, 
    runValidators: true, 
  });
};

export const deleProductRepo = async (productId) => {
  return await ProductModel.findByIdAndDelete(productId);
};

export const getProductDetailsRepo = async (productId) => {
  return await ProductModel.findById(productId);
};


export const getTotalCountsOfProduct = async (filters = {}, searchFilter = {}) => {
  const combinedFilters = { ...filters, ...searchFilter };
  return await ProductModel.countDocuments(combinedFilters);
};


export const findProductRepo = async (productId) => {
  return await ProductModel.findById(productId);
};