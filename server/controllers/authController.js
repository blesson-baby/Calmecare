const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register user
exports.registerUser = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;
     if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration not allowed"
      });
    }
    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password:hashedPassword,
      role
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// login user
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
    const token = jwt.sign(
     { id: user._id, role: user.role },
     process.env.JWT_SECRET,
     { expiresIn: "7d" }
     );
    user.password = undefined;

    const userData = {
     id: user._id,
     name: user.name,
     email: user.email,
     role: user.role
     };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user:userData
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// docter registration
exports.registerDoctor = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      licenseNumber,
      qualification,
      specialization,
      experience
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "psychologist",
      licenseNumber,
      qualification,
      specialization,
      experience,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Doctor registered. Waiting for admin approval",
      doctor
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};