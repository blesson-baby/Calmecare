const SessionProgress = require("../models/sessionProgressModel");

exports.createProgress = async (data) => {
  return await SessionProgress.create(data);
};

exports.getProgressByQuery = async (query) => {
  return await SessionProgress
    .find(query)
    .populate("patient psychologist")
    .sort({ createdAt: 1 });
};