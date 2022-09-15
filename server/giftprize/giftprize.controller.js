const User = require("./giftprize.model");
const fs = require("fs");
const Coin = require("./../contest/coin.model");
const { deleteVideo, deleteFile } = require("../../util/deleteFile");
const Contest = require("./../contest/contest.model")
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

exports.getprize = async (req, res) => {
  try {
    if (req.query.challenge_type) {
      // const gift = await User.find()
      const filter = await User.find({ challenge_type: req.query.challenge_type });
      const contests = await Contest.find({ challenge_type: req.query.challenge_type });
      // const contests = await Contest.find({ challenge_type: "1_hour"  });
      // if (!contests || !contests.length) {
      //   return res.status(200).json({ status: false, message: "Contest not found" });
      // }
      // console.log(contests)
      // let totalCoins = await Coin.aggregate([
      //   {
      //      $match: { "challenge_type": req.query.challenge_type }
      //     $match: {
      //       "contestId": contest._id
      //     }
      //   },
      //   {
      //     $group: {
      //        _id: "$contestId",
      //       totalCoin: { $sum: '$coin' },
      //     }
      //   }
      // ])

      let totalCoins = [];
      if (contests && contests.length) {
        totalCoins = await Coin.aggregate([
          {
            $match: {
              "contestId": contests[0]._id
            }
          },
          {
            $group: {
              _id: "$contestId",
              totalCoin: { $sum: '$coin' }
            }
          }

        ])
      }

      return res.status(200).json({
        status: true,
        data: filter,
        total_coins: totalCoins && totalCoins.length ? totalCoins[0].totalCoin : 0
      });

    } else {
      return res
        .status(500)
        .json({ status: false, error: "challenge_type required." });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
exports.GetGiftPrize = async (req, res) => {
  try {

    // const giftprize = await User.find().populate("challenge_type").sort({ createdAt: -1 });
    const giftprize = await User.find().sort({ createdAt: -1 });
    if (!giftprize) {
      return res.status(200).json({ status: false, message: "gift Prize not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "success", data: giftprize });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.GiftPrizeStore = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "invalid details" });
    if (!req.body.rank)
      return res
        .status(200)
        .json({ status: false, message: "rank is required!" });
    if (!req.body.challenge_type)
      return res
        .status(200)
        .json({ status: false, message: "challenge type is required!" });

    if (!req.files)
      return res
        .status(200)
        .json({ status: false, message: "please select an image." });

    if (!req.body.amount)
      return res
        .status(200)
        .json({ status: false, message: "amount is required!" });

    if (!req.body.prize_name)
      return res
        .status(200)
        .json({ status: false, message: "prize name is required!" });


    const giftprize = new User();

    const image = req.files ? req.files[0] : "";
    giftprize.image_url = image.path;
    giftprize.rank = req.body.rank;
    giftprize.prize_name = req.body.prize_name;
    giftprize.challenge_type = req.body.challenge_type;
    giftprize.amount = req.body.amount;

    await giftprize.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: giftprize });
  } catch (error) {
    console.log(error);
    deleteVideo(req.files);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
exports.GiftPrizeUpdate = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "invalid details" });
    if (!req.body.rank)
      return res
        .status(200)
        .json({ status: false, message: "rank is required!" });
    if (!req.body.challenge_type)
      return res
        .status(200)
        .json({ status: false, message: "challenge type is required!" });

    // if (!req.files)
    //   return res
    //     .status(200)
    //     .json({ status: false, message: "please select an image." });

    if (!req.body.amount)
      return res
        .status(200)
        .json({ status: false, message: "amount is required!" });

    if (!req.body.prize_name)
      return res
        .status(200)
        .json({ status: false, message: "prize name is required!" });

    const giftprize = await User.findById(req.params.giftprize_id);

    if (!giftprize) {
      return res.status(200).json({ status: false, message: "gift prize not found" });
    }

    if (req.file) {
      if (fs.existsSync(giftprize.image_url)) {
        fs.unlinkSync(giftprize.image_url);
      }
      giftprize.image_url = req.file.path;
    }

    giftprize.amount = req.body.amount;
    giftprize.challenge_type = req.body.challenge_type;
    giftprize.prize_name = req.body.prize_name;
    giftprize.rank = req.body.rank;

    await giftprize.save();

    return res
      .status(200)
      .json({ status: true, message: "update", data: giftprize });
  } catch (error) {
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.destroy = async (req, res) => {
  try {
    const gift = await User.findById(req.params.gift_id);

    if (!gift) {
      return res.status(200).json({ status: false, message: "gift prize not found" });
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

    const gift = await User.find();

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
exports.Addprize = async (req, res) => {
  try {
    console.log(req)

    return res.status(200).json({
      status: true,
      message: "Username generated successfully!",
    });

  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
exports.FilterGiftprize = async (req, res) => {
  try {
    if (req.body.challenge_type) {
      const filter = await User.find({ challenge_type: req.body.challenge_type });
      // console.log(filter)
      return res.status(200).json({
        status: true,
        message: "Sucess",
        data: filter
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Challange Type Is Require",
      });
    }



  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }

};

exports.getranker = async (req, res) => {
  try {
    const data1 = [{
      name: "TestContent1",
      challenge_type: "5_min",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{
        "user_id": "123",
        "username": "test1",
        "userrank": "3",
        "image_url": "https://picsum.photos/200/300"
      },
      {
        "user_id": "1231",
        "username": "test2",
        "userrank": "2",
        "image_url": "https://picsum.photos/200/300"
      },

      {
        "user_id": "1234",
        "username": "test3",
        "userrank": "1",
        "image_url": "https://picsum.photos/200/300"
      }
      ]
    },
    {
      name: "TestContent1",
      challenge_type: "1_Hour",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{
        "user_id": "1238",
        "username": "test1",
        "userrank": "3",
        "image_url": "https://picsum.photos/200/300"
      },
      {
        "user_id": "1239",
        "username": "test2",
        "userrank": "2",
        "image_url": "https://picsum.photos/200/300"
      },

      {
        "user_id": "1237",
        "username": "test3",
        "userrank": "1",
        "image_url": "https://picsum.photos/200/300"
      }
      ]
    },
    {
      name: "TestContent1",
      challenge_type: "1_Day",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{
        "user_id": "1245",
        "username": "test1",
        "userrank": "3",
        "image_url": "https://picsum.photos/200/300"
      },
      {
        "user_id": "1222",
        "username": "test2",
        "userrank": "2",
        "image_url": "https://picsum.photos/200/300"
      },

      {
        "user_id": "121322",
        "username": "test3",
        "userrank": "1",
        "image_url": "https://picsum.photos/200/300"
      }
      ]
    },
    {
      name: "TestContent1",
      challenge_type: "1_Month",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{
        "user_id": "12323213",
        "image_url": "https://picsum.photos/200/300",
        "username": "test1",
        "userrank": "3"
      },
      {
        "image_url": "https://picsum.photos/200/300",
        "user_id": "124432",
        "username": "test2",
        "userrank": "2"
      },

      {
        "image_url": "https://picsum.photos/200/300",
        "user_id": "1266565",
        "username": "test3",
        "userrank": "1"
      }
      ]
    },

    ]
    const data2 = [
      {
        name: "TestContent1",
        contest_type: "1_hour",
        current_user_rank: 12,
        max_coints: 200000,
        total_coins: 12000,
        id: "60f7ff031c7515213f4b9607",
        "toper": [{

          "username": "test1",
          "userrank": "3"
        },
        {

          "username": "test2",
          "userrank": "2"
        },

        {
          "username": "test3",
          "userrank": "1"
        }
        ]
      },
      {
        name: "TestContent1",
        contest_type: "1_hour",
        current_user_rank: "12",
        max_coints: 200000,
        total_coins: "12000",
        id: "60f7ff031c7515213f4b9607",
        "toper": [{

          "username": "test1",
          "userrank": "3"
        },
        {

          "username": "test2",
          "userrank": "2"
        },

        {
          "username": "test3",
          "userrank": "1"
        }
        ]
      },
      {
        name: "Test Content1",
        contest_type: "1_hour",
        current_user_rank: "12",
        max_coints: 200000,
        total_coins: 12000,
        id: "60f7ff031c7515213f4b9607",
        "toper": [{

          "username": "test1",
          "userrank": "3"
        },
        {

          "username": "test2",
          "userrank": "2"
        },

        {
          "username": "test3",
          "userrank": "1"
        },

        ]

      }]
    const data3 = [{
      name: "TestContent1",
      contest_type: "1_day",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      }
      ]
    },
    {
      name: "TestContent1",
      contest_type: "1_day",
      current_user_rank: "12",
      max_coints: 200000,
      total_coins: "12000",
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      }
      ]
    },
    {
      name: "Test Content1",
      contest_type: "1_day",
      current_user_rank: "12",
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      },

      ]

    }]
    const data4 = [{
      name: "TestContent1",
      contest_type: "1_month",
      current_user_rank: 12,
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      }
      ]
    },
    {
      name: "TestContent1",
      contest_type: "1_month",
      current_user_rank: "12",
      max_coints: 200000,
      total_coins: "12000",
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      }
      ]
    },
    {
      name: "Test Content1",
      contest_type: "1_month",
      current_user_rank: "12",
      max_coints: 200000,
      total_coins: 12000,
      id: "60f7ff031c7515213f4b9607",
      "toper": [{

        "username": "test1",
        "userrank": "3"
      },
      {

        "username": "test2",
        "userrank": "2"
      },

      {
        "username": "test3",
        "userrank": "1"
      },

      ]

    }]
    return res
      .status(200)
      .json({ status: true, message: "success", data: data1 });

  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};