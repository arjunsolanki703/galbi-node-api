const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    from_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
