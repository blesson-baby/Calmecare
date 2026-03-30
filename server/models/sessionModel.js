const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({

  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },

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
  }

}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);