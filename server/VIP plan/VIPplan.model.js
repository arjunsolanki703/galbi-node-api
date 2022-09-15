const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    time: String,
    price: Number,
    paymentGateway: String,
    productId: String,
    isActive: { type: Boolean, default: true },
    discount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VIPPlan", planSchema);
