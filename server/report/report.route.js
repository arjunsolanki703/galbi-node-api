const express = require("express");
const router = express.Router();

const ReportController = require("./report.controller");

var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

router.get("/", ReportController.reportedUser);

router.get("/:to_user_id", ReportController.reportUser);

router.post("/", ReportController.store);

module.exports = router;
