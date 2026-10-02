import { useEffect, useMemo, useState } from 'react';

import HeaderStats from './Components/HeaderStats';
import FilterBar from './Components/FilterBar';
import ApplicationForm from './Components/ApplicationForm';
import ApplicationList from './Components/ApplicationList';

import {
  migrateApplications,
  getDerivedRound,
} from './Utils/helpers';

const STORAGE_KEY = 'penthara_job_applications';

function UndoToast({ undoAction, onUndo }) {
  if (!undoAction) return null;

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        {undoAction.type === 'transition' && (
          <>
            Round changed from{' '}
            <strong>{undoAction.transition.from || 'None'}</strong> to{' '}
            <strong>{undoAction.transition.to}</strong>
          </>
        )}

        {undoAction.type === 'add-interview' && (
          <>
            Interview round added:{' '}
            <strong>{undoAction.round.type}</strong>
          </>
        )}

        {undoAction.type === 'remove-interview' && (
          <>
            Interview round removed:{' '}
            <strong>{undoAction.round.type}</strong>
          </>
        )}
      </span>

      <button type="button" onClick={onUndo} className="undo-btn">
        Undo
      </button>
    </div>
  );
}

function App() {
  const [applications, setApplications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return migrateApplications(parsed);
    } catch (error) {
      console.error('Failed to parse local storage applications:', error);
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRound, setSelectedRound] = useState('All');
  const [editingId, setEditingId] = useState(null);

  /*
   * Stores the most recent undoable action.
   * Types: 'transition' | 'add-interview' | 'remove-interview'
   */
  const [undoAction, setUndoAction] = useState(null);

  /*
   * Persist applications whenever state changes.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
      console.error('Failed to save applications to local storage:', error);
    }
  }, [applications]);

  /*
   * Auto-dismiss the undo toast after 5 seconds.
   */
  useEffect(() => {
    if (!undoAction) return;

    const timer = setTimeout(() => {
      setUndoAction(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [undoAction]);

  const handleAddApplication = (newAppData) => {
    setApplications((prev) => [newAppData, ...prev]);
  };

  const handleAddInterviewRound = (applicationId, newRound) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;

        const interviewRounds = Array.isArray(app.interviewRounds)
          ? app.interviewRounds
          : [];

        return {
          ...app,
          interviewRounds: [...interviewRounds, newRound],
        };
      })
    );

    setUndoAction({
      type: 'add-interview',
      applicationId,
      round: newRound,
    });
  };

  const handleRemoveInterviewRound = (applicationId, roundId) => {
    let removedRound = null;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;

        const interviewRounds = Array.isArray(app.interviewRounds)
          ? app.interviewRounds
          : [];

        removedRound = interviewRounds.find((round) => round.id === roundId);
        if (!removedRound) return app;

        return {
          ...app,
          interviewRounds: interviewRounds.filter(
            (round) => round.id !== roundId
          ),
        };
      })
    );

    if (removedRound) {
      setUndoAction({
        type: 'remove-interview',
        applicationId,
        round: removedRound,
      });
    }
  };

  const handleSaveEdit = (updatedApp, newTransition) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    setEditingId(null);

    if (newTransition) {
      setUndoAction({
        type: 'transition',
        applicationId: updatedApp.id,
        transition: newTransition,
      });
    }
  };

  const handleDelete = (id) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));

    setUndoAction((prev) => (prev?.applicationId === id ? null : prev));

    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleUndo = () => {
    if (!undoAction) return;

    const { type, applicationId, transition, round } = undoAction;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;

        if (type === 'transition') {
          const history = Array.isArray(app.history) ? app.history : [];
          return {
            ...app,
            history: history.filter((item) => item.id !== transition.id),
          };
        }

        if (type === 'add-interview') {
          const interviewRounds = Array.isArray(app.interviewRounds)
            ? app.interviewRounds
            : [];
          return {
            ...app,
            interviewRounds: interviewRounds.filter(
              (item) => item.id !== round.id
            ),
          };
        }

        if (type === 'remove-interview') {
          const interviewRounds = Array.isArray(app.interviewRounds)
            ? app.interviewRounds
            : [];
          return {
            ...app,
            interviewRounds: [...interviewRounds, round],
          };
        }

        return app;
      })
    );

    setUndoAction(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRound('All');
  };

  const filteredAndSortedApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applications
      .filter((app) => {
        const currentRound = getDerivedRound(app);
        const matchesRound =
          selectedRound === 'All' || currentRound === selectedRound;

        const company = app.company?.toLowerCase() || '';
        const role = app.role?.toLowerCase() || '';

        const matchesSearch =
          !query || company.includes(query) || role.includes(query);

        return matchesRound && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = a.appliedDate || '';
        const dateB = b.appliedDate || '';

        const dateDiff = dateB.localeCompare(dateA);
        if (dateDiff !== 0) return dateDiff;

        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();

        if (timeA !== timeB) return timeB - timeA;

        return String(b.id || '').localeCompare(String(a.id || ''));
      });
  }, [applications, searchQuery, selectedRound]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
        <HeaderStats applications={applications} />
      </header>

      <main className="app-content">
        <ApplicationForm onAddApplication={handleAddApplication} />

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              handleClearFilters();
            }
          }}
        />

        <ApplicationList
          totalCount={applications.length}
          filteredApplications={filteredAndSortedApplications}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          onClearFilters={handleClearFilters}
          onAddInterviewRound={handleAddInterviewRound}
          onRemoveInterviewRound={handleRemoveInterviewRound}
        />
      </main>

      <UndoToast undoAction={undoAction} onUndo={handleUndo} />
    </div>
  );
}

export default App;