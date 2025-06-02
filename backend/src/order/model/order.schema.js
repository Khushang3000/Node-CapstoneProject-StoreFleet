import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "IN",
    },
    pincode: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
  },
  orderedItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  paymentInfo: {
    id: { // This would typically be a transaction ID from a payment gateway
      type: String,
      required: true,
    },
    status: { // This should ideally represent the payment status, e.g., "succeeded", "pending", "failed"
      type: Boolean, // Boolean might be too simplistic; consider String. 'true' could mean paid.
      default: false,
      required: true,
    },
  },
  paidAt: { // The timestamp when the payment was made
    type: Date,
    required: true,
  },
  itemsPrice: { // Total price of items before tax and shipping
    type: Number,
    default: 0,
    required: true,
  },
  taxPrice: {
    type: Number,
    default: 0,
    required: true,
  },
  shippingPrice: {
    type: Number,
    default: 0,
    required: true,
  },
  totalPrice: { // Grand total (itemsPrice + taxPrice + shippingPrice)
    type: Number,
    default: 0,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
    default: "Processing", // Initial status
    enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Payment Pending"], // Example statuses
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;