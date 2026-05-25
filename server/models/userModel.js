const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"]
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: 6
    },
    role: {
      type: String,
      enum: ["admin", "patient", "psychologist", "clinicalpsychologist"],
      default: "patient"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        if (this.role === "psychologist" || this.role === "clinicalpsychologist") {
          return "pending";
        }
        return "approved";
      }
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    qualification: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true
    },
    experience: {
      type: Number
    },
    certificationName: {
      type: String,
      trim: true
    },
    certificationIssuer: {
      type: String,
      trim: true
    },
    certificationYear: {
      type: Number
    },
    hospitalAffiliation: {
      type: String,
      trim: true
    },
    assignedPsychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assignedClinicalPsychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
