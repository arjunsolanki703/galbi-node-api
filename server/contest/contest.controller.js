const CronJob = require('cron').CronJob;
const Contest = require("./contest.model");
const Coin = require("./coin.model");
const User = require("./../user/user.model");
const fifteen_min_contest = require("./../host/fifteen_min_contest.model");
const History = require("./../history/history.model");
const ContestWinner = require("./contest_winner.model");
const GiftPrize = require("./../giftprize/giftprize.model");
const Setting = require("./../setting/setting.model");
const ContestHistory = require("./contest_history.model");
const mongoose = require("mongoose");

const completeConstant = async (contest, CoinLimitReached, userId, totalCoin, giftPrize) => {
    if (contest && contest._id) {
        await ContestHistory.deleteMany({ contestId: contest._id });
        const newContestHistory = new ContestHistory({
            contestId: contest._id,
            name: contest.name,
            challenge_type: contest.challenge_type,
            contestTime: contest.contestTime,
            prize: contest.prize,
            startTime: contest.startTime,
            endTime: contest.endTime
        });
        contestHistory = await ContestHistory.exists({ contestId: contest._id });
        if (!contestHistory) {
            await newContestHistory.save();
        }

        let currentDate = new Date(Date.now());
        await Contest.deleteMany({ challenge_type: contest.challenge_type });
        let setting = await Setting.exists({ "contestType.challenge_type": contest.challenge_type })
        if (setting) {
            let newContest = new Contest({
                name: contest.name,
                challenge_type: contest.challenge_type,
                contestTime: contest.contestTime,
                prize: contest.prize,
                startTime: currentDate.getTime(),
                endTime: currentDate.getTime() + Number(contest.contestTime)
            })
            contestDetail = await Contest.exists({ challenge_type: contest.challenge_type });
            if (!contestDetail) {
                await newContest.save();
            }
        }
        if (CoinLimitReached) {
            const newContestWinner = new ContestWinner({
                contestId: contest._id,
                challenge_type: contest.challenge_type,
                userId: userId,
                totalCoin: totalCoin,
                giftPrizeId: giftPrize._id,
                prize: giftPrize.prize_name,
                image: giftPrize.image_url
            })
            let contestWinner = await ContestWinner.exists({ contestId: contest._id });
            if (!contestWinner) {
                await newContestWinner.save();
            }
        } else {
            let coins = await Coin.aggregate([
                {
                    $match: { "contestId": contest._id }
                },
                {
                    $group: {
                        _id: "$userId",
                        totalCoin: { $sum: '$coin' },
                    }
                },
                {
                    $sort: { totalCoin: -1 }
                },
                {
                    $limit: 1 // winner Limit
                }
            ])
            if (coins && coins.length) {

                const newContestWinner = new ContestWinner({
                    challenge_type: contest.challenge_type,
                    contestId: contest._id,
                    userId: coins[0]._id,
                    totalCoin: coins[0].totalCoin
                })

                let giftPrize = await GiftPrize.findOne({
                    amount: { $lte: coins[0].totalCoin } , challenge_type: contest.challenge_type
                }, { _id: 1, prize_name: 1 })
                if (giftPrize && giftPrize._id) {
                    newContestWinner.giftPrizeId = giftPrize._id;
                    newContestWinner.prize = giftPrize.prize_name;
                }

                let contestWinner = await ContestWinner.exists({ contestId: contest._id });
                if (!contestWinner) {
                    await newContestWinner.save();
                }
            }
        }
    }
}

// let cronLoop = new CronJob('*/300 * * * * *', async () => {
let cronLoop = new CronJob('*/30 * * * * *', async () => {
    let currentTime = (new Date(Date.now())).getTime();
    let contests = await Contest.find({ endTime: { $lt: currentTime } });
    Promise.all(contests.map(async (contest) => {
        completeConstant(contest, false);
    }));
});
 cronLoop.start();

