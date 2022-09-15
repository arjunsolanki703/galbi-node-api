const Report = require("./report.model");
const User = require("../user/user.model");

//reported user [to user]
exports.reportedUser = async (req, res) => {
  try {
    const report = await Report.aggregate([
      { $group: { _id: "$to_user_id", count: { $sum: 1 } } },
    ]);

    let data = [];

    for (let i = 0; i < report.length; i++) {
      const user = await Report.findOne({ to_user_id: report[i]._id }).populate(
        "to_user_id"
      );
      data.push({
        _id: user.to_user_id._id,
        name: user.to_user_id.name,
        image: user.to_user_id.image,
        username: user.to_user_id.username,
        country: user.to_user_id.country,
        coin: user.to_user_id.coin,
        count: report[i].count,
      });
    }

    return res.status(200).json({ status: true, message: "Success", data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//get list of report user [from user]
exports.reportUser = async (req, res) => {
  try {
    const report = await Report.find({
      to_user_id: req.params.to_user_id,
    }).populate("from_user_id");

    const data = report.map((data) => ({
      _id: data.from_user_id._id,
      name: data.from_user_id.name,
      image: data.from_user_id.image,
      country: data.from_user_id.country,
      username: data.from_user_id.username,
      description: data.description,
    }));

    if (!report) {
      throw new Error();
    }

    return res.status(200).json({ status: true, message: "Success", data });
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
    if (!req.body.from_id)
      return res
        .status(200)
        .json({ status: false, message: "from user id is required" });
    if (!req.body.to_id)
      return res
        .status(200)
        .json({ status: false, message: "to user id is required" });
    if (!req.body.description)
      return res
        .status(200)
        .json({ status: false, message: "description is required" });

    //from means main host user id
    const fromUserExist = await User.findById(req.body.from_id);
    if (!fromUserExist)
      return res
        .status(200)
        .json({ status: false, message: "From User Id is not Exist" });
    const toUserExist = await User.findById(req.body.to_id);
    if (!toUserExist)
      return res
        .status(200)
        .json({ status: false, message: "To User Id is not Exist" });

    const report = new Report();

    report.from_user_id = req.body.from_id;
    report.to_user_id = req.body.to_id;
    report.description = req.body.description;

    await report.save();

    if (!report) {
      throw new Error();
    }

    return res.status(200).json({ status: true, message: "Success" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};
