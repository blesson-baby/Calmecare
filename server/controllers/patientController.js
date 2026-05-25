const User = require("../models/userModel");

exports.getMyPatients = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "psychologist") {
      query.assignedPsychologist = req.user._id;
    } else if (req.user.role === "clinicalpsychologist") {
      query.assignedClinicalPsychologist = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: "Only doctors can view assigned patients"
      });
    }

    const patients = await User.find({
      ...query,
      role: "patient"
    }).select("-password");

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
