const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");

const HostController = require("./host.controller");

const upload = multer({
  storage,
});

var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

//get list of host
router.get("/", HostController.index);

//random host for match [android]
router.get("/random", HostController.randomHost);

//accept or unAccept user request for becoming host
router.get("/enableDisable/:host_id", HostController.enableDisableHost);

//create user request for becoming host
router.post("/", upload.single("image"), HostController.store);

//host is online
router.post("/online", HostController.hostIsOnline);

//host is live
router.post("/live", HostController.hostIsLive);

//host is live
router.get("/unlive", HostController.hostIsUnLive);

//host is offline
router.get("/offline", HostController.hostIsOffline);

//host is busy (connect call)
router.get("/connect", HostController.hostIsBusy);

//host is free (disconnect call)
router.get("/disconnect", HostController.hostIsFree);
// Join Request
router.post("/request",HostController.joinrequest)

//accept reject reqest
router.post("/request_type",HostController.Requesttype)

router.post("/completeContest", HostController.completeContest)

module.exports = router;
