// backend/src/order/controllers/order.controller.js
import { createNewOrderRepo } from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js"; // Ensure path is correct

export const createNewOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderedItems,
      paymentInfo, // Expected: { id: 'transaction_id_from_payment_gateway' }
      itemsPrice,    // Price of all items before tax and shipping
      taxPrice,
      shippingPrice,
      totalPrice,    // Grand total
    } = req.body;

    // Basic validation for required fields
    if (
      !shippingInfo ||
      !orderedItems || !orderedItems.length ||
      !paymentInfo || !paymentInfo.id || // Ensure payment transaction ID is present
      itemsPrice == null || // Check for null or undefined
      taxPrice == null ||
      shippingPrice == null ||
      totalPrice == null
    ) {
      return next(new ErrorHandler(400, "Missing required fields for order creation. Please provide all order details."));
    }

    // Server-side validation of total price (recommended)
    // This helps prevent tampering with prices on the client-side.
    const calculatedServerTotalPrice = Number(itemsPrice) + Number(taxPrice) + Number(shippingPrice);
    if (Math.abs(calculatedServerTotalPrice - Number(totalPrice)) > 0.01) { // Tolerance for floating point issues
        console.warn(`Price mismatch: Client total ${totalPrice}, Server calculated total ${calculatedServerTotalPrice}. Order data:`, req.body);
        return next(new ErrorHandler(400, "Total price mismatch. Please verify cart calculation before placing the order."));
    }

    const orderData = {
      shippingInfo,
      orderedItems,
      user: req.user._id, // Get user ID from the authenticated user (populated by 'auth' middleware)
      paymentInfo: {
        id: paymentInfo.id, // Transaction ID from payment gateway
        status: true,       // Assuming order is created after successful payment confirmation
      },
      paidAt: new Date(),   // Set paidAt to current time, as payment is considered confirmed
      itemsPrice: Number(itemsPrice),
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      orderStatus: "Processing", // Default status for a new order as per schema
      // createdAt will be set by default in the schema (if using {timestamps: true} or default: Date.now())
    };

    const newOrder = await createNewOrderRepo(orderData);

    res.status(201).json({ // 201 Created status for successful resource creation
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });

  } catch (error) {
    // Handle errors, including Mongoose validation errors thrown by the repository
    if (error.name === 'ValidationError') {
        // Construct a more readable error message from Mongoose validation errors
        const messages = Object.values(error.errors).map(val => val.message);
        const errorMessage = `Validation Error: ${messages.join('. ')}`;
        return next(new ErrorHandler(400, errorMessage));
    }
    console.error("Error in createNewOrder controller:", error);
    return next(new ErrorHandler(500, `Failed to place order: ${error.message || "An unexpected error occurred."}`));
  }
};