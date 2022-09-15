const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contestWinnerSchema = new Schema({
    contestId: { type: Schema.Types.ObjectId, default: null },
    challenge_type: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, default: null },
    giftPrizeId: { type: Schema.Types.ObjectId, default: null },
    totalCoin: { type: Number, default: 0 },
    prize: { type: String, default: "" }
}, {
    timestamps: true,
});

module.exports = mongoose.model("contest_winner", contestWinnerSchema);