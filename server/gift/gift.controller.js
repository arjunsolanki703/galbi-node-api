const Gift = require("./gift.model");
const FifteenMin = require("../host/fifteen_min_contest.model");
const coin = require("../contest/coin.model");
const User = require("../user/user.model");
const fs = require("fs");
const { deleteVideo, deleteFile } = require("../../util/deleteFile");
const mongoose = require("mongoose");


exports.index = async (req, res) => {
  try {
    const gift = await Gift.find().populate("category").sort({ createdAt: -1 });

    if (!gift) {
      return res.status(200).json({ status: false, message: "gift not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: gift });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.show = async (req, res) => {
  try {
    const gift = await Gift.find().sort({ createdAt: -1 });

    if (!gift) {
      return res.status(200).json({ status: false, message: "Gift not found" });
    }

    const data = gift.map((data) => ({
      gift: data.icon,
    }));

    return res.status(200).json({ status: true, message: "success", data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.categoryWiseGift = async (req, res) => {
  try {
    const gift = await Gift.find({ category: req.query.category }).sort({
      createdAt: -1,
    });
    if (!gift) {
      return res.status(200).json({ status: false, message: "gift not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "Success", data: gift });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.store = async (req, res) => {
  console.log(" store : ",req.body);
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "invalid details" });
    if (!req.body.coin)
      return res
        .status(200)
        .json({ status: false, message: "coin is required!" });
    if (!req.body.category)
      return res
        .status(200)
        .json({ status: false, message: "category is required!" });

    if (!req.files)
      return res
        .status(200)
        .json({ status: false, message: "please select an image." });
    
    if (!req.body.name)
      return res
        .status(200)
        .json({ status: false, message: "please select an name." });

    const Gifts = req.files.map((gift) => ({
      icon: gift.path,
      coin: req.body.coin,
      category: req.body.category,
      name: req.body.name,
    }));

    const gift = await Gift.insertMany(Gifts);

    let data = [];

    for (let i = 0; i < gift.length; i++) {
      data.push(await Gift.findById(gift[i]._id).populate("category"));
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: data });
  } catch (error) {
    console.log(error);
    deleteVideo(req.files);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.update = async (req, res) => {
 
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "invalid details" });
    if (!req.body.coin)
      return res
        .status(200)
        .json({ status: false, message: "coin is required!" });
    if (!req.body.category)
      return res
        .status(200)
        .json({ status: false, message: "category is required!" });
    
    if (!req.body.name)
      return res
        .status(200)
        .json({ status: false, message: "name is required!" });

    const gift = await Gift.findById(req.params.gift_id);

    if (!gift) {
      return res.status(200).json({ status: false, message: "gift not found" });
    }

    if (req.file) {
      if (fs.existsSync(gift.icon)) {
        fs.unlinkSync(gift.icon);
      }
      gift.icon = req.file.path;
    }

    gift.coin = req.body.coin;
    gift.category = req.body.category;
    gift.name = req.body.name;

    await gift.save();

    const data = await Gift.findById(gift._id).populate("category");

    return res
      .status(200)
      .json({ status: true, message: "update", data: data });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.destroy = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.gift_id);

    if (!gift) {
      return res.status(200).json({ status: false, message: "gift not found" });
    }

    if (fs.existsSync(gift.icon)) {
      fs.unlinkSync(gift.icon);
    }
    await gift.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: "delete", result: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.destroyAll = async (req, res) => {
  try {
    const deleteIds = req.params.gift_id.trim().split(",");

    const gift = await Gift.find();

    deleteIds.map((id) => {
      gift.map(async (gift) => {
        if (gift._id == id) {
          if (fs.existsSync(gift.icon)) {
            return fs.unlinkSync(gift.icon);
          }
          await gift.deleteOne();
        }
      });
    });

    return res
      .status(200)
      .json({ status: true, message: "delete", result: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.giftSender = async (req, res) => {
  try {
    const contestId = req.body.contest_id;

    const FifteenMinData = await FifteenMin.findById(contestId);

    const userId = FifteenMinData.user_id;
    const hostId = FifteenMinData.host_id;
    const coinData = await coin.findOne({
      contestId: mongoose.Types.ObjectId(contestId),
      userId: userId
    });

    const FifteenMinDataHost = await FifteenMin.findById(contestId);
    const coinDataHost = await coin.findOne({
      contestId: mongoose.Types.ObjectId(contestId),
      hostId: hostId
    });
    const usersData = await User.find({_id: userId});


    const usersArray = [];
    const usrData = [];
    let totalCoin = coinData.coin;
    usersData.forEach(async (ele) => {
      usrData.push({
        _id: coinData._id,
        user_id: ele._id,
        username: ele.username,
        image: ele.image,
        coin: totalCoin
      })
    });
    usersArray.push({
      'userId': coinData.userId,
      "total_coin": totalCoin,
      "coin_history": usrData,
    });

    const usersArrayHost = [];
    const usrDataHost = [];
    let totalCoinHost = coinDataHost.coin;
    usersData.forEach(async (ele) => {
      usrDataHost.push({
        _id: coinDataHost._id,
        user_id: coinDataHost.userId,
        username: ele.username,
        image: ele.image,
        coin: totalCoinHost,
    })
    });
    usersArrayHost.push({
      'userId': coinDataHost.userId,
      "total_coin": totalCoinHost,
      "coin_history": usrDataHost,
    });

    let finalData = usersArray.concat(usersArrayHost);
    return res
      .status(200)
      .json({ status: true, message: "success", result: finalData });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
