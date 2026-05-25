const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createSession,
  getSession,
  updateSession,
  cancelSession,
  startCall,
  endCall,
  getActiveSessionForCurrentUser,
  getMySessions
} = require("../controllers/sessionController");

router.get(
  "/mine",
  protect,
  authorizeRoles("patient", "psychologist", "clinicalpsychologist"),
  getMySessions
);

router.get(
  "/active/me",
  protect,
  authorizeRoles("patient", "psychologist", "clinicalpsychologist"),
  getActiveSessionForCurrentUser
);

router.post(
  "/",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  createSession
);

router.get(
  "/:sessionId",
  protect,
  authorizeRoles("patient", "psychologist", "clinicalpsychologist"),
  getSession
);

router.post(
  "/:sessionId/start-call",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  startCall
);

router.post(
  "/:sessionId/end-call",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  endCall
);

router.put(
  "/:sessionId",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  updateSession
);

router.put(
  "/:sessionId/cancel",
  protect,
  authorizeRoles("psychologist", "clinicalpsychologist"),
  cancelSession
);

module.exports = router;
