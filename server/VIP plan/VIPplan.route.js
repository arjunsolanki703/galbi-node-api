//VIP plan

const express = require("express");
const router = express.Router();

const PlanController = require("./VIPplan.controller");

var checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

router.get("/", PlanController.index);

//payment gateway wise plan list
router.get("/paymentgateway", PlanController.show);

//active inactive plan
router.get("/active/:plan_id", PlanController.activePlan);

router.post("/", PlanController.store);

router.patch("/:plan_id", PlanController.update);

router.delete("/:plan_id", PlanController.destroy);

module.exports = router;
