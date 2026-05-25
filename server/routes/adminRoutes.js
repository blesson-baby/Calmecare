const express = require("express");
const router = express.Router();

const {
  getPendingDoctors,
  updateDoctorStatus,
  getAssignmentData,
  assignPsychologist
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get(
  "/pending-doctors",
  protect,
  authorizeRoles("admin"),
  getPendingDoctors
);

router.put(
  "/doctor-status/:doctorId",
  protect,
  authorizeRoles("admin"),
  updateDoctorStatus
);

router.get(
  "/assignment-data",
  protect,
  authorizeRoles("admin"),
  getAssignmentData
);

router.post(
  "/assign-psychologist",
  protect,
  authorizeRoles("admin"),
  assignPsychologist
);

module.exports = router;
