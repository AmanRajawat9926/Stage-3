import {
  useEffect,
  useState,
  useMemo,
} from 'react';

import HeaderStats from './Components/HeaderStats';

import FilterBar from './components/FilterBar';

import ApplicationForm from './components/ApplicationForm';

import ApplicationList from './components/ApplicationList';

import {
  migrateApplications,
  getDerivedRound,
} from './Utils/helpers';

const STORAGE_KEY =
  'penthara_job_applications';

function App() {
  /*
   * Load applications from localStorage.
   *
   * Existing Stage 1 records are migrated here.
   */
  const [applications, setApplications] =
    useState(() => {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) return [];

      try {
        const parsed = JSON.parse(raw);

        return migrateApplications(parsed);
      } catch (e) {
        console.error(
          'Failed to parse local storage:',
          e
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

  /*
   * Save applications whenever state changes.
   */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(applications)
    );
  }, [applications]);

  const handleAddApplication = (
    newAppData
  ) => {
    setApplications((prev) => [
      newAppData,
      ...prev,
    ]);
  };

  const handleSaveEdit = (updatedApp) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedApp.id
          ? updatedApp
          : app
      )
    );

    setEditingId(null);
  };

  const handleDelete = (id) => {
    setApplications((prev) =>
      prev.filter(
        (app) => app.id !== id
      )
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRound('All');
  };

  /*
   * Filter and sort applications.
   *
   * Current round is always derived from
   * transition history.
   */
  const filteredAndSortedApplications =
    useMemo(() => {
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

          const matchesSearch =
            !query ||
            app.company
              .toLowerCase()
              .includes(query) ||
            app.role
              .toLowerCase()
              .includes(query);

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

          return String(b.id).localeCompare(
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
          onStartEdit={(id) =>
            setEditingId(id)
          }
          onCancelEdit={() =>
            setEditingId(null)
          }
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          onClearFilters={
            handleClearFilters
          }
        />
      </main>
    </div>
  );
}

export default App;