const Advertisement = require("./advertisement.model");

exports.storeGoogleFb = async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details" });

    const GoogleFb = new Advertisement();

    GoogleFb.native = req.body.native;
    GoogleFb.reward = req.body.reward;
    GoogleFb.interstitial = req.body.interstitial;
    GoogleFb.type = req.body.type;

    await GoogleFb.save();

    if (!GoogleFb) {
      throw new Error();
    }
    return res.status(200).json({
      status: true,
      message: "success",
      data: GoogleFb,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.uptGoogleFb = async (req, res) => {
  try {
    const googleFb = await Advertisement.findOne({ _id: req.params.ad_id });

    if (!googleFb)
      return res.status(200).json({
        status: false,
        message: "Advertisement does not Exist",
      });

    if (req.body.native) {
      googleFb.native = req.body.native;
    }

    if (req.body.reward) {
      googleFb.reward = req.body.reward;
    }
    if (req.body.interstitial) {
      googleFb.interstitial = req.body.interstitial;
    }

    await googleFb.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: googleFb });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

exports.showToggle = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.ad_id);

    if (!advertisement) {
      return res.status(200).send({
        status: false,
        message: "Advertisement does not exist",
      });
    }

    advertisement.show = !advertisement.show;
    await advertisement.save();

    return res
      .status(200)
      .json({ status: true, message: "success", data: advertisement });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};

//for android and backend
exports.googleFacebookAd = async (req, res) => {
  try {
    const add = await Advertisement.find({
      $or: [{ type: "google" }, { type: "facebook" }],
    });

    if (!add) {
      return res.status(200).json({ status: false, message: "not found" });
    }

    const data = add.map((ad) => ({
      [ad.type]: { ...ad._doc },
    }));
    return res.status(200).json({
      status: true,
      message: "Success",
      ...data[0],
      ...data[1],
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
