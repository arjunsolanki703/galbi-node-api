const Notification = require("./notification.model");
const dayjs = require("dayjs");
const { serverPath } = require("../../util/serverPath");
// const { admin } = require("../../firebaseConfig");

//FCM
var FCM = require("fcm-node");
var { serverKey } = require("../../util/serverPath");
var fcm = new FCM(serverKey);

//for android
exports.getNotification = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const notification = await Notification.find({
      user_id: req.query.user_id,
    })
      .skip(start)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!notification) {
      return res.status(200).json({ status: false, message: "not found" });
    }
    let now = dayjs();

    const notification_ = notification.map((data) => ({
      _id: data._id,
      title: data.title,
      description: data.description,
      type: data.type,
      image: data.image,
      user_id: data.user_id,
      time:
        now.diff(data.createdAt, "minute") <= 60 &&
        now.diff(data.createdAt, "minute") >= 0
          ? now.diff(data.createdAt, "minute") + " minutes ago"
          : now.diff(data.createdAt, "hour") >= 24
          ? now.diff(data.createdAt, "day") + " days ago"
          : now.diff(data.createdAt, "hour") + " hours ago",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      __v: data.__v,
    }));
    return res
      .status(200)
      .json({ status: true, message: "success", data: notification_ });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//for send notification
// exports.send = async (req, res) => {
//   try {
//     const payload = {
//       notification: {
//         body: req.body.description,
//         title: req.body.title,
//         image: serverPath + req.file.path,
//       },
//     };
//     console.log(payload);
//     const topic = "WEAMZ";

//     admin
//       .messaging()
//       .sendToTopic(topic, payload)

//       .then(function (response) {
//         res.status(200).json({
//           status: 200,
//           message: "Successfully sent message",
//           data: true,
//         });

//         console.log("Successfully sent message:", response);
//       })
//       .catch(function (error) {
//         console.log("Error sending message:", error);
//       });
//   } catch (error) {
//     console.log("Error sending message:", error);
//   }
// };

//send notification through FCM
exports.sendNotification = async (req, res) => {
  try {
    const topic = "/topics/WEAMZ";
    var message = {
      //this may vary according to the message type (single recipient, multicast, topic, et cetera)
      to: topic,

      notification: {
        body: req.body.description,
        title: req.body.title,
        image: serverPath + req.file.path,
      },
    };

    await fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!");
      } else {
        res.status(200).json({
          status: 200,
          message: "Successfully sent message",
          data: true,
        });
        console.log("Successfully sent with response: ", response);
      }
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
