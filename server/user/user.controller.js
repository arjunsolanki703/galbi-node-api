const User = require("./user.model");
const Host = require("../host/host.model");
const Country = require("../country/country.model");
const VIPPlan = require("../VIP plan/VIPplan.model");
const Setting = require("../setting/setting.model");
const Image = require("../image/image.model");
const Follower = require("../follower/follower.model");
const Notification = require("../notification/notification.model");
const { serverPath } = require("../../util/serverPath");
const fs = require("fs");
const dayjs = require("dayjs");
const Contest = require("./../contest/contest.model");
const Coin = require("./../contest/coin.model");
const GiftPrize = require("./../giftprize/giftprize.model");
const History = require("./../history/history.model");
//FCM
var FCM = require("fcm-node");
var { serverKey } = require("../../util/serverPath");
var fcm = new FCM(serverKey);

exports.index = async (req, res) => {
  try {
    const user = await User.find().sort({ createdAt: -1 });
    if (!user) {
      throw new Error();
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    if (!req.body.username)
      return res
        .status(200)
        .json({ status: false, message: "Oops! username is required." });
    if (!req.body.user_id)
      return res
        .status(200)
        .json({ status: false, message: "Oops! user id is required." });

    User.findOne({ username: req.body.username }).exec((error, user) => {
      if (error)
        return res
          .status(500)
          .json({ status: false, message: "Internal server error" });
      else {
        if (user && user._id.toString() !== req.body.user_id) {
          return res
            .status(200)
            .json({ status: false, message: "Username already taken!" });
        } else
          return res.status(200).json({
            status: true,
            message: "Username generated successfully!",
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

exports.store = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details." });
    if (!req.body.name)
      return res
        .status(200)
        .json({ status: false, message: "name is required." });
    if (!req.body.image)
      return res
        .status(200)
        .json({ status: false, message: "image is required." });
    if (!req.body.username)
      return res
        .status(200)
        .json({ status: false, message: "username is required." });
    if (!req.body.fcmtoken)
      return res
        .status(200)
        .json({ status: false, message: "fcm token is required." });
    if (!req.body.identity)
      return res
        .status(200)
        .json({ status: false, message: "identity is required." });

    if (!req.body.device_type)
      return res
        .status(200)
        .json({ status: false, message: "Devicetype is Require." });
    // if (!req.body.country)
    //   return res
    //     .status(200)
    //     .json({ status: false, message: "country is required." });

    const user = await User.findOne({ identity: req.body.identity });

    if (user && user._id) {
      user.isLogout = false;
      user.fcm_token = req.body.fcmtoken;
      await user.save();
      const SetttingFollower = await Setting.find().sort({ createdAt: -1 });
      const setting1 = await User.findById(user._id)

      if (setting1.followers_count >= SetttingFollower[0].followerslimit) {
        console.log("Ashish")
        const host = new Host();
        host.host_id = setting1._id;
        host.isAccepted = true
        await host.save();
        //   // console.log(setting1)
        // //   const isHostExist = await Host.findOne({ host_id: req.body.user_id });
        // // if (isHostExist) {
        // //   return res.status(200).json({ status: true, message: "Success" });
        // // }
      }


      return res.status(200).json({ status: true, message: "success", user });
    } else {
     
      const setting = await Setting.find().sort({ createdAt: -1 });

      const user = new User();

      user.name = req.body.name;
      user.image = req.body.image;
      user.username = req.body.username;
      user.identity = req.body.identity;
      user.fcm_token = req.body.fcmtoken;
      user.country = !req.body.country ? "India" : req.body.country;
      user.coin = setting[0].loginBonus;
      user.rate = setting[0].streamingMinValue;

      user.five_minutes_rank = "100";
      user.one_hour_rank = "500";
      user.one_day_rank = "20";
      user.one_month_rank = "10";

      if (req.body.device_type == "") {
        user.device_type = "android";
      } else {
        user.device_type = req.body.device_type;
      }
      await user.save();



      return res.status(200).json({ status: true, message: "success", user });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.query.user_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }

    let rank_details = [];
    const contests = await Contest.find({}, { name: 1, challenge_type: 1 });
    if (!contests || !contests.length) {
      return res.status(200).json({ status: false, message: "Contest not found" });
    }

    await Promise.all(
      await contests.map(async (contest) => {

        let coins = await Coin.aggregate([
          {
            $match: {
              "contestId": contest._id
            }
          },
          {
            $group: {
              _id: "$userId",
              totalCoin: { $sum: '$coin' }
            }
          },
          {
            $sort: { totalCoin: -1 }
          }
        ])

        // console.log("coins : ", coins);


        await Promise.all(
          await coins.map(async (coin, index) => {
            console.log(user._id + " == " + coin._id);
            if ((user._id).toString() == (coin._id).toString()) {
              rank_details.push({
                challenge_type: contest.challenge_type,
                userrank: index + 1,
              })
            }
            return coin;
          })
        )
        return contest;
      })
    )

    if (user.plan_id) {
      const user_ = await checkPlan(user._id, user.plan_id);
      return res
        .status(200)
        .json({ status: true, message: "success", user: user_, rank_details });
    } else {
      return res.status(200).json({ status: true, message: "success", user, rank_details });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    if (req.file) {
      if (fs.existsSync(user.image)) {
        fs.unlinkSync(user.image);
      }
      user.image = serverPath + req.file.path;
    }

    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.username) {
      user.username = req.body.username;
    }
    if (req.body.bio) {
      user.bio = req.body.bio;
    }
    if (req.body.rate) {
      user.rate = req.body.rate;
    }

    await user.save();

    return res.status(200).json({ status: true, message: "success", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || "server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.query.user_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    user.isLogout = true;

    await user.save();

    return res.status(200).json({ status: true, message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || "server error" });
  }
};

exports.blockUnblockUser = async (req, res) => {

  try {
    console.log("blockUnblockUser : ", req.params.user_id);
    const user = await User.findById(req.params.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    user.block = !user.block;
    await user.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: user });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.liveUser = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    await Image.deleteMany({ user_id: req.body.user_id });

    const country = await Country.findOne({
      name: req.body.country.toUpperCase(),
    });

    const image = new Image();

    if (!country) {
      const country = new Country();
      country.name = req.body.country.toUpperCase();
      await country.save();
      image.country = country._id;
    } else {
      image.country = country._id;
    }
    image.type = "real";
    image.name = user.name;
    image.image = user.image ? user.image : " ";
    image.coin = user.coin;
    image.user_id = req.body.user_id;
    image.rate = user.rate;
    image.token = req.body.token;
    image.channel = req.body.channel;

    await image.save();

    //send message to followers of live user
    const followers = await Follower.find({
      to_user_id: req.body.user_id,
    }).populate("to_user_id from_user_id");

    const image_ = await Image.findOne({ user_id: req.body.user_id });

    followers.map(async (data) => {
      const notification = new Notification();

      notification.title = `${data.to_user_id.name} is live`;
      notification.description = data.to_user_id.username;
      notification.type = "live";
      notification.image = data.to_user_id.image;
      notification.user_id = data.from_user_id._id;

      await notification.save();

      if (
        data.from_user_id.isLogout === false &&
        data.from_user_id.block === false
      ) {
        const payload = {
          to: data.from_user_id.fcm_token,
          notification: {
            body: `${data.to_user_id.name} is Live Now`,
          },
          data: {
            image: image_.image,
            host_id: image_.user_id.toString(),
            name: image_.name,
            country_id: image_.country.toString(),
            type: image_.type,
            coin: image_.coin.toString(),
            token: image_.token,
            channel: image_.channel,
            view: "0",
            notificationType: "live",
          },
        };

        await fcm.send(payload, function (err, response) {
          if (err) {
            console.log("Something has gone wrong!");
          } else {
            console.log("Successfully sent with response: ", response);
          }
        });
      }
    });
    return res.status(200).json({ status: true, message: "success" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.destroyLiveUser = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);

    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    const country = await Country.findOne({ name: user.country.toUpperCase() });

    if (country) {
      const image = await Image.find({ country: country._id }).countDocuments();

      if (image === 0) {
        const country_ = await Country.findById(country._id);
        if (country_) {
          country_.deleteOne();
          console.log("country delete");
        }
      }
    }

    await Image.deleteMany({ user_id: req.body.user_id })
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });

    return res.status(200).json({ status: true, message: "success" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.lessCoin = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details." });

    if (!req.body.user_id)
      return res
        .status(200)
        .json({ status: false, message: "user id is required!" });
    if (!req.body.coin)
      return res
        .status(200)
        .json({ status: false, message: "coin is required!" });

    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    if (user.coin <= 0 || user.coin < req.body.coin) {
      return res
        .status(200)
        .json({ status: false, message: "You have not enough coin!" });
    }

    user.coin = user.coin - parseInt(req.body.coin);

    await user.save();

    return res.status(200).json({ status: true, message: "success", user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.addCoin = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details." });

    if (!req.body.user_id)
      return res
        .status(200)
        .json({ status: false, message: "user id is required!" });
    if (!req.body.coin)
      return res
        .status(200)
        .json({ status: false, message: "coin is required!" });

    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "user not found" });
    }

    user.coin = user.coin + parseInt(req.body.coin);

    await user.save();
    const newHistory = new History({
      to_user_id: req.body.user_id,
      coin: parseInt(req.body.coin),
      type: "buy",

    });
    await newHistory.save()
    return res.status(200).json({ status: true, message: "success", user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.dailyTask = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details" });
    if (!req.body.coin)
      return res
        .status(200)
        .json({ status: false, message: "coin is required" });
    if (!req.body.user_id)
      return res
        .status(200)
        .json({ status: false, message: "user id is required" });

    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }
    if (user.dailyTaskFinishedCount === 10) {
      user.dailyTaskFinishedCount = 0;
      await user.save();
    }
    const date =
      new Date().getDate() +
      "-" +
      new Date().getMonth() +
      "-" +
      new Date().getFullYear();

    if (user.dailyTaskDate) {
      if (user.dailyTaskDate === date) {
        return res
          .status(200)
          .json({ status: false, message: "Please try again after 24 hours" });
      } else {
        user.coin = user.coin + parseInt(req.body.coin);
        user.dailyTaskDate =
          new Date().getDate() +
          "-" +
          new Date().getMonth() +
          "-" +
          new Date().getFullYear();
        user.dailyTaskFinishedCount = user.dailyTaskFinishedCount + 1;
        await user.save();

        if (user.dailyTaskFinishedCount === 10) {
          user.dailyTaskFinishedCount = 0;
          await user.save();
        }
      }
    } else {
      user.coin = user.coin + parseInt(req.body.coin);
      user.dailyTaskDate =
        new Date().getDate() +
        "-" +
        new Date().getMonth() +
        "-" +
        new Date().getFullYear();
      user.dailyTaskFinishedCount = user.dailyTaskFinishedCount + 1;
      await user.save();

      if (user.dailyTaskFinishedCount === 10) {
        user.dailyTaskFinishedCount = 0;
        await user.save();
      }
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "server error",
    });
  }
};

exports.checkDailyTask = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details" });

    if (!req.body.user_id)
      return res
        .status(200)
        .json({ status: false, message: "user id is required" });

    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({
      status: true,
      message: "success",
      number: user.dailyTaskFinishedCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "server error",
    });
  }
};

exports.search = async (req, res) => {
  try {
    var response = [];
    const start = req.query.start ? parseInt(req.query.start) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    if (req.query.name && req.query.user_id) {
      const followers = await Follower.find({
        from_user_id: req.query.user_id,
      });
      response = await User.find({
        name: { $regex: req.query.name, $options: "i" },
      })
        .skip(start)
        .limit(limit);

      const list = [];

      // console.log(followers.length);

      response.map((res) => {
        list.push({
          _id: res._id,
          bio: res.bio,
          rate: res.rate,
          country: res.country,
          image: res.image,
          username: res.username,
          identity: res.identity,
          name: res.name,
          coin: res.coin,
          followers_count: res.followers_count,
          following_count: res.following_count,
          fcm_token: res.fcm_token,
          dailyTaskFinishedCount: res.dailyTaskFinishedCount,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
          __v: res.__v,
          isFollowing: false,
        });
      });

      for (var i = 0; i < list.length; i++) {
        await followers.map((follower) => {
          if (follower.to_user_id.toString() == list[i]._id.toString()) {
            list[i].isFollowing = true;
          }
        });
      }
      // const result = list.reduce((unique, o) => {
      //   if (!unique.some((obj) => obj._id === o._id)) {
      //     unique.push(o);
      //   }
      //   return unique;
      // }, []);

      return res.status(200).send({
        status: true,
        message: "success",
        data: list,
        // total: total,
      });
    }
    // return res
    //   .status(200)
    //   .json({ status: true, message: "success", data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
//get all block user

exports.GetallBlockUser = async (req, res) => {
  try {
    const user = await User.find({ block: { $eq: true } })
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "Block User does not exist!!" });
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};



//add VIP plan
exports.addPlan = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exist!!" });
    }

    const plan = await VIPPlan.findById(req.body.plan_id);
    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "Plan does not exist!!" });
    }

    user.plan_id = req.body.plan_id;
    user.plan_start_date = new Date().toISOString().slice(0, 10);
    user.isVIP = true;
    await user.save();

    return res.status(200).json({ status: true, message: "success", user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//check user plan is expired or not
const checkPlan = async (userId, planId, res) => {
  try {
    let now = dayjs();
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exist!!" });
    }

    const plan = await VIPPlan.findById(planId);
    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "Plan does not exist!!" });
    }

    const day = plan.time.includes("day");
    const month = plan.time.includes("month");
    const year = plan.time.includes("year");

    if (day) {
      const time = plan.time.split(" ")[0];
      const diffDate = now.diff(user.plan_start_date, "day");
      if (diffDate > time) {
        user.isVIP = false;
      }
    }

    if (user.plan_start_date !== null) {
      if (day) {
        const time = plan.time.split(" ")[0];
        const diffDate = now.diff(user.plan_start_date, "day");
        if (diffDate > time) {
          user.isVIP = false;
        }
      }
      if (month) {
        const time = plan.time.split(" ")[0];
        const diffDate = now.diff(user.plan_start_date, "day");
        if (diffDate > 28 * time) {
          user.isVIP = false;
        }
      }
      if (year) {
        const time = plan.time.split(" ")[0];
        const diffDate = now.diff(user.plan_start_date, "day");
        if (diffDate > 365 * time) {
          user.isVIP = false;
        }
      }
    }

    await user.save();
    return user;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error });
  }
};


