const Session = require("../models/sessionModel");

exports.getSessionById = async (sessionId) => {
  return await Session.findById(sessionId);
};

exports.verifyDoctorAccess = (session, user) => {
  return session.doctor.toString() === user._id.toString();
};