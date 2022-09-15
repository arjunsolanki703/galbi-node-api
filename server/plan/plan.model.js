//purchase plan

const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    coin: Number,
    rupee: Number,
    // currency: String,
    productId: String,
    paymentGateway: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("plan", planSchema);