exports.getContest = async (req, res) => {
    try {
        let currentTime = (new Date(Date.now())).getTime();
        let contests = await Contest.find({ startTime: { $lt: currentTime }, endTime: { $gt: currentTime } });
        return res.status(200).json({ status: true, message: "success", data: contests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
}

exports.getContestLive = async (req, res) => {
    try {
        let currentTime = (new Date(Date.now())).getTime();
        let contests = await Contest.find({ startTime: { $lt: currentTime }, endTime: { $gt: currentTime } });
        return res.status(200).json({ status: true, message: "success", data: contests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
}

exports.getContesthistory = async (req, res) => {
    try {
        let jsonQuery = {};
        if (req.body.challenge_type && req.body.challenge_type != "no_data") {
            jsonQuery["challenge_type"] = req.body.challenge_type;
        }
        if (req.body.startTime) {
            jsonQuery["startTime"] = { $gte: req.body.startTime };
        }
        if (req.body.endTime) {
            jsonQuery["endTime"] = { $lte: req.body.endTime };
        }
        let contestHistory = await ContestHistory.find(jsonQuery);
        return res.status(200).json({ status: true, message: "success", data: contestHistory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
}

exports.addContest = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.contestTime) {
            return res.status(200).json({ status: false, message: "contestTime is required!" });
        }
        if (!req.body.name) {
            return res.status(200).json({ status: false, message: "name is required!" });
        }
        let setting = await Setting.exists({ "contestType.challenge_type": req.body.challenge_type })
        if (setting) {
            let currentDate = new Date(Date.now());
            const newContest = new Contest({
                name: req.body.name,
                challenge_type: req.body.challenge_type,
                contestTime: req.body.contestTime,
                prize: req.body.prize ? req.body.prize : "",
                startTime: currentDate.getTime(),
                endTime: currentDate.getTime() + Number(req.body.contestTime)
            });
            let contest = await Contest.exists({ "challenge_type": req.body.challenge_type })
            if (!contest) {
                await newContest.save().then(function () {
                    return res.status(200).json({ status: true, message: "success", data: newContest });
                }).catch(function (error) {
                    console.error(error);
                    return res.status(500).json({ status: false, error: error.message || "server error" });
                });
            } else {
                return res.status(500).json({ status: false, error: "Contest with this Challenge Type Already Exists" });
            }
        } else {
            return res.status(500).json({ status: false, error: "Invalid Challenge Type" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.updateContest = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.challenge_type) {
            return res.status(200).json({ status: false, message: "challenge_type Time is required!" });
        }
        if (!req.body.contestId) {
            return res.status(200).json({ status: false, message: "contestId Time is required!" });
        }
        let setting = await Setting.exists({ "contestType.challenge_type": req.body.challenge_type })
        if (setting) {
            let currentTime = (new Date(Date.now())).getTime();
            const contest = await Contest.findOne({
                _id: req.body.contestId,
                startTime: { $lt: currentTime },
                endTime: { $gt: currentTime }
            });
            if (!contest) {
                return res.status(200).json({ status: false, message: "Contest not found" });
            }

            if (req.body.name) {
                contest.name = req.body.name;
            }
            if (req.body.challenge_type) {
                contest.challenge_type = req.body.challenge_type;
            }
            if (req.body.contestTime) {
                contest.contestTime = req.body.contestTime;
                contest.endTime = contest.startTime + Number(req.body.contestTime);
            }
            if (req.body.prize) {
                contest.prize = req.body.prize;
            }
            return await Contest.updateOne({ _id: req.body.contestId }, contest).then(function () {
                return res.status(200).json({ status: true, message: "success", data: contest });
            }).catch(function (error) {
                console.error(error);
                return res.status(500).json({ status: false, error: error.message || "server error" });
            });
        } else {
            return res.status(500).json({ status: false, error: "Invalid Challenge Type" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.addCoin = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.userId) { // from user id
            return res.status(200).json({ status: false, message: "userId is required!" });
        }
        if (!req.body.hostId) { // to user id
            return res.status(200).json({ status: false, message: "hostId is required!" });
        }
        if (!req.body.coin) {
            return res.status(200).json({ status: false, message: "coin is required!" });
        }

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(200).json({ status: false, message: "user not found" });
        }
        if (user.coin <= 0 || user.coin < req.body.coin) {
            return res.status(200).json({ status: false, message: "You have not enough coin!" });
        }

        const hostUser = await User.findById(req.body.hostId);
        if (!hostUser) {
            return res.status(200).json({ status: false, message: "host User not found" });
        }

        user.coin = user.coin - parseInt(req.body.coin);
        await user.save().then(async () => {
            hostUser.coin = hostUser.coin + parseInt(req.body.coin);
            await hostUser.save().then(async () => {
                const newHistory = new History({
                    from_user_id: req.body.userId,
                    to_user_id: req.body.hostId,
                    coin: parseInt(req.body.coin),
                    type: "received"
                });
                await newHistory.save().then(async () => {
                    let currentTime = (new Date(Date.now())).getTime();
                    if (req.body.challenge_type && req.body.challenge_type == "15_minutes") {
                        
                        let coinDetail = await Coin.findOne({
                            contestId: req.body.contestId,
                            userId: req.body.userId
                        });

                        let user_data = await User.find({ _id: req.body.userId });
                        // const user_data = await User.aggregate([
                        //     {
                        //         $match: { _id: mongoose.Types.ObjectId(req.body.contest_id) }
                        //     },
                        // ]);
                        console.log("user_data ",user_data[0].image)
                        if (!coinDetail) {
                            coinDetail = new Coin({
                                userId: req.body.userId,
                                hostId: req.body.hostId,
                                contestId: req.body.contestId,
                                challenge_type: req.body.challenge_type,
                                coin: parseInt(req.body.coin),
                                title: req.body.title ? req.body.title : ""
                            });
                        } else {
                            coinDetail.coin = coinDetail.coin + parseInt(req.body.coin)
                        }
                        coinDetail.coin_history.push({
                            coin: parseInt(req.body.coin),
                            currentTime: currentTime,
                        });
                        await coinDetail.save();
                    } else {
                        let setting = await Setting.findOne({}, { contestType: 1, _id: 0 });
                        await Promise.all(
                            await setting.contestType.map(async (contestSetting) => {
                                let newContest = new Contest({
                                    name: contestSetting.name,
                                    challenge_type: contestSetting.challenge_type,
                                    contestTime: contestSetting.contestTime,
                                    startTime: currentTime,
                                    endTime: currentTime + Number(contestSetting.contestTime)
                                })
    
                                let contest = await Contest.findOne({ challenge_type: contestSetting.challenge_type });
                                if (!contest) {
                                    await newContest.save();
                                    contest = newContest;
                                }

                                // let userdetail = awiat User.
    
                                let coinDetail = await Coin.findOne({
                                    contestId: contest._id,
                                    userId: req.body.userId
                                });
                                if (!coinDetail) {
                                    coinDetail = new Coin({
                                        userId: req.body.userId,
                                        hostId: req.body.hostId,
                                        contestId: contest._id,
                                        challenge_type: contestSetting.challenge_type,
                                        coin: parseInt(req.body.coin),
                                        title: req.body.title ? req.body.title : ""
                                    });
                                } else {
                                    coinDetail.coin = coinDetail.coin + parseInt(req.body.coin)
                                }
                                coinDetail.coin_history.push({
                                    userId: req.body.userId,
                                    coin: parseInt(req.body.coin),
                                    currentTime: currentTime
                                });
                                await coinDetail.save().then(async () => {
                                    let giftPrize = await GiftPrize.findOne({
                                        rank: 1, amount: { $lte: coinDetail.coin }, challenge_type: contestSetting.challenge_type
                                    }, { _id: 1, prize_name: 1 });
                                    if (giftPrize && giftPrize._id) {
                                        await completeConstant(contest, true, user._id, coinDetail.coin, giftPrize);
                                    }
                                }).catch(function (error) {
                                    console.error(error);
                                    return res.status(500).json({ status: false, error: error.message || "server error" });
                                });
                            })
                        )
                    }
                    return res.status(200).json({ status: true, message: "success" });
                }).catch(function (error) {
                    console.error(error);
                    return res.status(500).json({ status: false, error: error.message || "server error" });
                });
            }).catch(function (error) {
                console.error(error);
                return res.status(500).json({ status: false, error: error.message || "server error" });
            });
        }).catch(function (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: error.message || "server error" });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.getEligibleWinner = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.challenge_type) {
            return res.status(200).json({ status: false, message: "challenge_type is required!" });
        }
        let setting = await Setting.findOne({ "contestType.challenge_type": req.body.challenge_type }, { contestTime: 1 })
        if (setting) {
            let newContest = new Contest({
                name: contest.name,
                challenge_type: req.body.challenge_type,
                contestTime: setting.contestTime,
                prize: contest.prize,
                startTime: currentTime,
                endTime: currentTime + Number(setting.contestTime)
            });
            let contest = await Contest.findOne({ challenge_type: req.body.challenge_type });
            if (!contest) {
                await newContest.save();
                contest = newContest;
            } else {
                return res.status(200).json({ status: false, message: "Contest not found" });
            }

            return await Coin.aggregate([
                {
                    $match: { "contestId": contest._id }
                },
                {
                    $group: {
                        _id: "$userId",
                        totalCoin: { $sum: '$coin' },
                    }
                },
                {
                    $sort: { totalCoin: -1 }
                },
                {
                    $limit: 3 // get top $limit winner
                }
            ]).then(async (coins) => {
                if (coins && coins.length) {
                    const user = await User.findById(coins[0]._id);
                    return res.status(200).json({
                        status: true, message: "success", data: {
                            coin: coins[0],
                            user
                        }
                    });
                } else {
                    return res.status(200).json({ status: true, message: "success", data: {} });
                }
            }).catch(function (error) {
                console.error(error);
                return res.status(500).json({ status: false, error: error.message || "server error" });
            });
        } else {
            return res.status(500).json({ status: false, error: "Invalid Challenge Type" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.getranker = async (req, res) => {
    try {
        
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.userId) {
            return res.status(200).json({ status: false, message: "userId required." });
        }

        const contests = await Contest.find({}, { name: 1, challenge_type: 1 });
        if (!contests || !contests.length) {
            return res.status(200).json({ status: false, message: "Contest not found" });
        }

        let user_details = {};
        if (req.body.userId) {
            user_details = await User.findOne({ _id: req.body.userId }, {
                _id: 1, username: 1, image: 1,
            });
        }

        let contests_details = [];
        await Promise.all(
            await contests.map(async (contest) => {
                let coins = await Coin.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    },
                    {
                        $unwind: "$user_detail"
                    },
                    {
                        $match: { "contestId": contest._id }
                    },
                    {
                        $group: {
                            _id: "$userId",
                            totalCoin: { $sum: '$coin' },
                            image: { $first: "$user_detail.image" },
                            username: { $first: "$user_detail.username" },
                        }
                    },
                    {
                        $sort: { totalCoin: -1 }
                    },
                    {
                        $limit: 3 // get top $limit winner
                    }
                ])

                await Promise.all(
                    await coins.map(async (coin, index) => {
                        coin.userrank = index + 1;
                    })
                )

                let coinDetails = await Coin.aggregate([
                    {
                        $match: { "contestId": contest._id }
                    },
                    {
                        $group: {
                            _id: "$contestId",
                            totalCoin: { $sum: '$coin' }
                        }
                    }
                ])

                let userCoinTotal = 0;
                if (user_details) {
                    let userCoinDetails = await Coin.aggregate([
                        {
                            $match: {
                                "contestId": contest._id,
                                "userId": user_details._id
                            }
                        },
                        {
                            $group: {
                                _id: "$contestId",
                                totalCoin: { $sum: '$coin' }
                            }
                        }
                    ])
                    userCoinTotal = userCoinDetails && userCoinDetails.length && userCoinDetails[0].totalCoin ? userCoinDetails[0].totalCoin : 0;
                }
                let giftPrizeDetails;
                if (contest.challenge_type == "1_month" || contest.challenge_type == "24_hours" || contest.challenge_type == "1_hour") {
                    giftPrizeDetails = await GiftPrize.aggregate([
                        {
                            $match: { challenge_type: contest.challenge_type }
                        },
                        {
                            $group: {
                                _id: "$challenge_type",
                                minCoin: { $min: '$amount' },
                                maxCoin: { $max: '$amount' },
                            }
                        }
                    ]);
                }

                // let currentUserRank = await GiftPrize.find({
                //     challenge_type: contest.challenge_type
                // }, {
                //     rank: 1, amount: 1, _id: 0
                // }).sort({ amount: 1 });

                // let current_user_rank = currentUserRank.length;
                // let index = currentUserRank.findIndex(x => Number(x.amount) <= Number(userCoinTotal));
                // if (index != -1) {
                //     current_user_rank = Number(currentUserRank[index].rank)
                // }

                let currentUserRank = await Coin.find({ contestId: contest._id }, { userId: 1, _id: 0 }).sort({ coin: 1 });
                let current_user_rank = currentUserRank.length;
                let index = currentUserRank.findIndex(x => (x.userId).toString() == (user_details._id).toString());
                if (index != -1) {
                    current_user_rank = index + 1;
                }

                let contestWinner = await ContestWinner.aggregate([
                    {
                        $match: { challenge_type: contest.challenge_type }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user_detail"
                        }
                    },
                    {
                        $unwind: "$user_detail"
                    },
                    {
                        $group: {
                            _id: "$userId",
                            image: { $first: "$user_detail.image" },
                            username: { $first: "$user_detail.username" },
                            prize: { $first: "$prize" },
                            prize_image: { $first: "$prize_image" }
                        }
                    }
                ]);
                let gift1
                if( contest.challenge_type == "1_month"|| contest.challenge_type == "24_hours" ||contest.challenge_type == "1_hour" ){
                 gift1 = await GiftPrize.aggregate([
                    {
                        $match: { challenge_type: contest.challenge_type }
                    },
                ]);
            }
                contests_details.push({
                    contestId: contest._id,
                    name: contest.name,
                    challenge_type: contest.challenge_type,
                    min_coin: giftPrizeDetails && giftPrizeDetails.length && giftPrizeDetails[0].minCoin ? giftPrizeDetails[0].minCoin : 0,
                    max_coin: giftPrizeDetails && giftPrizeDetails.length && giftPrizeDetails[0].maxCoin ? giftPrizeDetails[0].maxCoin : 0,
                    user_total_coin: userCoinTotal,
                    total_coin: coinDetails && coinDetails.length && coinDetails[0].totalCoin ? coinDetails[0].totalCoin : 0,
                    current_user_rank: current_user_rank,
                    toper: coins,
                    giftprize: gift1,
                    contestWinner: contestWinner && contestWinner.length ? contestWinner[0] : {}
                });

                return contest;
            })
        ).then(async (data) => {
            return res.status(200).json({
                status: true,
                message: "success",
                data: {
                    user_details,
                    contests_details
                }
            });
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.getWinnerhistory = async (req, res) => {
    try {

        let jsonQuery = {};
        let jsonQuery1 = {};
        if (req.body.contestId) {
            jsonQuery["contestId"] = mongoose.Types.ObjectId(req.body.contestId);
        }
        if (req.body.userId) {
            jsonQuery1["contest_winner_detail.userId"] = mongoose.Types.ObjectId(req.body.userId);
        }
        if (req.body.challenge_type) {
            jsonQuery["challenge_type"] = req.body.challenge_type;
        }
        if (req.body.startTime) {
            jsonQuery["startTime"] = { $gte: req.body.startTime };
        }
        if (req.body.endTime) {
            jsonQuery["endTime"] = { $lte: req.body.endTime };
        }
        let contestWinnerHistory = await ContestHistory.aggregate([
            {
                $match: jsonQuery
            },
            {
                $lookup: {
                    from: "contest_winners",
                    localField: "contestId",
                    foreignField: "contestId",
                    as: "contest_winner_detail"
                }
            },
            {
                $unwind: "$contest_winner_detail"
            },
            {
                $match: jsonQuery1
            },
        ])

        return res.status(200).json({ status: true, message: "success", data: contestWinnerHistory });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
}

exports.getuserRank = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.challenge_type) {
            return res.status(200).json({ status: false, message: "challenge_type is required!" });
        }
        if (!req.body.userIds) {
            return res.status(200).json({ status: false, message: "userIds Invalid." });
        }

        let setting = await Setting.findOne({ "contestType.challenge_type": contest.challenge_type }, { contestTime: 1 })
        if (setting) {
            let newContest = new Contest({
                name: contest.name,
                challenge_type: req.body.challenge_type,
                contestTime: setting.contestTime,
                prize: contest.prize,
                startTime: currentTime,
                endTime: currentTime + Number(setting.contestTime)
            });
            let contest = await Contest.findOne({ challenge_type: req.body.challenge_type }, { name: 1, challenge_type: 1 });
            if (!contest) {
                await newContest.save();
                contest = newContest;
            }
            let coins = await Coin.aggregate([
                {
                    $match: {
                        "contestId": contest._id,
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        totalCoin: { $sum: '$coin' },
                    }
                },
                {
                    $sort: { totalCoin: -1 }
                }
            ])

            let rank_details = [];
            await Promise.all(
                await coins.map(async (coin, index) => {
                    var findIndex = req.body.userIds.findIndex(x => (x).toString() == (coin._id).toString());
                    if (findIndex > -1) {
                        rank_details.push({
                            user_id: coin._id,
                            rank: findIndex > -1 ? (index + 1) : coins.length
                        })
                    }
                })
            )
            return res.status(200).json({ status: true, message: "success", data: rank_details });
        } else {
            return res.status(500).json({ status: false, error: "Invalid Challenge Type" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.getcontestcoin = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.contest_id) {
            return res.status(200).json({ status: false, message: "contest_id is required!" });
        }

        // const senderDetail = await Coin.aggregate([
        //     {
        //         $match: {
        //             contestId: mongoose.Types.ObjectId(req.body.contest_id),
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: "users",
        //             localField: "userId",
        //             foreignField: "_id",
        //             as: "user_detail"
        //         }
        //     },
        //     {
        //         $unwind: "$user_detail"
        //     },
        //     {
        //         $group: {
        //             _id: userdata[0].user_id,
        //             userId: { $first: userdata[0].user_id },
        //             totalCoin: { $sum: '$coin' },
        //             coin_history : {$first : "$coin_history"},
        //         }
        //     },
        // ]);

        const receiverDetail = await Coin.aggregate([
            {
                $match: {
                    contestId: mongoose.Types.ObjectId(req.body.contest_id),
                },                
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            {
                $unwind: "$user_detail"
            },
            {
                $project: {
                    hostId: "$hostId",
                    coin: "$coin",
                    coin_history: {
                        userId: "$user_detail._id",
                        coin: "$coin",
                        currentTime:"$currentTime",
                        username: "$user_detail.username",
                        image: "$user_detail.image",
                    }
                }
            },
            {
                $group: {
                    _id: "$hostId",
                    userId: { $first: "$hostId" },
                    totalCoin: { $sum: '$coin' },
                    coin_history : {
                        $push: { 
                            $first:  "$coin_history"
                        }
                    },
                }
            }
        ])

        return res.status(200).json({ status: true, message: "success", data: receiverDetail });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};

exports.getcontestcoinall = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.contest_id) {
            return res.status(200).json({ status: false, message: "contest_id is required!" });
        }
        const senderDetail = await Coin.aggregate([
            {
                $match: { contestId: mongoose.Types.ObjectId(req.body.contest_id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            {
                $unwind: "$user_detail"
            },
            {
                $group: {
                    _id: "$userId",
                    totalCoin: { $sum: '$coin' },
                    image: { $first: "$user_detail.image" },
                    username: { $first: "$user_detail.username" },
                }
            },
        ]);

        const receiverDetail = await Coin.aggregate([
            {
                $match: { contestId: mongoose.Types.ObjectId(req.body.contest_id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "hostId",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            {
                $unwind: "$user_detail"
            },
            {
                $group: {
                    _id: "$hostId",
                    totalCoin: { $sum: '$coin' },
                    image: { $first: "$user_detail.image" },
                    username: { $first: "$user_detail.username" },
                }
            }
        ]);

        return res.status(200).json({
            status: true, message: "success", data: {
                senderDetail: senderDetail,
                receiverDetail: receiverDetail
        } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};
