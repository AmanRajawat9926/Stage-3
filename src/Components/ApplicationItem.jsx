import {
  calculateDaysSinceApplied,
  isApplicationStale,
  formatUrl,
  getDerivedRound,
} from '../Utils/helpers';

function ApplicationItem({
  application,
  onEdit,
  onDelete,
}) {
  const currentRound =
    getDerivedRound(application);

  const daysSince =
    calculateDaysSinceApplied(
      application.appliedDate
    );

  const isStale =
    isApplicationStale(application);

  const hrefUrl =
    formatUrl(application.jobLink);

  const sortedHistory =
    Array.isArray(application.history)
      ? [...application.history].sort(
          (a, b) =>
            new Date(
              b.changedAt
            ).getTime() -
            new Date(
              a.changedAt
            ).getTime()
        )
      : [];

  const interviewRounds =
    Array.isArray(
      application.interviewRounds
    )
      ? application.interviewRounds
      : [];

  return (
    <article
      className={`application-item ${
        isStale ? 'is-stale' : ''
      }`}
      data-testid="application-row"
    >
      <div className="application-details">
        <div className="title-row">
          <h3 className="company-title">
            {application.company}
          </h3>

          <span
            className={`round-badge badge-${currentRound.toLowerCase()}`}
          >
            {currentRound}
          </span>

          {isStale && (
            <span
              className="stale-badge"
              title="Application has been in Applied/Screen for more than 14 days"
            >
              ⚠ Stale (&gt;14d)
            </span>
          )}
        </div>

        <p className="role-text">
          {application.role}
        </p>

        <div className="meta-row">
          <span className="meta-applied">
            <strong>
              Applied:
            </strong>{' '}
            {application.appliedDate}
          </span>

          <span className="days-ago">
            ({daysSince}{' '}
            {daysSince === 1
              ? 'day'
              : 'days'}{' '}
            ago)
          </span>

          <span className="meta-separator">
            •
          </span>

          <a
            href={hrefUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="job-link"
            title="Open job link in new tab"
          >
            Job Link ↗
          </a>
        </div>

        {/* Interview Rounds */}
        <section
          className="application-detail-section"
          aria-label="Interview rounds"
        >
          <h4>
            Interview Rounds (
            {interviewRounds.length})
          </h4>

          {interviewRounds.length === 0 ? (
            <p className="detail-empty">
              No interview rounds scheduled.
            </p>
          ) : (
            <ul className="interview-round-list">
              {interviewRounds.map(
                (round) => (
                  <li
                    key={round.id}
                    className="interview-round-summary"
                  >
                    <strong>
                      {round.type}
                    </strong>

                    <span>
                      {round.date}
                    </span>

                    {round.note && (
                      <span>
                        — {round.note}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        {/* Transition History */}
        <section
          className="history-section"
          aria-label="Transition history"
        >
          <h4>
            Transition History (
            {sortedHistory.length})
          </h4>

          <ul className="history-list">
            {sortedHistory.map(
              (item) => (
                <li
                  key={item.id}
                  className="history-item"
                >
                  <span>
                    {item.from && (
                      <>
                        <strong>
                          {item.from}
                        </strong>
                        {' → '}
                      </>
                    )}

                    <strong>
                      {item.to}
                    </strong>
                  </span>

                  <span>
                    {new Date(
                      item.changedAt
                    ).toLocaleString()}
                  </span>
                </li>
              )
            )}
          </ul>
        </section>
      </div>

      <div className="item-actions">
        <button
          type="button"
          className="edit-button"
          onClick={() =>
            onEdit(application.id)
          }
          aria-label={`Edit application for ${application.company}`}
        >
          Edit
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() =>
            onDelete(application.id)
          }
          aria-label={`Delete application for ${application.company}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default ApplicationItem;