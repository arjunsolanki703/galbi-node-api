const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

//socket io
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);

app.use(express.json());
app.use(cors());

const config = require("./config");

//live view model
const LiveView = require("./server/liveView/liveView.model");
const UserModel = require("./server/user/user.model")
//model routes
const AdminRoute = require("./server/admin/admin.route");
app.use("/admin", AdminRoute);

//user routes
const UserRoute = require("./server/user/user.route");
app.use("/user", UserRoute);

//gift prize route
const Giftprize = require("./server/giftprize/giftprize.route");
app.use("/giftprize", Giftprize);

// coin model
const Coin = require("./server/contest/coin.model");



//country routes
const CountryRoute = require("./server/country/country.route");
app.use("/country", CountryRoute);

//chat route
const ChatRoute = require("./server/chat/chat.route");
app.use("/chat", ChatRoute);

//chat topic route
const ChatTopicRoute = require("./server/chatTopic/chatTopic.route");
app.use("/chatTopic", ChatTopicRoute);

//sticker route
const StickerRoute = require("./server/sticker/sticker.route");
app.use("/sticker", StickerRoute);

//emoji route
const EmojiRoute = require("./server/emoji/emoji.route");
app.use("/emoji", EmojiRoute);

//image route
const ImageRoute = require("./server/image/image.route");
app.use("/image", ImageRoute);

//random route
const RandomRoute = require("./server/random/random.route");
app.use("/", RandomRoute);

//live comment route
const LiveCommentRoute = require("./server/liveComment/liveComment.route");
app.use("/livecomment", LiveCommentRoute);

//live view route
const LiveViewRoute = require("./server/liveView/liveView.route");
app.use("/liveview", LiveViewRoute);

//category route
const CategoryRoute = require("./server/category/category.route");
app.use("/category", CategoryRoute);

//gift route
const GiftRoute = require("./server/gift/gift.route");
app.use("/gift", GiftRoute);

//follower route
const FollowerRoute = require("./server/follower/follower.route");
app.use("/", FollowerRoute);

//favorite route
const FavouriteRoute = require("./server/favourite/favourite.route");
app.use("/", FavouriteRoute);

//plan route
const PlanRoute = require("./server/plan/plan.route");
app.use("/plan", PlanRoute);

//VIP plan route
const VIPPlanRoute = require("./server/VIP plan/VIPplan.route");
app.use("/VIPplan", VIPPlanRoute);

//history route
const HistoryRoute = require("./server/history/history.route");
app.use("/history", HistoryRoute);

//notification route
const NotificationRoute = require("./server/notification/notification.route");
app.use("/", NotificationRoute);

//dashboard route
const DashboardRoute = require("./server/dashboard/dashboard.route");
app.use("/dashboard", DashboardRoute);

//setting route
const SettingRoute = require("./server/setting/setting.route");
app.use("/setting", SettingRoute);

//report user route
const ReportRoute = require("./server/report/report.route");
app.use("/report", ReportRoute);

//advertisement route
const AdvertisementRoute = require("./server/advertisement/advertisement.route");
app.use("/advertisement", AdvertisementRoute);

//redeem User
const RedeemRoute = require("./server/redeem/redeem.route");
app.use("/redeem", RedeemRoute);

//host route
const HostRoute = require("./server/host/host.route");
app.use("/host", HostRoute);

// contest routes
const contestRoute = require("./server/contest/contest.route");
app.use("/contest", contestRoute);

app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(path.join(__dirname, "storage")));

app.get("/*", function (req, res) {
  res.status(200).sendFile(path.join(__dirname, "public", "index.html"));
});

mongoose.connect(`mongodb+srv://doadmin:8907tsJo5dz642TV@db-mongodb-nyc3-21846-0935de9b.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=db-mongodb-nyc3-21846&readPreference=primary&appname=MongoDB%20Compass`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  ssl: true,
  sslValidate: false,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("MONGO: successfully connected to db");
});

//socket io

