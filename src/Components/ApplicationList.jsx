import ApplicationItem from './ApplicationItem';
import EditApplicationRow from './EditApplicationRow';

function ApplicationList({
  totalCount,
  filteredApplications,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onClearFilters
}) {
  // Empty State 1: No records in localStorage / system
  if (totalCount === 0) {
    return (
      <section className="application-list empty-state" aria-label="Applications list empty">
        <div className="empty-message-box">
          <h3 className="empty-title">No applications added yet</h3>
          <p className="empty-desc">
            Your tracker is empty. Use the form above to add your first job application and track your status.
          </p>
        </div>
      </section>
    );
  }

  // Empty State 2: Records exist, but active search/filter matches 0 applications
  if (filteredApplications.length === 0) {
    return (
      <section className="application-list empty-state" aria-label="No search matches">
        <div className="empty-message-box filter-empty">
          <h3 className="empty-title">No matching applications</h3>
          <p className="empty-desc">
            No applications match your active search and round filters.
          </p>
          <button type="button" className="clear-filter-btn" onClick={onClearFilters}>
            Reset Filters
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="application-list" aria-label="Applications list">
      <div className="list-header">
        <h2>Applications ({filteredApplications.length})</h2>
      </div>
      <div className="application-items">
        {filteredApplications.map((application) =>
          editingId === application.id ? (
            <EditApplicationRow
              key={application.id}
              application={application}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <ApplicationItem
              key={application.id}
              application={application}
              onEdit={onStartEdit}
              onDelete={onDelete}
            />
          )
        )}
      </div>
    </section>
  );
}

export default ApplicationList;