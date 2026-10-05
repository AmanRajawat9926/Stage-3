export const isUpcomingInterview = (
  interviewRound
) => {
  if (
    !interviewRound?.date
  ) {
    return false;
  }

  const today = new Date();

  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [
    year,
    month,
    day,
  ] = interviewRound.date
    .split('-')
    .map(Number);

  if (!year || !month || !day) {
    return false;
  }

  const interviewUtc = Date.UTC(
    year,
    month - 1,
    day
  );

  const sevenDaysLater =
    todayUtc +
    7 * 24 * 60 * 60 * 1000;

  return (
    interviewUtc >= todayUtc &&
    interviewUtc <= sevenDaysLater
  ); // This excludes interviews exactly 7 days later
};
