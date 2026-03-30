const User = require("../models/userModel");

// Assign psychologist
exports.assignPsychologist = async (req, res) => {
  try {
    const { patientId, psychologistId } = req.body;

    const patient = await User.findById(patientId);
    const doctor = await User.findById(psychologistId);

    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ message: "Invalid patient" });
    }

    if (!doctor || doctor.role !== "psychologist") {
      return res.status(400).json({ message: "Invalid psychologist" });
    }

    patient.assignedPsychologist = psychologistId;
    await patient.save();

    res.json({
      success: true,
      message: "Psychologist assigned successfully",
      data: patient
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign clinical psychologist (after referral)
exports.assignClinicalPsychologist = async (req, res) => {
  try {
    const { patientId, clinicalId } = req.body;

    const patient = await User.findById(patientId);
    const doctor = await User.findById(clinicalId);

    if (!doctor || doctor.role !== "clinicalPsychologist") {
      return res.status(400).json({ message: "Invalid clinical psychologist" });
    }

    patient.assignedClinicalPsychologist = clinicalId;
    await patient.save();

    res.json({
      success: true,
      message: "Clinical psychologist assigned",
      data: patient
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};