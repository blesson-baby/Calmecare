const Session = require("../models/sessionModel");

exports.getSessionById = async (sessionId) => {
  return Session.findById(sessionId);
};

exports.verifyDoctorAccess = (session, user, patient) => {
  if (session.psychologist?.toString() === user._id.toString()) {
    return true;
  }

  return (
    user.role === "clinicalpsychologist" &&
    patient?.assignedClinicalPsychologist?.toString() === user._id.toString()
  );
};
