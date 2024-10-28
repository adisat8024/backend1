const mongoose = require("mongoose");
const productsses = require("./ProductSchema");

const OrderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "productsses",
      },
    ],
    payment: {},
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
  },
    { timestamps: true }
, {
    collection:"orders"
});

module.exports = mongoose.model("orders",OrderSchema);
