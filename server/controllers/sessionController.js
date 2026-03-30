const Session = require("../models/sessionModel");

exports.createSession = async (req, res) => {
  try {

    const { patientId, appointmentId } = req.body;

    const session = await Session.create({
      patient: patientId,
      psychologist: req.user._id,
      appointment: appointmentId
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

    const session = await Session.findById(req.params.sessionId)
      .populate("patient psychologist");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
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

    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      req.body,
      { new: true }
    );

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


exports.cancelSession = async (req, res) => {
  try {

    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { status: "cancelled" },
      { new: true }
    );

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