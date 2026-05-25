const SessionProgress = require("../models/sessionProgressModel");

exports.createProgress = async (data) => {
  return await SessionProgress.create(data);
};

exports.findDuplicateProgress = async ({
  session,
  psychologist,
  role,
  moodScore,
  anxietyLevel,
  stressLevel,
  depressionLevel,
  notes,
  createdAfter
}) => {
  return SessionProgress.findOne({
    session,
    psychologist,
    role,
    moodScore,
    anxietyLevel,
    stressLevel,
    depressionLevel,
    notes,
    createdAt: { $gte: createdAfter }
  });
};

exports.getProgressByQuery = async (query) => {
  return await SessionProgress
    .find(query)
    .populate("patient psychologist")
    .sort({ createdAt: 1 });
};

exports.getProgressById = async (progressId) => {
  return SessionProgress.findById(progressId).populate("patient psychologist session");
};

exports.deleteProgressById = async (progressId) => {
  return SessionProgress.findByIdAndDelete(progressId);
};
