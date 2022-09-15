const mongoose = require("mongoose");

const GiftPrizeSchema = new mongoose.Schema(
  {

    rank:{ type: String, default: null },
    image_url:{ type: String, default: null },
    prize_name:{ type: String, default: null },
    amount:{ type: Number, default: 0 },
    challenge_type: { type: String }    

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Giftprize", GiftPrizeSchema);
