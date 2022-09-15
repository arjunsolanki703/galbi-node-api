const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fifteenmincontestSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    challenge_type: { type: String, default: "" },
    contestTime: { type: Number, default: 0 },
    prize: { type: String, default: "" },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    type: { type: String, default: "" },
    user_id: { type: Schema.Types.ObjectId, default: null },
    host_id: { type: Schema.Types.ObjectId, default: null },
    winner_id: { type: Schema.Types.ObjectId, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model("fifteen_min_contest", fifteenmincontestSchema);