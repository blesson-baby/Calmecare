const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    psychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sessionDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled"
    },
    callStatus: {
      type: String,
      enum: ["idle", "waiting", "live", "ended"],
      default: "idle"
    },
    callStartedAt: {
      type: Date,
      default: null
    },
    callEndedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
