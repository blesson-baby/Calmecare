const Patient = require("../models/userModel");

exports.checkAccessToPatient = async (req, res, next) => {
  try {
    const patientId = req.params.patientId;

    const patient = await user.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
     if (patient.role !== "patient") {
      return res.status(400).json({ message: "Not a patient" });
    }

    // Patient can access their own data
    if (
      req.user.role === "patient" &&
      req.user._id.toString() === patient._id.toString()
    ) {
      return next();
    }

    // Assigned psychologist
    if (
      req.user.role === "psychologist" &&
      patient.assignedPsychologist?.toString() === req.user._id.toString()
    ) {
      return next();
    }

    // Assigned clinical psychologist
    if (
      req.user.role === "clinicalPsychologist" &&
      patient.assignedClinicalPsychologist?.toString() === req.user._id.toString()
    ) {
      return next();
    }

    return res.status(403).json({ message: "Access denied" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};