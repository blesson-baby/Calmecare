const express = require("express");
const router = express.Router();

const {
  assignPsychologist,
  assignClinicalPsychologist
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Only admin can assign
router.post("/assign-psychologist",
  protect,
  authorizeRoles("admin"),
  assignPsychologist
);

router.post("/assign-clinical",
  protect,
  authorizeRoles("admin"),
  assignClinicalPsychologist
);

module.exports = router;