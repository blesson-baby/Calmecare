const express = require("express");
const router = express.Router();

const {
  addSessionProgress,
  getPatientProgress,
  deleteSessionProgress
} = require("../controllers/sessionProgressController");
const { protect } = require("../middleware/authMiddleware");
const { checkAccessToPatient } = require("../middleware/accessMiddleware");

router.post("/create", protect, addSessionProgress);
router.get("/patient/:patientId", protect,checkAccessToPatient,getPatientProgress);
router.delete("/:progressId", protect, deleteSessionProgress);

module.exports = router;
