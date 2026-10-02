export const ROUNDS = [
  'Applied',
  'Screen',
  'Interview',
  'Offer',
  'Rejected',
];

export const INTERVIEW_ROUND_TYPES = [
  'phone',
  'tech',
  'HR',
  'onsite',
];

/* --------------------------------------------------
   Internal Helpers
-------------------------------------------------- */

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

/* --------------------------------------------------
   Date Helpers
-------------------------------------------------- */

export const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* --------------------------------------------------
   Validation
-------------------------------------------------- */

export const validateField = (name, value) => {
  const trimmedValue = String(value ?? '').trim();

  if (name === 'company') {
    return !trimmedValue ? 'Company is required.' : '';
  }

  if (name === 'role') {
    return !trimmedValue ? 'Role is required.' : '';
  }

  if (name === 'appliedDate') {
    if (!trimmedValue) {
      return 'Applied date is required.';
    }
    if (trimmedValue > getTodayString()) {
      return 'Applied date cannot be in the future.';
    }
    return '';
  }

  if (name === 'jobLink') {
    if (!trimmedValue) {
      return 'Job link is required.';
    }

    try {
      const formattedUrl = formatUrl(trimmedValue);
      const parsedUrl = new URL(formattedUrl);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
        ? ''
        : 'Please enter a valid HTTP or HTTPS URL.';
    } catch {
      return 'Please enter a valid URL.';
    }
  }

  return '';
};

export const validateApplication = (formData) => {
  const errors = {};
  const fields = ['company', 'role', 'appliedDate', 'jobLink'];

  fields.forEach((field) => {
    const error = validateField(field, formData?.[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

/* --------------------------------------------------
   Sorted Transition History & Derived Round
-------------------------------------------------- */

export const getSortedHistory = (application) => {
  if (!application || !Array.isArray(application.history)) {
    return [];
  }

  return [...application.history].sort((a, b) => {
    const timeA = new Date(a.changedAt).getTime();
    const timeB = new Date(b.changedAt).getTime();

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return String(b.id || '').localeCompare(String(a.id || ''));
  });
};

export const getDerivedRound = (application) => {
  const sortedHistory = getSortedHistory(application);
  return sortedHistory[0]?.to || 'Applied';
};

/* --------------------------------------------------
   Migration Helper
-------------------------------------------------- */

export const migrateApplications = (apps) => {
  if (!Array.isArray(apps)) {
    return [];
  }

  return apps.map((app) => {
    const legacyRound = app.round || app.stage || 'Applied';
    const { round, stage, ...cleanApp } = app;

    if (Array.isArray(app.history) && app.history.length > 0) {
      return {
        ...cleanApp,
        interviewRounds: Array.isArray(app.interviewRounds) ? app.interviewRounds : [],
      };
    }

    const migrationTimestamp = app.createdAt
      ? new Date(app.createdAt).toISOString()
      : new Date().toISOString();

    const initialTransition = {
      id: `trans-migrated-${app.id || generateUUID()}`,
      from: null,
      to: legacyRound,
      changedAt: migrationTimestamp,
    };

    return {
      ...cleanApp,
      history: [initialTransition],
      interviewRounds: Array.isArray(app.interviewRounds) ? app.interviewRounds : [],
    };
  });
};

/* --------------------------------------------------
   Application Age & Stale Checks
-------------------------------------------------- */

export const calculateDaysSinceApplied = (appliedDate) => {
  if (!appliedDate) {
    return 0;
  }

  const [year, month, day] = appliedDate.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const appliedUtc = Date.UTC(year, month - 1, day);
  
  const todayStr = getTodayString();
  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const todayUtc = Date.UTC(tYear, tMonth - 1, tDay);

  const difference = todayUtc - appliedUtc;

  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
};

export const isApplicationStale = (application) => {
  if (!application) {
    return false;
  }

  const currentRound = getDerivedRound(application);

  if (currentRound !== 'Applied' && currentRound !== 'Screen') {
    return false;
  }

  return calculateDaysSinceApplied(application.appliedDate) > 14;
};

export const countStaleApplications = (applications) => {
  if (!Array.isArray(applications)) {
    return 0;
  }

  return applications.filter(isApplicationStale).length;
};

/* --------------------------------------------------
   Upcoming Interviews
-------------------------------------------------- */

export const isUpcomingInterview = (interviewRound) => {
  if (!interviewRound?.date) {
    return false;
  }

  const [year, month, day] = interviewRound.date.split('-').map(Number);
  if (!year || !month || !day) return false;

  const interviewUtc = Date.UTC(year, month - 1, day);

  const todayStr = getTodayString();
  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const todayUtc = Date.UTC(tYear, tMonth - 1, tDay);

  const sevenDaysUtc = todayUtc + 7 * 24 * 60 * 60 * 1000;

  return interviewUtc >= todayUtc && interviewUtc <= sevenDaysUtc;
};

export const countUpcomingInterviews = (applications) => {
  if (!Array.isArray(applications)) {
    return 0;
  }

  return applications.reduce((count, application) => {
    if (!Array.isArray(application.interviewRounds)) {
      return count;
    }

    const upcomingCount = application.interviewRounds.filter(isUpcomingInterview).length;
    return count + upcomingCount;
  }, 0);
};

/* --------------------------------------------------
   URL Helper
-------------------------------------------------- */

export const formatUrl = (url) => {
  if (!url) return '';
  const trimmedUrl = String(url).trim();
  if (!trimmedUrl) return '';

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
};

/* --------------------------------------------------
   Relative Time Formatting
-------------------------------------------------- */

export const formatRelativeTime = (date) => {
  if (!date) return '';

  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return '';

  const difference = Date.now() - timestamp;
  if (difference < 0) return 'just now';

  const seconds = Math.floor(difference / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

/* --------------------------------------------------
   Exact Date Formatting
-------------------------------------------------- */

export const formatExactDate = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/* --------------------------------------------------
   Transition Factory
-------------------------------------------------- */

export const createTransition = (from, to) => {
  return {
    id: `trans-${generateUUID()}`,
    from,
    to,
    changedAt: new Date().toISOString(),
  };
};