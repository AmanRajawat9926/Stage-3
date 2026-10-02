import ApplicationItem from './ApplicationItem';
import EditApplicationRow from './EditApplicationRow';

function ApplicationList({
  totalCount = 0,
  filteredApplications = [],
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onClearFilters,
  onAddInterviewRound,
  onRemoveInterviewRound,
}) {
  // 1. Fully empty state (no applications in the app)
  if (totalCount === 0) {
    return (
      <section
        className="application-list empty-state"
        aria-label="Applications list empty"
        aria-live="polite"
      >
        <div className="empty-message-box">
          <h3 className="empty-title">
            No applications added yet
          </h3>

          <p className="empty-desc">
            Your tracker is empty. Use the form above to add
            your first job application and track your status.
          </p>
        </div>
      </section>
    );
  }

  // 2. Filtered empty state (applications exist, but search/filter returned no results)
  if (filteredApplications.length === 0) {
    return (
      <section
        className="application-list empty-state"
        aria-label="No search matches"
        aria-live="polite"
      >
        <div className="empty-message-box filter-empty">
          <h3 className="empty-title">
            No matching applications
          </h3>

          <p className="empty-desc">
            No applications match your active search and round filters.
          </p>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={onClearFilters}
          >
            Reset Filters
          </button>
        </div>
      </section>
    );
  }

  const count = filteredApplications.length;

  // 3. Render list of applications
  return (
    <section
      className="application-list"
      aria-label="Applications list"
    >
      <div className="list-header">
        <h2 aria-live="polite">
          Applications ({count})
        </h2>
      </div>

      <ul className="application-items" role="list">
        {filteredApplications.map((application) => {
          const isEditing = editingId === application.id;

          return (
            <li key={application.id} className="application-list-item">
              {isEditing ? (
                <EditApplicationRow
                  application={application}
                  onSave={onSaveEdit}
                  onCancel={onCancelEdit}
                />
              ) : (
                <ApplicationItem
                  application={application}
                  onEdit={onStartEdit}
                  onDelete={onDelete}
                  onAddInterviewRound={onAddInterviewRound}
                  onRemoveInterviewRound={onRemoveInterviewRound}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ApplicationList;