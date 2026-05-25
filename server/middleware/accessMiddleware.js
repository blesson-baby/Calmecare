const User = require("../models/userModel");

exports.checkAccessToPatient = async (req, res, next) => {
  try {
    const patientId = req.params.patientId;
    const patient = await User.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({ message: "Not a patient" });
    }

    if (
      req.user.role === "patient" &&
      req.user._id.toString() === patient._id.toString()
    ) {
      return next();
    }

    if (
      req.user.role === "psychologist" &&
      patient.assignedPsychologist?.toString() === req.user._id.toString()
    ) {
      return next();
    }

    if (
      req.user.role === "clinicalpsychologist" &&
      patient.assignedClinicalPsychologist?.toString() === req.user._id.toString()
    ) {
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
