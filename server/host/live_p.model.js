const mongoose = require("mongoose");

const live_pSchema = new mongoose.Schema(
  {
    challenge_type:{type:String,default:null},
    user_id:{type:String,default:null},
    startTime: { type: Number, default: 0 },
    endTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("live_p", live_pSchema);
