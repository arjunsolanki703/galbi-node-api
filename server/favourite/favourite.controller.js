const User = require("../user/user.model");
const Follower = require("../follower/follower.model");
const LiveView = require("../liveView/liveView.model");
const Image = require("../image/image.model");
const { Mongoose } = require("mongoose");

exports.favourite = async (req, res) => {
  try {
    const user = User.findById(req.query.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    Follower.find({ from_user_id: req.query.user_id }, { to_user_id: 1 })
      .populate("to_user_id")
      .exec(async (err, followers) => {
        if (err)
          return res
            .status(500)
            .send({ status: false, message: "Internal server error" });
        else {
          const user = await User.find({ isOnline: true }).populate(
            "hostCountry"
          );

          const list = [];
          followers.map(async (data) => {
            await user.map(async (user) => {
              if (user._id) {
                if (data.to_user_id._id.toString() === user._id.toString())
                  list.push({
                    image: user.thumbImage,
                    host_id: user._id,
                    name: user.name,
                    country_id: user.hostCountry ? user.hostCountry._id : "",
                    country_name: user.hostCountry ? user.hostCountry.name : "",
                    isBusy: user.isBusy,
                    coin: user.coin,
                    token: user.token,
                    channel: user.channel,
                    view: 0,
                  });
              }
            });
          });
          return res.status(200).send({
            status: true,
            message: "favorite list successful",
            data: list,
          });
        }
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
