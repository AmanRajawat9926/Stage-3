import { useState } from 'react';

import {
  ROUNDS,
  getTodayString,
  validateApplication,
  validateField,
} from '../Utils/helpers';

const INITIAL_FORM = {
  company: '',
  role: '',
  round: 'Applied',
  appliedDate: getTodayString(),
  jobLink: '',
};

function ApplicationForm({ onAddApplication }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name] || errors[name]) {
      const errorMsg = validateField(name, value);

      setErrors((prev) => ({
        ...prev,
        [name]: errorMsg,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const errorMsg = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM,
      appliedDate: getTodayString(),
    });

    setErrors({});
    setTouched({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setTouched({
      company: true,
      role: true,
      appliedDate: true,
      jobLink: true,
    });

    const validationErrors = validateApplication(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const timestamp = new Date().toISOString();

    onAddApplication({
      id: crypto.randomUUID(),
      company: formData.company.trim(),
      role: formData.role.trim(),

      history: [
        {
          id: crypto.randomUUID(),
          from: null,
          to: formData.round,
          changedAt: timestamp,
        },
      ],

      interviewRounds: [],

      appliedDate: formData.appliedDate,
      jobLink: formData.jobLink.trim(),
      createdAt: Date.now(),
    });

    handleReset();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleReset();
    }
  };

  return (
    <form
      className="application-form card"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
      aria-label="Add new application"
    >
      <div className="form-header">
        <h2>Add Application</h2>
      </div>

      <div className="form-row">
        <div
          className={`form-field ${
            errors.company ? 'has-error' : ''
          }`}
        >
          <label htmlFor="company">Company *</label>

          <input
            id="company"
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Stripe"
            className={errors.company ? 'input-error' : ''}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={
              errors.company ? 'company-error' : undefined
            }
          />

          {errors.company && (
            <p
              id="company-error"
              className="error-message"
              role="alert"
            >
              {errors.company}
            </p>
          )}
        </div>

        <div
          className={`form-field ${
            errors.role ? 'has-error' : ''
          }`}
        >
          <label htmlFor="role">Role *</label>

          <input
            id="role"
            name="role"
            type="text"
            value={formData.role}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Frontend Engineer"
            className={errors.role ? 'input-error' : ''}
            aria-invalid={Boolean(errors.role)}
            aria-describedby={
              errors.role ? 'role-error' : undefined
            }
          />

          {errors.role && (
            <p
              id="role-error"
              className="error-message"
              role="alert"
            >
              {errors.role}
            </p>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="round">Initial Round</label>

          <select
            id="round"
            name="round"
            value={formData.round}
            onChange={handleChange}
          >
            {ROUNDS.map((round) => (
              <option key={round} value={round}>
                {round}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`form-field ${
            errors.appliedDate ? 'has-error' : ''
          }`}
        >
          <label htmlFor="appliedDate">Applied Date *</label>

          <input
            id="appliedDate"
            name="appliedDate"
            type="date"
            max={getTodayString()}
            value={formData.appliedDate}
            onChange={handleChange}
            onBlur={handleBlur}
            className={
              errors.appliedDate ? 'input-error' : ''
            }
            aria-invalid={Boolean(errors.appliedDate)}
            aria-describedby={
              errors.appliedDate
                ? 'appliedDate-error'
                : undefined
            }
          />

          {errors.appliedDate && (
            <p
              id="appliedDate-error"
              className="error-message"
              role="alert"
            >
              {errors.appliedDate}
            </p>
          )}
        </div>
      </div>

      <div
        className={`form-field full-width ${
          errors.jobLink ? 'has-error' : ''
        }`}
      >
        <label htmlFor="jobLink">Job Posting Link *</label>

        <input
          id="jobLink"
          name="jobLink"
          type="text"
          value={formData.jobLink}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="https://company.com/careers/frontend-role"
          className={errors.jobLink ? 'input-error' : ''}
          aria-invalid={Boolean(errors.jobLink)}
          aria-describedby={
            errors.jobLink ? 'jobLink-error' : undefined
          }
        />

        {errors.jobLink && (
          <p
            id="jobLink-error"
            className="error-message"
            role="alert"
          >
            {errors.jobLink}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Add Application
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={handleReset}
        >
          Reset / Cancel
        </button>
      </div>
    </form>
  );
}

export default ApplicationForm;