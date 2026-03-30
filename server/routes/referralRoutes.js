const express = require("express");
const router = express.Router();

const {
  createReferral,
  respondToReferral,
  getMyReferrals,
  acceptReferral
} = require("../controllers/referralController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// 🔹 Create referral (auto/manual)
router.post(
  "/",
  protect,
  authorizeRoles("psychologist"),
  createReferral
);


// 🔹 Psychologist responds (approve/reject)
router.put(
  "/respond/:referralId",
  protect,
  authorizeRoles("psychologist"),
  respondToReferral
);


// 🔹 Get referrals (psychologist / clinical)
router.get(
  "/my",
  protect,
  authorizeRoles("psychologist", "clinicalPsychologist"),
  getMyReferrals
);


// 🔹 Clinical accepts referral
router.put(
  "/accept/:id",
  protect,
  authorizeRoles("clinicalPsychologist"),
  acceptReferral
);

module.exports = router;