const express = require("express");
const router = express.Router();

const NotificationController = require("./notification.controller");

var checkAccessWithSecretKey = require("../../checkAccess");

const multer = require("multer");

const storage = require("../../util/multer");

const upload = multer({
  storage,
});

router.get(checkAccessWithSecretKey());
router.get("/getnotification", NotificationController.getNotification);

//send notification through FCM-NODE
router.post(
  "/notification/send",
  upload.single("image"),
  NotificationController.sendNotification
);

// router.post(
//   "/notification/send",
//   upload.single("image"),
//   NotificationController.send
// );

module.exports = router;
