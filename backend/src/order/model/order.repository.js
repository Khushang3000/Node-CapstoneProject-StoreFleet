// backend/src/order/model/order.repository.js
import OrderModel from "./order.schema.js";

/**
 * Creates a new order in the database.
 * @param {object} orderData - The data for the new order, conforming to OrderSchema.
 * @returns {Promise<OrderModel>} The created order document.
 * @throws {Error} If there's an issue saving the order (e.g., validation error).
 */
export const createNewOrderRepo = async (orderData) => {
  try {
    const newOrder = new OrderModel(orderData);
    const savedOrder = await newOrder.save();
    return savedOrder;
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Error in createNewOrderRepo:", error);
    // Re-throw the error so it can be caught by the controller and handled appropriately
    // (e.g., sending a specific error response to the client via the global error handler)
    throw error;
  }
};