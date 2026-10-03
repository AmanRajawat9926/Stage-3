import { useEffect, useMemo, useState } from 'react';

import './App.css';

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

      <button
        type="button"
        onClick={onUndo}
        className="undo-btn"
      >
        Undo
      </button>
    </div>
  );
}

function App() {
  const [applications, setApplications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      return migrateApplications(parsed);
    } catch (error) {
      console.error(
        'Failed to parse local storage applications:',
        error
      );

      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRound, setSelectedRound] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [undoAction, setUndoAction] = useState(null);

  /*
   * Persist applications whenever application state changes.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
      );
    } catch (error) {
      console.error(
        'Failed to save applications to local storage:',
        error
      );
    }
  }, [applications]);

  /*
   * Automatically remove the undo toast after 5 seconds.
   */
  useEffect(() => {
    if (!undoAction) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setUndoAction(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [undoAction]);

  /*
   * Add a new application.
   */
  const handleAddApplication = (newAppData) => {
    setApplications((prev) => [
      newAppData,
      ...prev,
    ]);
  };

  /*
   * Add an interview round.
   *
   * The new round is stored inside the correct application.
   * The complete round object is saved in undoAction so Undo
   * can remove exactly that round.
   */
  const handleAddInterviewRound = (
    applicationId,
    newRound
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) {
          return app;
        }

        const interviewRounds = Array.isArray(
          app.interviewRounds
        )
          ? app.interviewRounds
          : [];

        return {
          ...app,
          interviewRounds: [
            ...interviewRounds,
            newRound,
          ],
        };
      })
    );

    setUndoAction({
      type: 'add-interview',
      applicationId,
      round: newRound,
    });
  };

  /*
   * Remove an interview round.
   *
   * IMPORTANT:
   * We do not capture removedRound by mutating a variable
   * inside the state updater.
   *
   * Instead, we find the round from the current application
   * state first and then perform a pure state update.
   */
  const handleRemoveInterviewRound = (
    applicationId,
    roundId
  ) => {
    const application = applications.find(
      (app) => app.id === applicationId
    );

    if (!application) {
      return;
    }

    const interviewRounds = Array.isArray(
      application.interviewRounds
    )
      ? application.interviewRounds
      : [];

    const removedRound = interviewRounds.find(
      (round) => round.id === roundId
    );

    if (!removedRound) {
      return;
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) {
          return app;
        }

        const rounds = Array.isArray(
          app.interviewRounds
        )
          ? app.interviewRounds
          : [];

        return {
          ...app,
          interviewRounds: rounds.filter(
            (round) => round.id !== roundId
          ),
        };
      })
    );

    setUndoAction({
      type: 'remove-interview',
      applicationId,
      round: removedRound,
    });
  };

  /*
   * Save edited application.
   *
   * If a new transition was created, show an Undo toast
   * for that exact transition.
   */
  const handleSaveEdit = (
    updatedApplication,
    newTransition
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedApplication.id
          ? updatedApplication
          : app
      )
    );

    setEditingId(null);

    if (newTransition) {
      setUndoAction({
        type: 'transition',
        applicationId: updatedApplication.id,
        transition: newTransition,
      });
    }
  };

  /*
   * Delete application.
   */
  const handleDelete = (id) => {
    setApplications((prev) =>
      prev.filter((app) => app.id !== id)
    );

    setUndoAction((prev) =>
      prev?.applicationId === id
        ? null
        : prev
    );

    if (editingId === id) {
      setEditingId(null);
    }
  };

  /*
   * Undo the most recent action.
   *
   * Transition:
   * removes exactly one transition by ID.
   *
   * Add interview:
   * removes exactly the interview round by ID.
   *
   * Remove interview:
   * restores the exact round object that was removed.
   */
  const handleUndo = () => {
    if (!undoAction) {
      return;
    }

    const {
      type,
      applicationId,
      transition,
      round,
    } = undoAction;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) {
          return app;
        }

        if (type === 'transition') {
          const history = Array.isArray(
            app.history
          )
            ? app.history
            : [];

          return {
            ...app,
            history: history.filter(
              (item) =>
                item.id !== transition.id
            ),
          };
        }

        if (type === 'add-interview') {
          const interviewRounds =
            Array.isArray(
              app.interviewRounds
            )
              ? app.interviewRounds
              : [];

          return {
            ...app,
            interviewRounds:
              interviewRounds.filter(
                (item) =>
                  item.id !== round.id
              ),
          };
        }

        if (type === 'remove-interview') {
          const interviewRounds =
            Array.isArray(
              app.interviewRounds
            )
              ? app.interviewRounds
              : [];

          return {
            ...app,
            interviewRounds: [
              ...interviewRounds,
              round,
            ],
          };
        }

        return app;
      })
    );

    setUndoAction(null);
  };

  /*
   * Clear search and round filters.
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRound('All');
  };

  /*
   * Filter and sort applications.
   *
   * Current round is always derived from history.
   */
  const filteredAndSortedApplications = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return applications
      .filter((app) => {
        const currentRound =
          getDerivedRound(app);

        const matchesRound =
          selectedRound === 'All' ||
          currentRound === selectedRound;

        const company =
          app.company?.toLowerCase() || '';

        const role =
          app.role?.toLowerCase() || '';

        const matchesSearch =
          !query ||
          company.includes(query) ||
          role.includes(query);

        return (
          matchesRound &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const dateA =
          a.appliedDate || '';

        const dateB =
          b.appliedDate || '';

        const dateDiff =
          dateB.localeCompare(dateA);

        if (dateDiff !== 0) {
          return dateDiff;
        }

        const timeA =
          new Date(
            a.createdAt || 0
          ).getTime();

        const timeB =
          new Date(
            b.createdAt || 0
          ).getTime();

        if (timeA !== timeB) {
          return timeB - timeA;
        }

        return String(
          b.id || ''
        ).localeCompare(
          String(a.id || '')
        );
      });
  }, [
    applications,
    searchQuery,
    selectedRound,
  ]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Job Application Tracker</h1>

        <HeaderStats
          applications={applications}
        />
      </header>

      <main className="app-content">
        <ApplicationForm
          onAddApplication={
            handleAddApplication
          }
        />

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
          filteredApplications={
            filteredAndSortedApplications
          }
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() =>
            setEditingId(null)
          }
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          onClearFilters={
            handleClearFilters
          }
          onAddInterviewRound={
            handleAddInterviewRound
          }
          onRemoveInterviewRound={
            handleRemoveInterviewRound
          }
        />
      </main>

      <UndoToast
        undoAction={undoAction}
        onUndo={handleUndo}
      />
    </div>
  );
}

export default App;