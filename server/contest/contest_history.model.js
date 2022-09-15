const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contestHistorySchema = new Schema({
    name: { type: String, default: "" },
    contestId: { type: Schema.Types.ObjectId, default: null },
    challenge_type: { type: String, default: "" },
    contestTime: { type: Number, default: 0 },
    prize: { type: String, default: "" },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
}, {
    timestamps: true,
});

module.exports = mongoose.model("contest_history", contestHistorySchema);