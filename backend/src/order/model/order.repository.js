
import OrderModel from "./order.schema.js";


export const createNewOrderRepo = async (orderData) => {
  try {
    const newOrder = new OrderModel(orderData);
    const savedOrder = await newOrder.save();
    return savedOrder;
  } catch (error) {
   
    console.error("Error in createNewOrderRepo:", error);
    
    throw error;
  }
};