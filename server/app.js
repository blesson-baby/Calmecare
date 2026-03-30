const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS (IMPORTANT)
app.use(cors());

// ✅ Body parser
app.use(express.json());

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const sessionRoutes = require("./routes/sessionRoutes");
app.use("/api/sessions", sessionRoutes);

const sessionProgressRoutes = require("./routes/sessionProgressRoutes");
app.use("/api/session-progress", sessionProgressRoutes);

const referralRoutes = require("./routes/referralRoutes");
app.use("/api/referrals", referralRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.json({ message: "CalmCare API is running" });
});

module.exports = app;


