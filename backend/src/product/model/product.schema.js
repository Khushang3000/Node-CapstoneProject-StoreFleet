import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
    },
    name: { 
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,   
        max: 5,   
    },
    comment: {
        type: String,
        trim: true,
    },
    createdAt: { 
        type: Date,
        default: Date.now,
    }
});

const productSchema = new mongoose.Schema( 
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      index: true, 
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      minLength: [
        10,
        "Product description should be at least 10 characters long.",
      ],
    },
    price: {
      type: Number,
      required: [true, "Product price is required."],
      min: [0, "Price cannot be negative."], 
    },
    rating: { 
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    images: [
      {
        public_id: { 
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    category: {
      type: String,
      required: [true, "Product category is required."],
      enum: { 
        values: [
            "Mobile", "Electronics", "Clothing", "Home & Garden", "Automotive",
            "Health & Beauty", "Sports & Outdoors", "Toys & Games", "Books & Media",
            "Jewelry", "Food & Grocery", "Furniture", "Shoes", "Pet Supplies",
            "Office Supplies", "Baby & Kids", "Art & Collectibles", "Travel & Luggage",
            "Music Instruments", "Electrical Appliances", "Handmade Crafts"
        ],
        message: '{VALUE} is not a supported category.'
      },
      index: true, 
    },
    stock: {
      type: Number,
      required: [true, "Product stock is mandatory."],
      min: [0, "Stock cannot be negative."], 
      default: 1,
    },
    numberOfReviews: { 
        type: Number,
        default: 0,
    },
    reviews: [reviewSchema], 
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
  },
  { timestamps: true } 
);



const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;