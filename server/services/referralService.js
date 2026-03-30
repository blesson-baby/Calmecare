const Referral = require("../models/referralModel");

exports.createAutoReferral = async ({ patient, psychologist, session }) => {
  return await Referral.create({
    patient,
    psychologist,
    session,
    reason: "High severity detected",
    status: "pending"
  });
};

exports.updateReferralStatus = async (referralId, data) => {
  return await Referral.findByIdAndUpdate(referralId, data, {
    new: true
  });
};