const express = require("express");
const router = express.Router();

const SettingController = require("./setting.controller");

var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

router.get("/", SettingController.index);
router.post("/", SettingController.store);
router.patch("/:setting_id", SettingController.update);
router.patch("/googlePay/:setting_id", SettingController.googlePaySwitch);
router.patch("/razorPay/:setting_id", SettingController.razorPaySwitch);
router.patch("/stripe/:setting_id", SettingController.stripeSwitch);

module.exports = router;
