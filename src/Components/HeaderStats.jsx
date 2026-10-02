import { useMemo } from 'react';

import {
  ROUNDS,
  getDerivedRound,
  countStaleApplications,
  countUpcomingInterviews,
} from '../Utils/helpers';

function HeaderStats({ applications = [] }) {
  const { counts, staleCount, upcomingInterviews } = useMemo(() => {
    const initialCounts = ROUNDS.reduce((acc, round) => {
      acc[round] = 0;
      return acc;
    }, {});

    applications.forEach((app) => {
      const currentRound = getDerivedRound(app);

      if (initialCounts[currentRound] !== undefined) {
        initialCounts[currentRound] += 1;
      }
    });

    return {
      counts: initialCounts,
      staleCount: countStaleApplications(applications),
      upcomingInterviews: typeof countUpcomingInterviews === 'function' 
        ? countUpcomingInterviews(applications) 
        : 0,
    };
  }, [applications]);

  return (
    <section
      className="header-stats"
      aria-label="Pipeline overview summary statistics"
    >
      <ul className="stats-list" role="list">
        <li className="stat-card total">
          <span className="stat-label">Total</span>
          <span className="stat-count">{applications.length}</span>
        </li>

        {ROUNDS.map((round) => {
          const classNameSlug = round.toLowerCase().replace(/\s+/g, '-');

          return (
            <li
              key={round}
              className={`stat-card stat-${classNameSlug}`}
            >
              <span className="stat-label">{round}</span>
              <span className="stat-count">{counts[round] || 0}</span>
            </li>
          );
        })}

        <li className="stat-card stat-stale">
          <span className="stat-label">Stale (&gt;14d)</span>
          <span className="stat-count">{staleCount}</span>
        </li>

        <li className="stat-card stat-upcoming">
          <span className="stat-label">Interviews (Next 7 Days)</span>
          <span className="stat-count">{upcomingInterviews}</span>
        </li>
      </ul>
    </section>
  );
}

export default HeaderStats;