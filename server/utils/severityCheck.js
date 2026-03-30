exports.checkSeverity = ({ moodScore, anxietyLevel, stressLevel, depressionLevel }) => {
  if (
    anxietyLevel >= 8 ||
    depressionLevel >= 8 ||
    stressLevel >= 9 ||
    moodScore <= 3
  ) {
    return true;
  }
  return false;
};