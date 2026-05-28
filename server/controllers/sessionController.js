const Session = require("../models/sessionModel");
const User = require("../models/userModel");

const getIdString = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const canAccessSession = (session, user) => {
  const userId = user._id.toString();

  return (
    getIdString(session.psychologist) === userId ||
    getIdString(session.patient) === userId
  );
};

exports.createSession = async (req, res) => {
  try {
    const { patientId } = req.body;

    const patient = await User.findById(patientId);

    if (!patient || patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Invalid patient"
      });
    }

    const isPsychologist = req.user.role === "psychologist";
    const isClinicalPsychologist = req.user.role === "clinicalpsychologist";

    if (
      isPsychologist &&
      patient.assignedPsychologist?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this patient"
      });
    }

    if (
      isPsychologist &&
      patient.assignedClinicalPsychologist
    ) {
      return res.status(403).json({
        success: false,
        message: "Case transferred to clinical psychologist"
      });
    }

    if (
      isClinicalPsychologist &&
      patient.assignedClinicalPsychologist?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This referred patient is not assigned to you"
      });
    }

    const session = await Session.create({
      patient: patient._id,
      psychologist: req.user._id
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId).populate(
      "patient psychologist"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (!canAccessSession(session, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this session"
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.psychologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this session"
      });
    }

    const allowedUpdates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "notes")) {
      if (session.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Session notes can only be added after the consultation is completed"
        });
      }

      allowedUpdates.notes = req.body.notes;
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      allowedUpdates,
      { new: true }
    );

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.psychologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this session"
      });
    }

    session.status = "cancelled";
    await session.save();

    res.json({
      success: true,
      message: "Session cancelled",
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.startCall = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId).populate(
      "patient psychologist",
      "name email role"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.psychologist._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to start this call"
      });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled sessions cannot start a call"
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed sessions cannot start a new call"
      });
    }

    session.callStatus = "waiting";
    session.callStartedAt = new Date();
    session.callEndedAt = null;
    await session.save();

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.endCall = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId).populate(
      "patient psychologist",
      "name email role"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.psychologist._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to end this call"
      });
    }

    session.callStatus = "ended";
    session.callEndedAt = new Date();
    session.status = "completed";
    await session.save();

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveSessionForCurrentUser = async (req, res) => {
  try {
    const query =
      req.user.role === "patient"
        ? { patient: req.user._id }
        : { psychologist: req.user._id };

    const session = await Session.findOne({
      ...query,
      status: { $ne: "cancelled" },
      callStatus: { $in: ["waiting", "live"] }
    })
      .populate("patient psychologist", "name email role")
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const query =
      req.user.role === "patient"
        ? { patient: req.user._id }
        : { psychologist: req.user._id };

    if (
      (req.user.role === "psychologist" ||
        req.user.role === "clinicalpsychologist") &&
      req.query.patientId
    ) {
      query.patient = req.query.patientId;
    }

    const sessions = await Session.find(query)
      .populate("patient psychologist", "name email role")
      .sort({ sessionDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
