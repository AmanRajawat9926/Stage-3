import {
  ROUNDS,
  getDerivedRound,
  countStaleApplications,
  countUpcomingInterviews,
} from '../Utils/helpers';

function HeaderStats({ applications }) {
  const counts = ROUNDS.reduce((acc, round) => {
    acc[round] = 0;
    return acc;
  }, {});

  applications.forEach((app) => {
    const currentRound = getDerivedRound(app);

    if (counts[currentRound] !== undefined) {
      counts[currentRound] += 1;
    }
  });

  const staleCount =
    countStaleApplications(applications);

  const upcomingInterviews =
    countUpcomingInterviews(applications);

  return (
    <section
      className="header-stats"
      aria-label="Pipeline overview"
    >
      <div className="stat-card total">
        <span className="stat-label">Total</span>

        <span className="stat-count">
          {applications.length}
        </span>
      </div>

      {ROUNDS.map((round) => (
        <div
          key={round}
          className={`stat-card stat-${round.toLowerCase()}`}
        >
          <span className="stat-label">{round}</span>

          <span className="stat-count">
            {counts[round]}
          </span>
        </div>
      ))}

      <div className="stat-card stat-stale">
        <span className="stat-label">Stale</span>

        <span className="stat-count">
          {staleCount}
        </span>
      </div>

      <div className="stat-card stat-upcoming">
        <span className="stat-label">
          Interviews Next 7 Days
        </span>

        <span className="stat-count">
          {upcomingInterviews}
        </span>
      </div>
    </section>
  );
}

export default HeaderStats;