const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
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
    clinicalPsychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session"
    },
    reason: {
      type: String,
      required: true
    },
    comments: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);