io.on("connect", (socket) => {
  //The moment one of your client connected to socket.io server it will obtain socket id
  //Let's print this out.
  console.log(`Connection : SocketId = ${socket.id}`);

  const { room } = socket.handshake.query;
  const { chatroom } = socket.handshake.query;
  const { globalRoom } = socket.handshake.query;

  console.log("room " + room);
  console.log("chat room " + chatroom);
  console.log("global room " + globalRoom);

  socket.join(room);
  socket.join(chatroom);
  socket.join(globalRoom);

  socket.on("msg", (data) => {
    console.log("comment" + data);
    io.in(room).emit("msg", data);
  });

  socket.on("filter", (data) => {
    console.log("filter" + data);
    io.in(room).emit("filter", data);
  });

  socket.on("gif", (data) => {
    console.log("gif" + data);
    io.in(room).emit("gif", data);
  });

  socket.on("sticker", (data) => {
    console.log("sticker" + data);
    io.in(room).emit("sticker", data);
  });

  socket.on("emoji", (data) => {
    console.log("emoji" + data);
    io.in(room).emit("emoji", data);
  });

  socket.on("gift", (data) => {
    console.log("gift" + data);
    io.in(room).emit("gift", data);
  });

  socket.on("chat", async (data) => {
    console.log("chat" + data);
    io.in(chatroom).emit("chat", data);
  });

  socket.on("timer_start_stop", async (data) => {
    console.log("darshit ...data user_id...", data.user_id)
    console.log("darshit ...data is_timer...", data.is_timer)
    console.log("darshit ...data end_timer...", data.end_timer)
    // console.log("darshit ... thumblist ...",thumblist )
    if (data.user_id) {
      const thumblist = await UserModel.findOne({ _id: data.user_id });
      console.log(thumblist)
      if (thumblist) {
       
          thumblist.is_timer = data.is_timer;
          console.log("is_timer")
      
        
          thumblist.end_timer = data.end_timer;
          console.log("end_timer")
        
       
        await thumblist.save();
        console.log("thumblist : ", thumblist);
      }
    }
    io.in(room).emit("timer_start_stop", data);
  });

  socket.on("contest_live_coins", async (data) => {
    console.log("contest_live_coins data" + data);

    const receiverDetail = await Coin.aggregate([
      {
          $match: {
              contestId: mongoose.Types.ObjectId(data.contest_id),
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
              totalCoin: { $sum: '$coin' }                     
          }
      }
  ])

      console.log("receiverDetail  data ",receiverDetail)
    io.in(room).emit("contest_live_coins", receiverDetail);
  });

  socket.on("is_internal_request", async (data) => {
    const isUserExist1 = await UserModel.findOne({_id: data.user_id });
    console.log(isUserExist1)
    if (isUserExist1) {
      isUserExist1.is_internal_user = data.is_internal_user;
      await isUserExist1.save();
      console.log("HELLLLO", isUserExist1.is_internal_user)
    }
     io.in(room).emit("is_internal_request", data);
  });

  socket.on("viewadd", async (data) => {
    var isUserExist = await LiveView.findOne({ user_id: data.user_id });
    if (!isUserExist) {
      isUserExist = new LiveView({
        user_id: data.user_id,
        name: data.name,
        image: data.image,
        challenge_type: data.challenge_type,
      });
    }
    isUserExist.token = data.token;
    await isUserExist.save();
    const count = await LiveView.find({ token: data.token }).countDocuments();
    io.in(room).emit("view", count, data.challenge_type);
  });
  socket.on("challenge_state_change", async (data) => {
    console.log("chat" + data);
    io.in(room).emit("challenge_state_change", data);
  });

  socket.on("viewless", async (data) => {
    console.log("less view" + data);

    const view = await LiveView.findOne({
      $and: [{ user_id: data.user_id }, { token: data.token }],
    });

    if (view) {
      await view.deleteOne();
    }

    const count = await LiveView.find({ token: data.token }).countDocuments();
    console.log(count);
    io.in(room).emit("view", count);
  });
  socket.on("challenges", (data) => {
    console.log("challenges" + data);
    io.in(room).emit("challenges", data);
  });

  socket.on("ended", (data) => {
    console.log("ended" + data);
    io.in(room).emit("ended", data);
  });

  socket.on("refresh", (data) => {
    console.log("refresh " + data);
    io.in(globalRoom).emit("refresh", data);
  });
  socket.on("call", (data) => {
    console.log("call " + data);
    io.in(globalRoom).emit("call", data);
  });
  socket.on("callAnswer", (data) => {
    console.log("callAnswer " + data);
    io.in(globalRoom).emit("callAnswer", data);
  });

  socket.on("disconnect", function () {
    console.log("One of sockets disconnected from our server.");
  });
});

//start the server
server.listen(config.PORT, () => {
  console.log("Magic happens on port " + config.PORT);
});
