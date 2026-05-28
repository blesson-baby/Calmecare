const Referral = require("../models/referralModel");

exports.createAutoReferral = async ({
  patient,
  psychologist,
  session,
  clinicalPsychologist
}) => {
  return await Referral.create({
    patient,
    psychologist,
    clinicalPsychologist: clinicalPsychologist || null,
    session,
    reason: "High severity detected",
    status: "pending"
  });
};
