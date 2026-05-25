const mongoose = require("mongoose");

const sessionProgressSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
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
    role: {
      type: String,
      enum: ["psychologist", "clinicalpsychologist"],
      required: true
    },
    moodScore: Number,
    anxietyLevel: Number,
    stressLevel: Number,
    depressionLevel: Number,
    notes: String,
    warningTriggered: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SessionProgress", sessionProgressSchema);
