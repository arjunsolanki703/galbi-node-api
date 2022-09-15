const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const advertisementSchema = new Schema(
  {
    native: String,
    reward: String,
    interstitial: String,
    type: String,
    show: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);
