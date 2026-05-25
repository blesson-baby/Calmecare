const {
  getSessionById,
  verifyDoctorAccess
} = require("../services/sessionService");
const {
  createProgress,
  getProgressByQuery,
  findDuplicateProgress,
  getProgressById,
  deleteProgressById
} = require("../services/progressService");
const { checkSeverity } = require("../utils/severityCheck");
const User = require("../models/userModel");

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

    if (
      req.user.role !== "psychologist" &&
      req.user.role !== "clinicalpsychologist"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can add session progress"
      });
    }

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    const patient = await User.findById(session.patient);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (
      patient.assignedClinicalPsychologist &&
      req.user.role === "psychologist"
    ) {
      return res.status(403).json({
        success: false,
        message: "Case transferred to clinical psychologist"
      });
    }

    const hasAccess = verifyDoctorAccess(session, req.user, patient);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this session"
      });
    }

    if (session.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Progress can only be added after the consultation is completed"
      });
    }

    const warningTriggered = checkSeverity({
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel
    });

    const duplicateProgress = await findDuplicateProgress({
      session: sessionId,
      psychologist: req.user._id,
      role: req.user.role,
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel,
      notes: notes || "",
      createdAfter: new Date(Date.now() - 30000)
    });

    if (duplicateProgress) {
      return res.status(409).json({
        success: false,
        message: "This progress entry looks like a duplicate from a recent click, so it was not saved again."
      });
    }

    const progress = await createProgress({
      session: sessionId,
      patient: session.patient,
      psychologist: req.user._id,
      role: req.user.role,
      moodScore,
      anxietyLevel,
      stressLevel,
      depressionLevel,
      notes,
      warningTriggered
    });

    res.status(201).json({
      success: true,
      message: warningTriggered
        ? "Severe condition detected. Review the warning and decide whether to refer this patient."
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

exports.deleteSessionProgress = async (req, res) => {
  try {
    if (
      req.user.role !== "psychologist" &&
      req.user.role !== "clinicalpsychologist"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can delete session progress"
      });
    }

    const progress = await getProgressById(req.params.progressId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress entry not found"
      });
    }

    const patient = await User.findById(progress.patient);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    const hasAccess = verifyDoctorAccess(progress.session, req.user, patient);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this progress entry"
      });
    }

    await deleteProgressById(progress._id);

    res.json({
      success: true,
      message: "Progress entry deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPatientProgress = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    if (
      req.user.role === "patient" &&
      req.user._id.toString() !== patientId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const query = { patient: patientId };

    if (req.user.role === "psychologist") {
      query.psychologist = req.user._id;
    }

    const progress = await getProgressByQuery(query);

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
