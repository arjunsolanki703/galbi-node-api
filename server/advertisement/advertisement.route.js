const express = require("express");
const router = express.Router();

const AdvertisementController = require("./advertisement.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

//for android and backend
router.get("/", AdvertisementController.googleFacebookAd);

router.post("/", AdvertisementController.storeGoogleFb);

router.patch("/:ad_id", AdvertisementController.showToggle);

router.patch("/googlefb/:ad_id", AdvertisementController.uptGoogleFb);

module.exports = router;
