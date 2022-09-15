const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const coinSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, default: null },
    hostId: { type: Schema.Types.ObjectId, default: null },
    contestId: { type: Schema.Types.ObjectId, default: null },
    challenge_type: { type: String, default: "" },
    coin: { type: Number, default: 0 },
    coin_history: { type: Array, default: [] },
    title: { type: String, default: "" },
}, {
    timestamps: true,
});

module.exports = mongoose.model("coin", coinSchema);