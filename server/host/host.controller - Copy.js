const Host = require("./host.model");
const fifteen_min_contest = require("./fifteen_min_contest.model");
const User = require("../user/user.model");
const live_p = require("./live_p.model")
const Follower = require("../follower/follower.model");
const Notification = require("../notification/notification.model");
const Country = require("../country/country.model");
const { deleteFile } = require("../../util/deleteFile");
const fs = require("fs");
const shuffleArray = require("../../util/shuffle");
let stringify = require('json-stringify-safe');
var FCM = require("fcm-node");
var { serverKey } = require("../../util/serverPath");
var fcm = new FCM(serverKey);
const Contest = require("./../contest/contest.model");
const Coin = require("./../contest/coin.model");
const ContestWinner = require("./../contest/contest_winner.model");
const GiftPrize = require("./../giftprize/giftprize.model");
const Setting = require("./../setting/setting.model")
//get list of host
exports.index = async (req, res) => {
    try {
        const host = await Host.find().populate("host_id").sort({ createdAt: -1 });

        if (!host) {
            throw new Error();
        }

        return res
            .status(200)
            .json({ status: true, message: "Success", data: host });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Server Error",
        });
    }
};

//create user request for becoming host
exports.store = async (req, res) => {
    try {
        if (!req.body)
            return res
                .status(200)
                .json({ status: false, message: "Invalid details." });
        if (!req.body.bio) {
            deleteFile(req.file);
            return res
                .status(200)
                .json({ status: false, message: "Bio is required" });
        }
        if (!req.body.user_id) {
            deleteFile(req.file);
            return res
                .status(200)
                .json({ status: false, message: "User Id is required" });
        }
        if (!req.body.imgurl)
            return res
                .status(200)
                .json({ status: false, message: "please select an image" });

        const user = await User.findById(req.body.user_id);
        if (!user) {
            return res.status(200).json({ status: false, message: "User not found" });
        }

        //user.thumbImage = req.file.path;
        user.imgurl = req.body.imgurl
        user.bio = req.body.bio;

        await user.save();

        //check user request is exist in host collection
        const isHostExist = await Host.findOne({ host_id: req.body.user_id });
        if (isHostExist) {
            return res.status(200).json({ status: true, message: "Success" });
        }
        const host = new Host();

        host.host_id = req.body.user_id;
        await host.save();

        if (!host) {
            return res.status(200).json({
                status: false,
                message: "host not created something went wrong!",
            });
        }

        return res.status(200).json({ status: true, message: "Success" });
    } catch (error) {
        console.log(error);
        deleteFile(req.file);
        return res
            .status(500)
            .json({ status: false, error: error.message || "Server Error" });
    }
};

