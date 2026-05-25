const User = require("../models/userModel");

exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: { $in: ["psychologist", "clinicalpsychologist"] },
      status: "pending"
    }).select("-password");

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected"
      });
    }

    const doctor = await User.findById(doctorId);

    if (
      !doctor ||
      !["psychologist", "clinicalpsychologist"].includes(doctor.role)
    ) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    doctor.status = status;
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${status} successfully`,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssignmentData = async (req, res) => {
  try {
    const [patients, psychologists, clinicalPsychologists] = await Promise.all([
      User.find({ role: "patient" })
        .select("-password")
        .populate("assignedPsychologist assignedClinicalPsychologist", "name email"),
      User.find({ role: "psychologist", status: "approved" }).select("-password"),
      User.find({ role: "clinicalpsychologist", status: "approved" }).select("-password")
    ]);

    res.json({
      success: true,
      data: {
        patients,
        psychologists,
        clinicalPsychologists
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignPsychologist = async (req, res) => {
  try {
    const { patientId, psychologistId } = req.body;

    const patient = await User.findById(patientId);
    const doctor = await User.findById(psychologistId);

    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ message: "Invalid patient" });
    }

    if (
      !doctor ||
      doctor.role !== "psychologist" ||
      doctor.status !== "approved"
    ) {
      return res.status(400).json({ message: "Invalid psychologist" });
    }

    patient.assignedPsychologist = psychologistId;
    patient.assignedClinicalPsychologist = null;
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
