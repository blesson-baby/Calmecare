const Referral = require("../models/referralModel");

// ================= CREATE REFERRAL (AUTO / MANUAL) =================
exports.createReferral = async (req, res) => {
  try {

    const { patient, session, reason } = req.body;

    const referral = await Referral.create({
      patient,
      psychologist: req.user._id,
      session,
      reason,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Referral created",
      data: referral
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= PSYCHOLOGIST RESPONSE =================
exports.respondToReferral = async (req, res) => {
  try {

    const { referralId } = req.params;
    const { status, comments, clinicalPsychologist } = req.body;

    const referral = await Referral.findById(referralId);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found"
      });
    }

    // 🔒 Only psychologist who created it
    if (referral.psychologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // ✔ If approved → must assign clinical doctor
    if (status === "approved" && !clinicalPsychologist) {
      return res.status(400).json({
        success: false,
        message: "Clinical psychologist required"
      });
    }

    referral.status = status;
    referral.comments = comments;
    referral.clinicalPsychologist = clinicalPsychologist;

    await referral.save();

    res.json({
      success: true,
      message: "Referral updated by psychologist",
      data: referral
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= GET REFERRALS =================
exports.getMyReferrals = async (req, res) => {
  try {

    let query = {};

    if (req.user.role === "psychologist") {
      query.psychologist = req.user._id;
    }

    if (req.user.role === "clinicalPsychologist") {
      query.clinicalPsychologist = req.user._id;
    }

    const referrals = await Referral
      .find(query)
      .populate("patient psychologist clinicalPsychologist");

    res.json({
      success: true,
      data: referrals
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= ACCEPT REFERRAL (CLINICAL) =================
exports.acceptReferral = async (req, res) => {
  try {

    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found"
      });
    }

    // 🔒 Only assigned clinical psychologist
    if (
      referral.clinicalPsychologist.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    referral.status = "accepted";
    await referral.save();

    res.json({
      success: true,
      message: "Referral accepted",
      data: referral
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};