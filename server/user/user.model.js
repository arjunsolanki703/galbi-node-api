const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    username: String,
    identity: String,
    imgurl: { type: String, default: null },
    bio: { type: String, default: null },
    coin: { type: Number, default: 0 },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    fcm_token: String,
    block: { type: Boolean, default: false },
    country: String,
    dailyTaskDate: { type: String },
    dailyTaskFinishedCount: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    isLogout: { type: Boolean, default: false },
    isVIP: { type: Boolean, default: false },
    plan_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    plan_start_date: { type: String, default: null },
    thumbImage: String,
    isOnline: { type: Boolean, default: false },
    isLive: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },
    isHost: { type: Boolean, default: true },
    token: { type: String, default: null },
    channel: { type: String, default: null },
    hostCountry: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    device_type:{type: String, default: "android"},
    five_minutes_rank:{type: String, default: ""},
    one_hour_rank : {type: String, default: ""},
    one_day_rank : {type: String, default: ""},
    one_month_rank :{type: String, default: ""},
    challenge_type:{type: String, default: ""},
    is_timer:{type:Boolean,default:false},
    end_timer:{type:String,default:null},
    is_internal_user:{type:Boolean,default:false}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
