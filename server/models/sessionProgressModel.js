const mongoose = require("mongoose");

const sessionProgressSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  role: {
    type: String,
    enum: ["psychologist", "clinical"],
    required: true
  },

  moodScore: Number,
  anxietyLevel: Number,
  stressLevel: Number,
  depressionLevel: Number,

  notes: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("SessionProgress", sessionProgressSchema);