const mongoose = require("mongoose");

const LiveViewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    image: String,
    token: String,
    challenge_type:String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LiveView", LiveViewSchema);