//accept or unAccept user request for becoming host
exports.enableDisableHost = async (req, res) => {
    try {
        const host = await Host.findById(req.params.host_id);
        if (!host) {
            return res.status(200).json({ status: false, message: "host not found" });
        }

        host.isAccepted = !host.isAccepted;
        await host.save();

        const user = await User.findById(host.host_id);

        if (!user) {
            return res.status(200).json({ status: false, message: "user not found" });
        }

        user.isHost = !user.isHost;
        await user.save();

        if (!user.isHost) {
            user.isOnline = false;
            user.isBusy = false;

            await user.save();
        }

        return res
            .status(200)
            .json({ status: true, message: "success", data: host });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//host is online
exports.hostIsOnline = async (req, res) => {
    try {
        if (
            req.body.user_id &&
            req.body.token &&
            req.body.channel &&
            req.body.country
        ) {
            const user = await User.findById(req.body.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            if (!user.isHost) {
                return res.status(200).json({
                    status: false,
                    message: "You are not host, Your host request is not accepted !",
                });
            }

            const country = await Country.find({
                name: req.body.country.toUpperCase(),
            });

            if (country.length === 0) {
                const country = new Country();
                country.name = req.body.country.toUpperCase();
                await country.save();
                user.hostCountry = country._id;
            } else {
                user.hostCountry = country[0]._id;
            }

            user.isOnline = true;
            user.isBusy = false;
            user.isLive = false;
            user.token = req.body.token;
            user.channel = req.body.channel;

            await user.save();

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//host is live
exports.hostIsLive = async (req, res) => {
    try {
        if (
            req.body.user_id &&
            req.body.token &&
            req.body.channel &&
            req.body.country 
            // req.body.challenge_type
        ) {

            let contestTime = 0;
            let contestname;
            let currentTime = (new Date(Date.now())).getTime();
            let contest
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

                    contest = await Contest.findOne({ challenge_type: contestSetting.challenge_type });
                    if (!contest) {
                        await newContest.save();
                         contest = newContest;
                    }
                  })
            )
                

            // let contest = await Contest.findOne({
            //     challenge_type: req.body.challenge_type,
            //     startTime: { $lt: currentTime },
            //     endTime: { $gt: currentTime }
            // });
            // if (!contest) {
            //     let setting = await Setting.findOne({ "contestType.challenge_type": req.body.challenge_type }, { _id: 0, contestTime: 1 });
            //     if (setting) {
            //         contest = new Contest({
            //             name: contestname,
            //             challenge_type: req.body.challenge_type,
            //             contestTime: setting.contestTime,
            //             startTime: currentTime,
            //             endTime: currentTime + Number(setting.contestTime)
            //         })
            //         contest.save();
            //     }
            // }
            // if (!contest) {
            //     return res.status(200).json({ status: false, message: "Contest not Found!" });
            // }
            const livep = new live_p()

            livep.challenge_type = req.body.challenge_type
            livep.startTime = (new Date(Date.now())).getTime();
            livep.endTime = contest ? contest.endtime : (new Date(Date.now())).getTime() + Number(contestTime);
            livep.user_id = req.body.user_id
            await livep.save();

            const user = await User.findById(req.body.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            const country = await Country.find({
                name: req.body.country.toUpperCase(),
            });

            if (country.length === 0) {
                const country = new Country();
                country.name = req.body.country.toUpperCase();
                await country.save();
                user.hostCountry = country._id;
            } else {
                user.hostCountry = country[0]._id;
            }

            user.isOnline = false;
            user.isLive = true;
            user.token = req.body.token;
            user.channel = req.body.channel;
            user.challenge_type = req.body.challenge_type;
            user.is_timer = req.body.is_timer;
            user.end_timer = req.body.end_timer;
            await user.save();

            const followers = await Follower.find({
                to_user_id: req.body.user_id,
            }).populate("to_user_id from_user_id");

            // const image_ = await Image.findOne({ user_id: req.body.user_id });

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
                            image: user.image,
                            host_id: user._id.toString(),
                            name: user.name,
                            country_id: user.hostCountry.toString(),
                            type: "real",
                            coin: user.coin.toString(),
                            token: user.token,
                            channel: user.channel,
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

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//host is offline
exports.hostIsOffline = async (req, res) => {
    try {
        if (req.query.user_id) {
            const user = await User.findById(req.query.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            if (!user.isHost) {
                return res.status(200).json({
                    status: false,
                    message: "You are not host, Your host request is not accepted !",
                });
            }

            const country = await Country.findById(user.hostCountry);

            if (country) {
                const user = await User.find({
                    hostCountry: country._id,
                    _id: { $ne: req.query.user_id },
                }).countDocuments();

                if (user === 0) {
                    const country_ = await Country.findById(country._id);
                    if (country_) {
                        country_.deleteOne();
                    }
                }
            }

            user.isOnline = false;
            user.isLive = false;
            user.isBusy = false;
            user.token = null;
            user.channel = null;
            user.hostCountry = null;

            await user.save();

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//remove host from live
exports.hostIsUnLive = async (req, res) => {
    try {
        if (req.query.user_id) {
            const user = await User.findById(req.query.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            if (!user.isHost) {
                return res.status(200).json({
                    status: false,
                    message: "You are not host, Your host request is not accepted !",
                });
            }

            user.isBusy = false;
            user.isLive = false;

            await user.save();

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//host is busy (connect call)
exports.hostIsBusy = async (req, res) => {
    try {
        if (req.query.user_id) {
            const user = await User.findById(req.query.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            if (!user.isOnline) {
                return res
                    .status(200)
                    .json({ status: false, message: "Host is not online!" });
            }

            user.isBusy = true;

            await user.save();

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//host is free (disconnect call)
exports.hostIsFree = async (req, res) => {
    try {
        if (req.query.user_id) {
            const user = await User.findById(req.query.user_id);

            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }

            if (!user.isOnline) {
                return res
                    .status(200)
                    .json({ status: false, message: "Host is not online!" });
            }

            user.isBusy = false;

            await user.save();

            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//random host for match [android]
exports.randomHost = async (req, res) => {
    try {
        const user = await User.find({
            isOnline: true,
            isBusy: false,
            isHost: true,
        }).populate("hostCountry");

        if (!user) {
            return res
                .status(200)
                .json({ status: false, message: "User not Found!" });
        }

        const data = await user.map((user) => ({
            image: user.thumbImage,
            profile_image: user.image,
            host_id: user._id,
            name: user.name,
            country_id: user.hostCountry ? user.hostCountry._id : "",
            country_name: user.hostCountry ? user.hostCountry.name : "",
            isBusy: user.isBusy,
            rate: user.rate,
            coin: user.coin,
            token: user.token,
            channel: user.channel,
            view: 0,
        }));

        shuffleArray(data);

        return res.status(200).json({ status: true, message: "Success", data });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//joinrequest
exports.joinrequest = async (req, res) => {
    console.log(req.query.host_id)
    try {
        if (req.query.user_id && req.query.host_id && req.query.challenge_types && req.query.is_internal_request) {
            const user = await User.findById(req.query.user_id);
            // const host = await User.findOne({ host_id: req.query.host_id});
            const host = await Host.findOne({ host_id: req.query.host_id });
            const fcm1 = await User.findById(req.query.host_id);
            // console.log("FCM",fcm1)
            // var data = ''
            // data = user.image.toString()
            // console.log(stringify(data))
            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }
            if (!host.host_id) {
                return res
                    .status(200)
                    .json({ status: false, message: "Host not Found!" });
            }
            const fcmtoken = user.fcm_token
            console.log(fcmtoken)

            var message = {
                to: fcm1.fcm_token,
                // collapse_key: 'your_collapse_key',

                notification: {
                    title: 'Data Test',
                    // body: ''
                },

                data: {  //you can send only notification or only data(or include both)
                    name: stringify(user.username),
                    Image: stringify(user.image),
                    id: stringify(user._id),
                    username: stringify(user.username),
                    identity: stringify(user.identity),
                    challenge_types: stringify(req.query.challenge_types),
                    bio: stringify(user.bio),
                    coin: stringify(user.coin),
                    followerscount: stringify(user.followers_count),
                    followers_count: stringify(user.followers_count),
                    block: stringify(user.block),
                    dailyTaskFinishedCount: stringify(user.dailyTaskFinishedCount),
                    rate: stringify(user.rate),
                    isLogout: stringify(user.isLogout),
                    isVIP: stringify(user.isVIP),
                    plan_id: stringify(user.plan_id),
                    plan_start_date: stringify(user.plan_start_date),
                    isOnline: stringify(user.isOnline),
                    isLive: stringify(user.isLive),
                    isBusy: stringify(user.isBusy),
                    isHost: stringify(user.isHost),
                    token: stringify(user.token),
                    channel: stringify(user.channel),
                    device_type: stringify(user.device_type),
                    fcm_token: stringify(user.fcm_token),
                    country: stringify(user.country),
                    hostCountry: stringify(user.hostCountry),
                    is_internal_request : req.query.is_internal_request,
                    __v: stringify(user.__v)
                }
            };

            fcm.send(message, function (err, response) {
                if (err) {
                    console.log(err)
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });


            return res.status(200).json({ status: true, message: "Success" });
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

//requesttype
exports.Requesttype = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.query.host_id) {
            return res.status(200).json({ status: false, message: "host_id is required!" });
        }
        if (!req.query.user_id) {
            return res.status(200).json({ status: false, message: "user_id is required!" });
        }
        if (!req.query.value) {
            return res.status(200).json({ status: false, message: "value is required!" });
        }
        if (!req.query.type) {
            return res.status(200).json({ status: false, message: "type is required!" });
        }
        if (req.query.user_id && req.query.value && req.query.host_id && req.query.type) {
            const user = await User.findById(req.query.user_id);
            const host = await User.findById(req.query.host_id);
            let getdata;
            let getuserdata;
            let gethostdata;


            if (!user) {
                return res
                    .status(200)
                    .json({ status: false, message: "User not Found!" });
            }
            if (!host) {
                return res
                    .status(200)
                    .json({ status: false, message: "Host not Found!" });
            }
            const value = req.query.value
            const type = req.query.type
            const fcmtoken = user.fcm_token
            console.log(fcmtoken)
            if (value === 'ACCEPTED' && type === 'contest_start') {

                let currentDate = new Date(Date.now());
                const fifteenmincontest = new fifteen_min_contest({
                    name: "15 minutes",
                    challenge_type: "15_minutes",
                    contestTime: "900000",
                    prize: req.body.prize ? req.body.prize : "",
                    startTime: currentDate.getTime(),
                    endTime: currentDate.getTime() + Number("900000"),
                    type: req.query.type,
                    user_id: req.query.user_id,
                    host_id: req.query.host_id
                });
                await fifteenmincontest.save();

                getdata = await fifteen_min_contest.find({}).sort({ createdAt: -1 }).limit(1);

                getuserdata = await User.aggregate([
                    {
                        $match: { _id: getdata[0].user_id }
                    }
                ]);

                gethostdata = await User.aggregate([
                    {
                        $match: { _id: getdata[0].host_id }
                    }
                ]);

                var message = {
                    to: fcmtoken,
                    // collapse_key: 'your_collapse_key',

                    notification: {
                        title: 'Data Test',
                        body: 'Your Request is Accepted',
                        data: {
                            contestID: getdata._id,
                            "userdata": getuserdata,
                            "hostdata": gethostdata
                        }
                    },

                };

                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log(err)
                        console.log("Something has gone wrong!");
                    } else {
                        console.log("Successfully sent with response: ", response);
                    }
                });
                return res.status(200).json({ status: true, message: "Success", data: { "contestId": getdata[0]._id, "userdata": getuserdata , "hostdata" : gethostdata} });
            }

            if (value === "REJECTED") {
                var message = {
                    to: fcmtoken,
                    // collapse_key: 'your_collapse_key',

                    notification: {
                        title: 'Data Test',
                        body: 'Your Request is Rejected'
                    },

                    data: {  //you can send only notification or only data(or include both)

                    }
                };

                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log(err)
                        console.log("Something has gone wrong!");
                    } else {
                        console.log("Successfully sent with response: ", response);
                    }
                });
                return res.status(200).json({ status: true, message: "Success"});
            }
            if(value === 'ACCEPTED' && type === 'join'){
                getdata = await fifteen_min_contest.find({}).sort({ createdAt: -1 }).limit(1);

                getuserdata = await User.aggregate([
                    {
                        $match: { _id: getdata[0].user_id }
                    }
                ]);

                gethostdata = await User.aggregate([
                    {
                        $match: { _id: getdata[0].host_id }
                    }
                ]);

                var message = {
                    to: fcmtoken,
                    // collapse_key: 'your_collapse_key',

                    notification: {
                        title: 'Data Test',
                        body: 'You have Join Request',
                        data: {
                            contestID: getdata._id,
                            "userdata": getuserdata,
                            "hostdata": gethostdata
                        }
                    },

                };

                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log(err)
                        console.log("Something has gone wrong!");
                    } else {
                        console.log("Successfully sent with response: ", response);
                    }
                });
                return res.status(200).json({ status: true, message: "Success"});
            }

            
        } else {
            return res
                .status(200)
                .json({ status: false, message: "Invalid Details" });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: false, error: error.message || "server error" });
    }
};

exports.completeContest = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(200).json({ status: false, message: "Invalid details." });
        }
        if (!req.body.contestId) {
            return res.status(200).json({ status: false, message: "contestId is required!" });
        }
        let contest = await fifteen_min_contest.findOne({ _id: req.body.contestId });

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
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            {
                $unwind: "$user_detail"
            },
            {
                $group: {
                    _id: "$_id",
                    totalCoin: { $sum: '$totalCoin' },
                    image: { $first: "$user_detail.image" },
                    username: { $first: "$user_detail.username" },
                }
            }
        ])
        let response = {};
        if (coins && coins.length) {
            const newContestWinner = new ContestWinner({
                challenge_type: contest.challenge_type,
                contestId: contest._id,
                userId: coins[0]._id,
                totalCoin: coins[0].totalCoin
            })

            console.log("coins[0].totalCoin : ", coins[0].totalCoin);
            console.log("contest.challenge_type : ", contest.challenge_type);

            response.coins = coins[0];
            let giftPrize = await GiftPrize.findOne({
                challenge_type: contest.challenge_type, amount: { $lte: coins[0].totalCoin }
            }, { _id: 1, prize_name: 1 })
            if (giftPrize && giftPrize._id) {
                response.giftPrize = giftPrize;
                newContestWinner.giftPrizeId = giftPrize._id;
                newContestWinner.prize = giftPrize.prize_name;
            }

            let contestWinner = await ContestWinner.exists({ contestId: contest._id });
            if (!contestWinner) {
                await newContestWinner.save();
                response.newContestWinner = newContestWinner;
                contest.winner_id = newContestWinner._id;
            }
        }

        contest.type = "contest_completed";
        contest.endTime = (new Date(Date.now())).getTime();
        await contest.save();
        response.contest = contest;
        return res.status(200).json({
            status: true,
            message: "success",
            data: response
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, error: error.message || "server error" });
    }
};
