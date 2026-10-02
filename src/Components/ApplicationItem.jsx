import { useState, useMemo } from 'react';

import {
  calculateDaysSinceApplied,
  isApplicationStale,
  formatUrl,
  getDerivedRound,
  INTERVIEW_ROUND_TYPES,
  getTodayString,
} from '../Utils/helpers';

const INITIAL_INTERVIEW_FORM = {
  type: 'phone',
  date: getTodayString(),
  note: '',
};

function ApplicationItem({
  application,
  onEdit,
  onDelete,
  onAddInterviewRound,
  onRemoveInterviewRound,
}) {
  const currentRound = getDerivedRound(application);
  const badgeClass = `badge-${currentRound.toLowerCase().replace(/\s+/g, '-')}`;

  const daysSince = calculateDaysSinceApplied(application.appliedDate);
  const isStale = isApplicationStale(application);
  const hrefUrl = formatUrl(application.jobLink);

  const sortedHistory = useMemo(() => {
    return Array.isArray(application.history)
      ? [...application.history].sort(
          (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        )
      : [];
  }, [application.history]);

  const interviewRounds = Array.isArray(application.interviewRounds)
    ? application.interviewRounds
    : [];

  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState(INITIAL_INTERVIEW_FORM);
  const [interviewErrors, setInterviewErrors] = useState({});

  const resetInterviewForm = () => {
    setInterviewForm({
      ...INITIAL_INTERVIEW_FORM,
      date: getTodayString(),
    });
    setInterviewErrors({});
    setShowInterviewForm(false);
  };

  const validateInterviewRound = () => {
    const errors = {};
    if (!interviewForm.type) {
      errors.type = 'Interview type is required.';
    }
    if (!interviewForm.date) {
      errors.date = 'Interview date is required.';
    }
    return errors;
  };

  const handleInterviewChange = (e) => {
    const { name, value } = e.target;

    setInterviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setInterviewErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleInterviewSubmit = (e) => {
    e.preventDefault();

    const errors = validateInterviewRound();
    if (Object.keys(errors).length > 0) {
      setInterviewErrors(errors);
      return;
    }

    onAddInterviewRound(application.id, {
      id: crypto.randomUUID(),
      type: interviewForm.type,
      date: interviewForm.date,
      note: interviewForm.note.trim(),
    });

    resetInterviewForm();
  };

  const handleInterviewKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      resetInterviewForm();
    }
  };

  const handleRemoveInterviewRound = (roundId) => {
    onRemoveInterviewRound(application.id, roundId);
  };

  return (
    <article
      className={`application-item ${isStale ? 'is-stale' : ''}`}
      data-testid="application-row"
    >
      <div className="application-details">
        <div className="title-row">
          <h3 className="company-title">{application.company}</h3>

          <span className={`round-badge ${badgeClass}`}>
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

        <p className="role-text">{application.role}</p>

        <div className="meta-row">
          <span className="meta-applied">
            <strong>Applied:</strong> {application.appliedDate}
          </span>

          <span className="days-ago">
            ({daysSince} {daysSince === 1 ? 'day' : 'days'} ago)
          </span>

          <span className="meta-separator">•</span>

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
          <div className="detail-section-header">
            <h4>Interview Rounds ({interviewRounds.length})</h4>

            <button
              type="button"
              className="add-round-button"
              onClick={() => {
                if (showInterviewForm) {
                  resetInterviewForm();
                } else {
                  setShowInterviewForm(true);
                }
              }}
            >
              {showInterviewForm ? 'Cancel' : '+ Add Interview Round'}
            </button>
          </div>

          {showInterviewForm && (
            <form
              className="interview-round-form"
              onSubmit={handleInterviewSubmit}
              onKeyDown={handleInterviewKeyDown}
              noValidate
              aria-label={`Add interview round for ${application.company}`}
            >
              <div
                className={`form-field ${
                  interviewErrors.type ? 'has-error' : ''
                }`}
              >
                <label htmlFor={`round-type-${application.id}`}>
                  Type *
                </label>

                <select
                  id={`round-type-${application.id}`}
                  name="type"
                  value={interviewForm.type}
                  onChange={handleInterviewChange}
                  className={interviewErrors.type ? 'input-error' : ''}
                  aria-invalid={Boolean(interviewErrors.type)}
                  aria-describedby={
                    interviewErrors.type
                      ? `round-type-error-${application.id}`
                      : undefined
                  }
                >
                  {INTERVIEW_ROUND_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {interviewErrors.type && (
                  <p
                    id={`round-type-error-${application.id}`}
                    className="error-message"
                    role="alert"
                  >
                    {interviewErrors.type}
                  </p>
                )}
              </div>

              <div
                className={`form-field ${
                  interviewErrors.date ? 'has-error' : ''
                }`}
              >
                <label htmlFor={`round-date-${application.id}`}>
                  Date *
                </label>

                <input
                  id={`round-date-${application.id}`}
                  name="date"
                  type="date"
                  value={interviewForm.date}
                  onChange={handleInterviewChange}
                  className={interviewErrors.date ? 'input-error' : ''}
                  aria-invalid={Boolean(interviewErrors.date)}
                  aria-describedby={
                    interviewErrors.date
                      ? `round-date-error-${application.id}`
                      : undefined
                  }
                />

                {interviewErrors.date && (
                  <p
                    id={`round-date-error-${application.id}`}
                    className="error-message"
                    role="alert"
                  >
                    {interviewErrors.date}
                  </p>
                )}
              </div>

              <div className="form-field full-width">
                <label htmlFor={`round-note-${application.id}`}>
                  Note
                </label>

                <input
                  id={`round-note-${application.id}`}
                  name="note"
                  type="text"
                  value={interviewForm.note}
                  onChange={handleInterviewChange}
                  placeholder="e.g. DSA + JavaScript discussion"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Add Round
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetInterviewForm}
                >
                  Cancel (Esc)
                </button>
              </div>
            </form>
          )}

          {interviewRounds.length === 0 ? (
            <p className="detail-empty">
              No interview rounds scheduled.
            </p>
          ) : (
            <ul className="interview-round-list">
              {interviewRounds.map((round) => (
                <li
                  key={round.id}
                  className="interview-round-summary"
                >
                  <div className="interview-round-info">
                    <strong>{round.type}</strong>
                    <span>{round.date}</span>
                    {round.note && <span>— {round.note}</span>}
                  </div>

                  <button
                    type="button"
                    className="delete-round-button"
                    onClick={() => handleRemoveInterviewRound(round.id)}
                    aria-label={`Remove ${round.type} interview round on ${round.date}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Transition History */}
        <section
          className="history-section"
          aria-label="Transition history"
        >
          <h4>Transition History ({sortedHistory.length})</h4>

          {sortedHistory.length === 0 ? (
            <p className="detail-empty">
              No transition history available.
            </p>
          ) : (
            <ul className="history-list">
              {sortedHistory.map((item) => (
                <li key={item.id} className="history-item">
                  <span>
                    {item.from && (
                      <>
                        <strong>{item.from}</strong>
                        {' → '}
                      </>
                    )}
                    <strong>{item.to}</strong>
                  </span>

                  <span>
                    {new Date(item.changedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
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