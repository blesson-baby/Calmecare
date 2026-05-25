const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const doctorRoles = ["psychologist", "clinicalpsychologist"];
const buildSafeUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  qualification: user.qualification,
  specialization: user.specialization,
  experience: user.experience,
  certificationName: user.certificationName,
  certificationIssuer: user.certificationIssuer,
  certificationYear: user.certificationYear,
  hospitalAffiliation: user.hospitalAffiliation
});

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      licenseNumber,
      qualification,
      specialization,
      experience,
      certificationName,
      certificationIssuer,
      certificationYear,
      hospitalAffiliation
    } = req.body;

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration not allowed"
      });
    }

    if (doctorRoles.includes(role)) {
      const missingDoctorFields = [
        ["licenseNumber", licenseNumber],
        ["qualification", qualification],
        ["specialization", specialization],
        ["experience", experience],
        ["certificationName", certificationName],
        ["certificationIssuer", certificationIssuer],
        ["certificationYear", certificationYear]
      ].filter(([, value]) => value === undefined || value === null || value === "");

      if (missingDoctorFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing professional details: ${missingDoctorFields
            .map(([field]) => field)
            .join(", ")}`
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber: doctorRoles.includes(role) ? licenseNumber : undefined,
      qualification: doctorRoles.includes(role) ? qualification : undefined,
      specialization: doctorRoles.includes(role) ? specialization : undefined,
      experience: doctorRoles.includes(role) ? Number(experience) : undefined,
      certificationName: doctorRoles.includes(role) ? certificationName : undefined,
      certificationIssuer: doctorRoles.includes(role) ? certificationIssuer : undefined,
      certificationYear: doctorRoles.includes(role) ? Number(certificationYear) : undefined,
      hospitalAffiliation: doctorRoles.includes(role) ? hospitalAffiliation : undefined
    });

    res.status(201).json({
      success: true,
      message: doctorRoles.includes(role)
        ? "Doctor registration submitted successfully and is pending review"
        : "User registered successfully",
      user: buildSafeUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (doctorRoles.includes(user.role) && user.status !== "approved") {
      const message =
        user.status === "rejected"
          ? "Your registration was rejected. Please contact the administrator."
          : "Your account is pending admin approval. You cannot log in yet.";

      return res.status(403).json({
        success: false,
        message
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: buildSafeUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "psychologist",
      licenseNumber,
      qualification,
      specialization,
      experience,
      certificationName,
      certificationIssuer,
      certificationYear,
      hospitalAffiliation
    } = req.body;

    if (!doctorRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor role"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber,
      qualification,
      specialization,
      experience: Number(experience),
      certificationName,
      certificationIssuer,
      certificationYear: Number(certificationYear),
      hospitalAffiliation,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Doctor registered. Waiting for admin approval",
      doctor: buildSafeUserResponse(doctor)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
