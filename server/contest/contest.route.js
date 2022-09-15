const express = require("express");
const router = express.Router();

const ContestController = require("./contest.controller");
var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

router.get("/getContest", ContestController.getContest);
router.get("/getContestLive", ContestController.getContestLive);
router.post("/addContest", ContestController.addContest);
router.post("/updateContest", ContestController.updateContest);
router.post("/addCoin", ContestController.addCoin);
router.post("/getEligibleWinner", ContestController.getEligibleWinner);
router.post("/getranker", ContestController.getranker);
router.post("/getContesthistory", ContestController.getContesthistory);
router.post("/getWinnerhistory", ContestController.getWinnerhistory);
router.post("/user_rank", ContestController.getuserRank);
router.post("/getcontestcoin", ContestController.getcontestcoin);
module.exports = router;
