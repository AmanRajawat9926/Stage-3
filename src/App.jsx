import {
  useEffect,
  useState,
  useMemo,
} from 'react';

import HeaderStats from './Components/HeaderStats';
import FilterBar from './Components/FilterBar';
import ApplicationForm from './Components/ApplicationForm';
import ApplicationList from './Components/ApplicationList';

import {
  migrateApplications,
  getDerivedRound,
} from './Utils/helpers';

const STORAGE_KEY =
  'penthara_job_applications';

function App() {
  const [applications, setApplications] =
    useState(() => {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(raw);

        return migrateApplications(
          parsed
        );
      } catch (error) {
        console.error(
          'Failed to parse local storage:',
          error
        );

        return [];
      }
    });

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedRound, setSelectedRound] =
    useState('All');

  const [editingId, setEditingId] =
    useState(null);

  const [undoAction, setUndoAction] =
    useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
      );
    } catch (error) {
      console.error(
        'Failed to save applications:',
        error
      );
    }
  }, [applications]);

  useEffect(() => {
    if (!undoAction) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setUndoAction(null);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [undoAction]);

  const handleAddApplication = (
    newAppData
  ) => {
    setApplications((prev) => [
      newAppData,
      ...prev,
    ]);
  };

  const handleAddInterviewRound = (
    applicationId,
    newRound
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) {
          return app;
        }

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
            newRound,
          ],
        };
      })
    );
  };

  const handleRemoveInterviewRound = (
    applicationId,
    roundId
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) {
          return app;
        }

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
              (round) =>
                round.id !== roundId
            ),
        };
      })
    );
  };

  const handleSaveEdit = (
    updatedApp,
    newTransition
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedApp.id
          ? updatedApp
          : app
      )
    );

    setEditingId(null);

    if (newTransition) {
      setUndoAction({
        applicationId:
          updatedApp.id,
        transition:
          newTransition,
      });
    }
  };

  const handleDelete = (id) => {
    setApplications((prev) =>
      prev.filter(
        (app) => app.id !== id
      )
    );

    setUndoAction((prev) => {
      if (
        prev?.applicationId === id
      ) {
        return null;
      }

      return prev;
    });

    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleUndo = () => {
    if (!undoAction) {
      return;
    }

    const {
      applicationId,
      transition,
    } = undoAction;

    setApplications((prev) =>
      prev.map((app) => {
        if (
          app.id !== applicationId
        ) {
          return app;
        }

        const history =
          Array.isArray(
            app.history
          )
            ? app.history
            : [];

        return {
          ...app,
          history: history.filter(
            (item) =>
              item.id !==
              transition.id
          ),
        };
      })
    );

    setUndoAction(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRound('All');
  };

  const filteredAndSortedApplications =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return applications
        .filter((app) => {
          const currentRound =
            getDerivedRound(app);

          const matchesRound =
            selectedRound === 'All' ||
            currentRound ===
              selectedRound;

          const company =
            app.company
              ?.toLowerCase() || '';

          const role =
            app.role
              ?.toLowerCase() || '';

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
          const dateDiff =
            b.appliedDate.localeCompare(
              a.appliedDate
            );

          if (dateDiff !== 0) {
            return dateDiff;
          }

          const timeA =
            a.createdAt || 0;

          const timeB =
            b.createdAt || 0;

          if (timeA !== timeB) {
            return timeB - timeA;
          }

          return String(
            b.id
          ).localeCompare(
            String(a.id)
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
        <h1>
          Job Application Tracker
        </h1>

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
          onSearchChange={
            setSearchQuery
          }
          selectedRound={
            selectedRound
          }
          onRoundChange={
            setSelectedRound
          }
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              handleClearFilters();
            }
          }}
        />

        <ApplicationList
          totalCount={
            applications.length
          }
          filteredApplications={
            filteredAndSortedApplications
          }
          editingId={editingId}
          onStartEdit={(id) =>
            setEditingId(id)
          }
          onCancelEdit={() =>
            setEditingId(null)
          }
          onSaveEdit={
            handleSaveEdit
          }
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

      {undoAction && (
        <div
          className="undo-toast"
          role="status"
          aria-live="polite"
        >
          <span>
            Round changed from{' '}
            <strong>
              {undoAction.transition.from}
            </strong>{' '}
            to{' '}
            <strong>
              {undoAction.transition.to}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
