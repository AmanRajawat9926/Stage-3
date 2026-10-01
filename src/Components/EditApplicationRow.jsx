import { useState } from 'react';

import {
  ROUNDS,
  getTodayString,
  validateApplication,
  validateField,
  getDerivedRound,
} from '../Utils/helpers';

function EditApplicationRow({
  application,
  onSave,
  onCancel,
}) {
  const currentRound = getDerivedRound(application);

  const [formData, setFormData] = useState({
    company: application.company,
    role: application.role,
    round: currentRound,
    appliedDate: application.appliedDate,
    jobLink: application.jobLink,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const fieldError = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    const validationErrors =
      validateApplication(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let updatedHistory = Array.isArray(
      application.history
    )
      ? [...application.history]
      : [];

    let newTransition = null;

    if (formData.round !== currentRound) {
      newTransition = {
        id: crypto.randomUUID(),
        from: currentRound,
        to: formData.round,
        changedAt: new Date().toISOString(),
      };

      updatedHistory.push(newTransition);
    }

    const {
      round,
      stage,
      ...cleanApp
    } = application;

    onSave(
      {
        ...cleanApp,
        company: formData.company.trim(),
        role: formData.role.trim(),
        history: updatedHistory,
        appliedDate: formData.appliedDate,
        jobLink: formData.jobLink.trim(),
      },
      newTransition
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form
      className="application-item editing-card"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
      aria-label={`Editing application for ${application.company}`}
    >
      <div className="edit-grid">
        <div
          className={`form-field ${
            errors.company ? 'has-error' : ''
          }`}
        >
          <label
            htmlFor={`edit-company-${application.id}`}
          >
            Company *
          </label>

          <input
            id={`edit-company-${application.id}`}
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            autoFocus
            className={
              errors.company ? 'input-error' : ''
            }
          />

          {errors.company && (
            <p className="error-message" role="alert">
              {errors.company}
            </p>
          )}
        </div>

        <div
          className={`form-field ${
            errors.role ? 'has-error' : ''
          }`}
        >
          <label htmlFor={`edit-role-${application.id}`}>
            Role *
          </label>

          <input
            id={`edit-role-${application.id}`}
            name="role"
            type="text"
            value={formData.role}
            onChange={handleChange}
            className={errors.role ? 'input-error' : ''}
          />

          {errors.role && (
            <p className="error-message" role="alert">
              {errors.role}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`edit-round-${application.id}`}>
            Round
          </label>

          <select
            id={`edit-round-${application.id}`}
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
          <label
            htmlFor={`edit-appliedDate-${application.id}`}
          >
            Applied Date *
          </label>

          <input
            id={`edit-appliedDate-${application.id}`}
            type="date"
            name="appliedDate"
            max={getTodayString()}
            value={formData.appliedDate}
            onChange={handleChange}
            className={
              errors.appliedDate ? 'input-error' : ''
            }
          />

          {errors.appliedDate && (
            <p className="error-message" role="alert">
              {errors.appliedDate}
            </p>
          )}
        </div>

        <div
          className={`form-field full-width ${
            errors.jobLink ? 'has-error' : ''
          }`}
        >
          <label
            htmlFor={`edit-jobLink-${application.id}`}
          >
            Job Link *
          </label>

          <input
            id={`edit-jobLink-${application.id}`}
            type="text"
            name="jobLink"
            value={formData.jobLink}
            onChange={handleChange}
            className={
              errors.jobLink ? 'input-error' : ''
            }
          />

          {errors.jobLink && (
            <p className="error-message" role="alert">
              {errors.jobLink}
            </p>
          )}
        </div>
      </div>

      <div className="item-actions editing-actions">
        <button
          type="submit"
          className="save-button"
        >
          Save Changes
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
        >
          Cancel (Esc)
        </button>
      </div>
    </form>
  );
}

export default EditApplicationRow;