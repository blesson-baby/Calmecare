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

const validateDoctorFields = ({
  licenseNumber,
  qualification,
  specialization,
  experience,
  certificationName,
  certificationIssuer,
  certificationYear
}) => {
  const missingDoctorFields = [
    ["licenseNumber", licenseNumber],
    ["qualification", qualification],
    ["specialization", specialization],
    ["experience", experience],
    ["certificationName", certificationName],
    ["certificationIssuer", certificationIssuer],
    ["certificationYear", certificationYear]
  ].filter(([, value]) => value === undefined || value === null || value === "");

  return missingDoctorFields.map(([field]) => field);
};

const createUserFromRegistration = async ({
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
  hospitalAffiliation,
  pendingDoctorApproval = false
}) => {
  if (role === "admin") {
    const error = new Error("Admin registration not allowed");
    error.statusCode = 403;
    throw error;
  }

  if (doctorRoles.includes(role)) {
    const missingFields = validateDoctorFields({
      licenseNumber,
      qualification,
      specialization,
      experience,
      certificationName,
      certificationIssuer,
      certificationYear
    });

    if (missingFields.length > 0) {
      const error = new Error(`Missing professional details: ${missingFields.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return User.create({
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
    hospitalAffiliation: doctorRoles.includes(role) ? hospitalAffiliation : undefined,
    status: pendingDoctorApproval && doctorRoles.includes(role) ? "pending" : undefined
  });
};

const handleRegistration = async (req, res, options = {}) => {
  try {
    const user = await createUserFromRegistration({
      ...req.body,
      ...options
    });

    const responseKey = options.responseKey || "user";

    res.status(201).json({
      success: true,
      message:
        options.successMessage ||
        (doctorRoles.includes(user.role)
          ? "Doctor registration submitted successfully and is pending review"
          : "User registered successfully"),
      [responseKey]: buildSafeUserResponse(user)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

exports.registerUser = (req, res) => handleRegistration(req, res);

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

exports.registerDoctor = (req, res) => {
  const { role = "psychologist" } = req.body;

  if (!doctorRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid doctor role"
    });
  }

  return handleRegistration(req, res, {
    role,
    pendingDoctorApproval: true,
    responseKey: "doctor",
    successMessage: "Doctor registered. Waiting for admin approval"
  });
};
