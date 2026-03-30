const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { createSession,getSession,updateSession,cancelSession } = require("../controllers/sessionController");

router.post(
  "/add-progress",
  protect,
  authorizeRoles("psychologist", "clinical_psychologist"),
  createSession,getSession,updateSession,cancelSession
);

module.exports = router;