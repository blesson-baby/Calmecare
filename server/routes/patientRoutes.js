const express = require("express");
const router = express.Router();

const { getMyPatients } = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get(
  "/my",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  getMyPatients
);

module.exports = router;
