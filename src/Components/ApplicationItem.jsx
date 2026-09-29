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
  const currentRound = getDerivedRound(application);

  const daysSince = calculateDaysSinceApplied(
    application.appliedDate
  );

  const isStale = isApplicationStale(application);

  const hrefUrl = formatUrl(application.jobLink);

  // Requirement 4:
  // History should be displayed newest first.
  const sortedHistory = Array.isArray(application.history)
    ? [...application.history].sort(
        (a, b) =>
          new Date(b.changedAt).getTime() -
          new Date(a.changedAt).getTime()
      )
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

          {/* Current round is derived from history */}
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
            <strong>Applied:</strong>{' '}
            {application.appliedDate}
          </span>

          <span className="days-ago">
            ({daysSince}{' '}
            {daysSince === 1 ? 'day' : 'days'} ago)
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

        {/* Requirement 4: Transition History */}
        <div className="history-section mt-3 pt-3 border-t text-sm">
          <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">
            Transition History ({sortedHistory.length})
          </h4>

          <ul className="history-list space-y-1">
            {sortedHistory.map((item) => (
              <li
                key={item.id}
                className="history-item flex justify-between text-xs text-gray-600"
              >
                <span>
                  {item.from ? (
                    <>
                      <strong>{item.from}</strong>
                      {' → '}
                    </>
                  ) : null}

                  <strong>{item.to}</strong>
                </span>

                <span className="text-gray-400">
                  {new Date(
                    item.changedAt
                  ).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="item-actions">
        <button
          type="button"
          className="edit-button"
          onClick={() => onEdit(application.id)}
          aria-label={`Edit application for ${application.company}`}
        >
          Edit
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(application.id)}
          aria-label={`Delete application for ${application.company}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default ApplicationItem;