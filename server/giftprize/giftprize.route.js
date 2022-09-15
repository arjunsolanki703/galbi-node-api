const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({
  storage
});

const giftprizeController = require("./giftprize.controller");

var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());
router.get("/getprize", giftprizeController.getprize);
router.post("/Addprize", giftprizeController.Addprize);
router.post("/giftprizestore", upload.any(), giftprizeController.GiftPrizeStore);
router.patch("/giftprizeupdate/:giftprize_id", upload.single("image_url"), giftprizeController.GiftPrizeUpdate);
router.get("/getgiftprize", giftprizeController.GetGiftPrize);
// router.delete("deletegiftprize/:giftprize_id", giftprizeController.DeleteGiftPrize);
// router.delete("/:gift_id", GiftController.destroy);
router.delete("/deletegiftprize/:gift_id", giftprizeController.destroy);
router.delete("/deletegiftprizeall/:gift_id", giftprizeController.destroyAll);

router.get("/", giftprizeController.index);
router.get("/getranker", giftprizeController.getranker);
router.get("/FilterGiftprize",giftprizeController.FilterGiftprize);
module.exports = router;
