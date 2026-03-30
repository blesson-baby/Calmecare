const { getSessionById, verifyDoctorAccess } = require("../services/sessionService");
const { createProgress, getProgressByQuery } = require("../services/progressService");
const { checkSeverity } = require("../utils/severityCheck");
const Referral = require("../models/referralModel");

exports.createAutoReferral = async ({ patient, psychologist, session }) => {
  return await Referral.create({
    patient,
    psychologist,
    session,
    reason: "High severity detected",
    status: "pending"
  });
};

exports.updateReferralStatus = async (referralId, data) => {
  return await Referral.findByIdAndUpdate(referralId, data, {
    new: true
  });
};


// ================= ADD SESSION PROGRESS =================

exports.addSessionProgress = async (req, res) => {
  try {

    const {
      sessionId,
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel,
      notes
    } = req.body;

    // 🔒 Role check
    if (
      req.user.role !== "psychologist" &&
      req.user.role !== "clinicalPsychologist"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can add session progress"
      });
    }

    // 🔍 Get session
    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // 🔒 Ownership check
    const hasAccess = verifyDoctorAccess(session, req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this session"
      });
    }

    // 🧠 Severity detection
    const warningTriggered = checkSeverity({
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel
    });

    // 💾 Save progress
    const progress = await createProgress({
      session: sessionId,
      patient: session.patient,
      psychologist: req.user._id,
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel,
      notes,
      warningTriggered
    });
    // 🚨 AUTO REFERRAL TRIGGER
    if (warningTriggered) {
    await createAutoReferral({
    patient: session.patient,
    psychologist: req.user._id,
    session: sessionId
    });
    }

    res.status(201).json({
      success: true,
      message: warningTriggered
        ? "Severe condition detected. Consider referral."
        : "Session progress saved",
      data: progress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= GET PATIENT PROGRESS =================

exports.getPatientProgress = async (req, res) => {
  try {

    const patientId = req.params.patientId;

    // 🔒 Patient can only see their own data
    if (
      req.user.role === "patient" &&
      req.user._id.toString() !== patientId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    let query = { patient: patientId };

    // 🔒 Psychologist sees only their records
    if (req.user.role === "psychologist") {
      query.psychologist = req.user._id;
    }

    // 🔍 Get data from service
    const progress = await getProgressByQuery(query);

    if (!progress.length) {
      return res.json({
        success: true,
        message: "No session progress found for this patient",
        data: []
      });
    }

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};