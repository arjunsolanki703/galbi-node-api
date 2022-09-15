//VIP plan

const VIPPlan = require("./VIPplan.model");

exports.index = async (req, res) => {
  try {
    const plan = await VIPPlan.find().sort({ createdAt: -1 });

    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "VIP Plan not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "Success", data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//payment gateway wise VIP plan list
exports.show = async (req, res) => {
  try {
    const plan = await VIPPlan.find()
      .where({ isActive: true })
      .sort({ createdAt: -1 });

    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "VIP Plan not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "Success", data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.store = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details" });
    if (!req.body.time)
      return res
        .status(200)
        .json({ status: false, message: "Time is required" });
    if (!req.body.price)
      return res
        .status(200)
        .json({ status: false, message: "Price is required" });
    if (!req.body.paymentGateway)
      return res
        .status(200)
        .json({ status: false, message: "Payment Gateway is required" });
    if (!req.body.productId)
      return res
        .status(200)
        .json({ status: false, message: "google product id is required" });

    const plan = new VIPPlan();

    plan.time = req.body.time;
    plan.price = req.body.price;
    plan.discount = req.body.discount;
    plan.productId = req.body.productId;
    plan.paymentGateway = req.body.paymentGateway;

    await plan.save();

    if (!plan) {
      throw new Error();
    }

    return res
      .status(200)
      .json({ status: true, message: "Success", data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid details" });
    if (!req.body.time)
      return res
        .status(200)
        .json({ status: false, message: "time is required" });
    if (!req.body.price)
      return res
        .status(200)
        .json({ status: false, message: "price is required" });
    if (!req.body.paymentGateway)
      return res
        .status(200)
        .json({ status: false, message: "Payment Gateway is required" });
    if (!req.body.productId)
      return res
        .status(200)
        .json({ status: false, message: "google product id is required" });

    const plan = await VIPPlan.findById(req.params.plan_id);

    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "VIP Plan not found" });
    }

    plan.time = req.body.time;
    plan.price = req.body.price;
    plan.discount = req.body.discount;
    plan.productId = req.body.productId;
    plan.paymentGateway = req.body.paymentGateway;

    await plan.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const plan = await VIPPlan.findById(req.params.plan_id);
    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: "VIP Plan not found" });
    }

    await plan.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: "success", result: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//active inactive plan
exports.activePlan = async (req, res) => {
  try {
    const plan = await VIPPlan.findById(req.params.plan_id);
    if (!plan) {
      return res.status(200).json({ status: false, message: "plan not found" });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
