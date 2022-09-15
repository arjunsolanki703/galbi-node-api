const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    challenge_type: { type: String, default: "" },
    contestTime: { type: Number, default: 0 },
    prize: { type: String, default: "" },
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
    type: { type: String, default: "" },
}, {
    timestamps: true,
});

module.exports = mongoose.model("contest", contestSchema);