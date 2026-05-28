const express = require("express");
const router = express.Router();

const {
  createReferral,
  respondToReferral,
  getMyReferrals,
  acceptReferral,
  getAvailableClinicalPsychologists
} = require("../controllers/referralController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/", protect, authorizeRoles("psychologist"), createReferral);

router.get(
  "/clinical-options",
  protect,
  authorizeRoles("psychologist"),
  getAvailableClinicalPsychologists
);

router.put(
  "/respond/:referralId",
  protect,
  authorizeRoles("clinicalpsychologist"),
  respondToReferral
);

router.get(
  "/my",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  getMyReferrals
);

router.put(
  "/accept/:id",
  protect,
  authorizeRoles("clinicalpsychologist"),
  acceptReferral
);

module.exports = router;
