const Image = require("../image/image.model");
const User = require("../user/user.model");
const LiveView = require("../liveView/liveView.model");
const shuffleArray = require("../../util/shuffle");
const { serverPath } = require("../../util/serverPath");
const ArraySort = require("array-sort");

//get thumb list of online host
exports.onlineHost = async (req, res) => {
  try {
    let host;
    const start = req.query.start ? parseInt(req.query.start) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    if (req.query.country === "GLOBAL") {
      host = await User.find({ isOnline: true })
        .sort({
          createdAt: 1,
        })
        .skip(start)
        .limit(limit)
        .populate("hostCountry");
    } else {
      host = await User.find({
        hostCountry: req.query.country,
        isOnline: true,
      })
        .sort({
          createdAt: 1,
        })
        .skip(start)
        .limit(limit)
        .populate("hostCountry");
    }

    let mainArr = [];

    for (var i = 0; i < host.length; i++) {
      let count = 0;
      if (
        host[i].isOnline === true &&
        host[i].token !== null &&
        host[i].channel !== null
      ) {
        count = await LiveView.aggregate([
          { $match: { user_id: host[i]._id } },
        ]);

        const obj_ = {
         
          hostonline :  host[i].isOnline,
          image: host[i].thumbImage,
          profile_image: host[i].image,
          host_id: host[i]._id,
          name: host[i].name,
          country_id: host[i].hostCountry ? host[i].hostCountry._id : "",
          country_name: host[i].hostCountry ? host[i].hostCountry.name : "",
          isBusy: host[i].isBusy,
          rate: host[i].rate,
          coin: host[i].coin,
          token: host[i].token,
          channel: host[i].channel,
          view: count.length,
        };
        mainArr.push(obj_);
      }
    }

    shuffleArray(mainArr);
    ArraySort(mainArr, "isBusy");

    return res.status(200).json({
      status: true,
      message: "success",
      data: mainArr,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//get thumb list of live host
exports.liveHost = async (req, res) => {
  try {
    let host;
    const start = req.query.start ? parseInt(req.query.start) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    if (req.query.country === "GLOBAL") {
      host = await User.find({ isLive: true })
        .sort({
          createdAt: 1,
        })
        .skip(start)
        .limit(limit)
        .populate("hostCountry");
    } else {
      host = await User.find({ hostCountry: req.query.country, isLive: true })
        .sort({
          createdAt: 1,
        })
        .skip(start)
        .limit(limit)
        .populate("hostCountry");
    }

    let mainArr = [];

    for (var i = 0; i < host.length; i++) {
      let count = 0;
      if (
        host[i].isLive === true &&
        host[i].token !== null &&
        host[i].channel !== null
      ) {
        count = await LiveView.aggregate([
          { $match: { user_id: host[i]._id } },
        ]);

        const obj_ = { 
          isLive : host[i].isLive,
          hostonline1 :  host[i].isOnline,
          image: host[i].thumbImage,
          profile_image: host[i].image,
          host_id: host[i]._id,
          name: host[i].name,
          country_id: host[i].hostCountry ? host[i].hostCountry._id : "",
          country_name: host[i].hostCountry ? host[i].hostCountry.name : "",
          isBusy: host[i].isBusy,
          rate: host[i].rate,
          coin: host[i].coin,
          token: host[i].token,
          channel: host[i].channel,
          view: count.length,
          challenge_type:host[i].challenge_type,
          is_timer:host[i].is_timer,
          end_timer:host[i].end_timer,
          is_internal_user:host[i].is_internal_user
        };
        mainArr.push(obj_);
      }
    }

    shuffleArray(mainArr);
    ArraySort(mainArr, "isLive");

    return res.status(200).json({
      status: true,
      message: "success",
      data: mainArr,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.isValidHost = async (req, res) => {
  try {
    const user = await User.findById(req.query.host_id);

    if (!user)
      return res.status(200).json({ status: false, message: "user not found" });

    if (user.isHost) {
      return res.status(200).json({ status: true, message: "Host is valid" });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Host is not valid" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//check host is busy or not
exports.isHostBusy = async (req, res) => {
  try {
    if (!req.query.host_id)
      return res
        .status(200)
        .json({ status: false, message: "Host id is required." });
    const host = await User.findById(req.query.host_id);
    if (!host) {
      return res.status(200).json({ status: false, message: "user not found" });
    }
    if (host.isBusy === true)
      return res
        .status(200)
        .json({ status: true, message: "This host is busy : true" });
    else
      return res
        .status(200)
        .json({ status: false, message: "This host is busy : false" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//check host is online or not
exports.isHostOnline = async (req, res) => {
  try {
    if (!req.query.host_id)
      return res
        .status(200)
        .json({ status: false, message: "Host id is required." });
    const host = await User.findById(req.query.host_id);
    if (!host) {
      return res.status(200).json({ status: false, message: "user not found" });
    }
    if (!host.isHost) {
      return res
        .status(200)
        .json({ status: false, message: "You are not host" });
    }
    if (host.isOnline === true)
      return res
        .status(200)
        .json({ status: true, message: "This host is online : true" });
    else
      return res
        .status(200)
        .json({ status: false, message: "This host is not online : false" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
