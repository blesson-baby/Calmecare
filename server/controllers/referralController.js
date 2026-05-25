const Referral = require("../models/referralModel");
const User = require("../models/userModel");
const Session = require("../models/sessionModel");

exports.createReferral = async (req, res) => {
  try {
    const { patient, session, reason, clinicalPsychologist } = req.body;

    if (!patient || !session || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Patient, session, and referral reason are required"
      });
    }

    if (!clinicalPsychologist) {
      return res.status(400).json({
        success: false,
        message: "Please choose a clinical psychologist before creating a referral"
      });
    }

    const patientRecord = await User.findById(patient);

    if (!patientRecord || patientRecord.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Invalid patient selected for referral"
      });
    }

    if (
      patientRecord.assignedPsychologist?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only refer patients assigned to you"
      });
    }

    if (patientRecord.assignedClinicalPsychologist) {
      return res.status(400).json({
        success: false,
        message: "This patient has already been transferred to a clinical psychologist"
      });
    }

    const sessionRecord = await Session.findById(session);

    if (!sessionRecord) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (sessionRecord.psychologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only refer from your own sessions"
      });
    }

    if (sessionRecord.patient.toString() !== patientRecord._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected patient does not match this session"
      });
    }

    if (sessionRecord.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Referrals can only be created after the session is completed"
      });
    }

    const existingReferral = await Referral.findOne({
      patient,
      session,
      status: "pending"
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: "A pending referral already exists for this session"
      });
    }

    const recommendedDoctor = await User.findOne({
      _id: clinicalPsychologist,
      role: "clinicalpsychologist",
      status: "approved"
    });

    if (!recommendedDoctor) {
      return res.status(400).json({
        success: false,
        message: "Selected clinical psychologist is not available for referrals"
      });
    }

    const referral = await Referral.create({
      patient,
      psychologist: req.user._id,
      clinicalPsychologist: clinicalPsychologist || null,
      session,
      reason: reason.trim(),
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

exports.getAvailableClinicalPsychologists = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "clinicalpsychologist",
      status: "approved"
    }).select("name email specialization qualification");

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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

    if (req.user.role === "psychologist") {
      if (referral.psychologist.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized"
        });
      }

      if (status === "accepted" && !clinicalPsychologist) {
        return res.status(400).json({
          success: false,
          message: "Clinical psychologist required"
        });
      }

      referral.status = status;
      referral.comments = comments;
      referral.clinicalPsychologist = clinicalPsychologist || null;
    }

    if (req.user.role === "clinicalpsychologist") {
      if (
        referral.clinicalPsychologist &&
        referral.clinicalPsychologist.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized"
        });
      }

      referral.status = status;
      referral.comments = comments;
      referral.clinicalPsychologist = req.user._id;

      if (status === "rejected") {
        await referral.save();

        return res.json({
          success: true,
          message: "Referral rejected",
          data: referral
        });
      }
    }

    await referral.save();

    res.json({
      success: true,
      message: "Referral updated",
      data: referral
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyReferrals = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "psychologist") {
      query.psychologist = req.user._id;
    }

    if (req.user.role === "clinicalpsychologist") {
      query = {
        $or: [
          { clinicalPsychologist: req.user._id },
          { clinicalPsychologist: null, status: "pending" }
        ]
      };
    }

    const referrals = await Referral.find(query).populate(
      "patient psychologist clinicalPsychologist"
    );

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

exports.acceptReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found"
      });
    }

    if (
      referral.clinicalPsychologist &&
      referral.clinicalPsychologist.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (referral.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending referrals can be accepted"
      });
    }

    referral.clinicalPsychologist = req.user._id;
    referral.status = "accepted";
    await referral.save();

    await User.findByIdAndUpdate(referral.patient, {
      assignedPsychologist: null,
      assignedClinicalPsychologist: req.user._id
    });

    res.json({
      success: true,
      message: "Referral accepted and case transferred",
      data: referral
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
