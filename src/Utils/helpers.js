export const ROUNDS = [
  'Applied',
  'Screen',
  'Interview',
  'Offer',
  'Rejected',
];

export const getTodayString = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Migration helper to update Stage 1 records
 * without losing existing application data.
 */
export const migrateApplications = (apps) => {
  if (!Array.isArray(apps)) return [];

  return apps.map((app) => {
    /*
     * If history already exists, the application
     * is already using the new data shape.
     *
     * We check Array.isArray only so that an empty
     * history array is not migrated again.
     */
    if (Array.isArray(app.history)) {
      return app;
    }

    /*
     * Get the old current round from Stage 1 data.
     */
    const legacyRound = app.round || app.stage || 'Applied';

    const migrationTimestamp = app.createdAt
      ? new Date(app.createdAt).toISOString()
      : new Date().toISOString();

    /*
     * Seed exactly one transition for the
     * existing Stage 1 application.
     */
    const initialTransition = {
      id: `trans-migrated-${app.id || Date.now()}`,
      from: null,
      to: legacyRound,
      changedAt: migrationTimestamp,
    };

    /*
     * Remove old round/stage fields.
     * Current round will now be derived from history.
     */
    const { round, stage, ...cleanApp } = app;

    return {
      ...cleanApp,
      history: [initialTransition],
    };
  });
};

/**
 * Single source of truth:
 * current round is derived from transition history.
 *
 * History is stored chronologically:
 * oldest transition -> newest transition.
 *
 * Therefore, the last history entry represents
 * the current round.
 */
export const getDerivedRound = (application) => {
  if (
    !application ||
    !Array.isArray(application.history) ||
    application.history.length === 0
  ) {
    return 'Applied';
  }

  const latestTransition =
    application.history[application.history.length - 1];

  return latestTransition?.to || 'Applied';
};

export const calculateDaysSinceApplied = (appliedDateString) => {
  if (!appliedDateString) return 0;

  const parts = appliedDateString.split('-').map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    return 0;
  }

  const [year, month, day] = parts;

  const appliedUTC = Date.UTC(year, month - 1, day);

  const now = new Date();

  const todayUTC = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const diffTime = todayUTC - appliedUTC;

  return Math.max(
    0,
    Math.floor(diffTime / (1000 * 60 * 60 * 24))
  );
};

export const isApplicationStale = (application) => {
  if (!application || !application.appliedDate) {
    return false;
  }

  const days = calculateDaysSinceApplied(
    application.appliedDate
  );

  const currentRound = getDerivedRound(application);

  const staleRounds = ['Applied', 'Screen'];

  return (
    days > 14 &&
    staleRounds.includes(currentRound)
  );
};

export const isValidUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  try {
    const url = new URL(
      trimmed.startsWith('http')
        ? trimmed
        : `https://${trimmed}`
    );

    return (
      url.hostname.includes('.') &&
      url.hostname.length > 3
    );
  } catch {
    return false;
  }
};

export const formatUrl = (url) => {
  if (!url) return '';

  const trimmed = url.trim();

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const validateField = (name, value) => {
  const strVal =
    typeof value === 'string'
      ? value.trim()
      : '';

  const today = getTodayString();

  switch (name) {
    case 'company':
      if (!strVal) {
        return 'Company name is required.';
      }

      return '';

    case 'role':
      if (!strVal) {
        return 'Role name is required.';
      }

      return '';

    case 'appliedDate':
      if (!value) {
        return 'Applied Date is required.';
      }

      if (value > today) {
        return 'Applied Date cannot be in the future.';
      }

      return '';

    case 'jobLink':
      if (!strVal) {
        return 'Job link is required.';
      }

      if (!isValidUrl(strVal)) {
        return 'Please enter a valid URL.';
      }

      return '';

    default:
      return '';
  }
};

export const validateApplication = (formData) => {
  const fields = [
    'company',
    'role',
    'appliedDate',
    'jobLink',
  ];

  const errors = {};

  fields.forEach((field) => {
    const errorMsg = validateField(
      field,
      formData[field]
    );

    if (errorMsg) {
      errors[field] = errorMsg;
    }
  });

  return errors;
};