import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { EFFORT_SIZES, URGENCY_LEVELS, IMPORTANCE_LEVELS, ALL_TASK_ICONS, RECURRENCE_PRESETS } from '../../lib/constants';
import { AlertCircle, Calendar, RefreshCw, ChevronDown, ChevronUp, MapPin, Navigation, X, Trash2, Sparkles } from 'lucide-react';

function TaskForm({ task, onClose }) {
  const { profile, organization } = useAuthStore();
  const { createTask, updateTask, deleteTask } = useTaskStore();
  const { members } = useOrganizationStore();

  const [formData, setFormData] = useState({
    title: '',
    assignee_id: null,
    effort: 'm',
    urgent: 3,
    important: 3,
    due_date: '',
    is_recurring: false,
    recurrence_rule: '',
    icon: null,
    first_step: '',
    completion_criteria: '',
    location: '',
    location_lat: null,
    location_lng: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrencePreset, setRecurrencePreset] = useState('never');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        assignee_id: task.assignee_id || null,
        effort: task.effort || 'm',
        urgent: task.urgent || 3,
        important: task.important || 3,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        is_recurring: task.is_recurring || false,
        recurrence_rule: task.recurrence_rule || '',
        icon: task.icon || null,
        first_step: task.first_step || '',
        completion_criteria: task.completion_criteria || '',
        location: task.location || '',
        location_lat: task.location_lat || null,
        location_lng: task.location_lng || null,
      });
      // Set recurrence preset based on rule
      if (task.recurrence_rule) {
        setShowRecurrence(true);
        const preset = Object.entries(RECURRENCE_PRESETS).find(
          ([, value]) => value.rule === task.recurrence_rule
        );
        setRecurrencePreset(preset ? preset[0] : 'custom');
      }
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get a human-readable address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();

          // Build a concise location name
          let locationName = '';
          if (data.address) {
            const addr = data.address;
            const parts = [];
            if (addr.shop || addr.amenity || addr.building) {
              parts.push(addr.shop || addr.amenity || addr.building);
            }
            if (addr.road) {
              parts.push(addr.road);
            }
            if (addr.city || addr.town || addr.village) {
              parts.push(addr.city || addr.town || addr.village);
            }
            locationName = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');
          } else {
            locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }

          setFormData((prev) => ({
            ...prev,
            location: locationName,
            location_lat: latitude,
            location_lng: longitude,
          }));
        } catch {
          // If reverse geocoding fails, just use coordinates
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            location_lat: latitude,
            location_lng: longitude,
          }));
        }
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('Unable to get location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      location: '',
      location_lat: null,
      location_lng: null,
    }));
  };

  const handleAutofill = async () => {
    if (!formData.title.trim()) {
      setError('Enter a task name first to use AI autofill');
      return;
    }

    setIsAutofilling(true);
    setError('');

    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: formData.title.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to autofill task');
      }

      const suggestions = await response.json();

      setFormData((prev) => ({
        ...prev,
        effort: suggestions.effort || prev.effort,
        urgent: suggestions.urgent || prev.urgent,
        important: suggestions.important || prev.important,
        icon: suggestions.icon || prev.icon,
        first_step: suggestions.first_step || prev.first_step,
        completion_criteria: suggestions.completion_criteria || prev.completion_criteria,
      }));
    } catch (err) {
      setError(err.message || 'Failed to autofill task');
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        organization_id: organization.id,
        urgent: parseInt(formData.urgent),
        important: parseInt(formData.important),
        due_date: formData.due_date || null,
        assignee_id: formData.assignee_id || null,
        icon: formData.icon || null,
        first_step: formData.first_step?.trim() || null,
        completion_criteria: formData.completion_criteria?.trim() || null,
        location: formData.location?.trim() || null,
        location_lat: formData.location_lat || null,
        location_lng: formData.location_lng || null,
      };

      let result;
      if (task) {
        result = await updateTask(task.id, taskData);
      } else {
        result = await createTask(taskData);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save task');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Title */}
      <div className="form-section">
        <label htmlFor="title" className="label">
          Task Name
        </label>
        <div className="flex gap-2">
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="input flex-1"
            placeholder="What needs to be done?"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAutofill}
            disabled={isAutofilling || !formData.title.trim()}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="AI Autofill - Fill in task details based on the name"
          >
            {isAutofilling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">AI Fill</span>
          </button>
        </div>
      </div>

      {/* Icon Selector */}
      <div className="form-section">
        <label className="label">Icon (optional)</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, icon: null }))}
            className={`w-9 h-9 rounded-lg border-2 text-sm font-medium transition-all ${
              !formData.icon
                ? 'border-text-secondary bg-dark-hover text-text-primary'
                : 'border-dark-border bg-dark-card text-text-muted hover:bg-dark-hover'
            }`}
          >
            None
          </button>
          {ALL_TASK_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, icon }))}
              className={`w-9 h-9 rounded-lg border-2 text-lg transition-all ${
                formData.icon === icon
                  ? 'border-text-secondary bg-dark-hover'
                  : 'border-dark-border bg-dark-card hover:bg-dark-hover'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Effort Size */}
      <div className="form-section">
        <label className="label">Effort</label>
        <div className="flex gap-1">
          {Object.entries(EFFORT_SIZES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, effort: key }))}
              className={`size-btn ${formData.effort === key ? 'active' : ''}`}
              title={value.description}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee - Button Style */}
      <div className="form-section">
        <label className="label">Assign To</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, assignee_id: null }))}
            className={`assignee-btn ${!formData.assignee_id ? 'active' : ''}`}
            style={{
              '--btn-accent': '#6b6b75',
              '--btn-accent-bg': 'rgba(107, 107, 117, 0.1)',
            }}
          >
            None
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, assignee_id: member.id }))}
              className={`assignee-btn ${formData.assignee_id === member.id ? 'active' : ''}`}
              style={{
                '--btn-accent': member.color,
                '--btn-accent-bg': `${member.color}1a`,
              }}
            >
              {member.display_name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div className="form-section">
        <label className="label">Urgency</label>
        <div className="flex gap-1">
          {Object.entries(URGENCY_LEVELS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, urgent: parseInt(key) }))}
              className={`size-btn ${formData.urgent === parseInt(key) ? 'active' : ''}`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Importance */}
      <div className="form-section">
        <label className="label">Importance</label>
        <div className="flex gap-1">
          {Object.entries(IMPORTANCE_LEVELS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, important: parseInt(key) }))}
              className={`size-btn ${formData.important === parseInt(key) ? 'active' : ''}`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date & Recurring */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-section">
          <label htmlFor="due_date" className="label flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Due Date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-section">
          <label className="label flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            Recurring
          </label>
          <button
            type="button"
            onClick={() => setShowRecurrence(!showRecurrence)}
            className="flex items-center gap-2 px-3 py-2 mt-1 bg-dark-card border border-dark-border rounded-lg text-sm text-text-secondary hover:bg-dark-hover transition-all"
          >
            {showRecurrence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {recurrencePreset === 'never' ? 'No repeat' : RECURRENCE_PRESETS[recurrencePreset]?.label}
          </button>
        </div>
      </div>

      {/* Recurrence Options */}
      {showRecurrence && (
        <div className="form-section bg-dark-card/50 rounded-xl p-4 border border-dark-border">
          <label className="label">Repeat Pattern</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RECURRENCE_PRESETS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRecurrencePreset(key);
                  if (key === 'never') {
                    setFormData((prev) => ({ ...prev, is_recurring: false, recurrence_rule: '' }));
                  } else if (key !== 'custom') {
                    setFormData((prev) => ({ ...prev, is_recurring: true, recurrence_rule: value.rule }));
                  } else {
                    setFormData((prev) => ({ ...prev, is_recurring: true }));
                  }
                }}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  recurrencePreset === key
                    ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                    : 'border-dark-border bg-dark-card text-text-muted hover:bg-dark-hover'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>
          {recurrencePreset === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                name="recurrence_rule"
                value={formData.recurrence_rule}
                onChange={handleChange}
                className="input text-sm"
                placeholder="RRULE (e.g., FREQ=WEEKLY;BYDAY=TU)"
              />
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div className="form-section">
        <label className="label flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          Location (optional)
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  location: e.target.value,
                  // Clear coordinates if manually editing (they'll be out of sync)
                  location_lat: null,
                  location_lng: null,
                }));
              }}
              className="input pr-8"
              placeholder="Enter location or use current"
            />
            {formData.location && (
              <button
                type="button"
                onClick={clearLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-text-secondary hover:bg-dark-hover transition-all disabled:opacity-50"
          >
            {isGettingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Current</span>
          </button>
        </div>
        {formData.location_lat && formData.location_lng && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${formData.location_lat}&mlon=${formData.location_lng}#map=17/${formData.location_lat}/${formData.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-accent-blue hover:underline"
          >
            <MapPin className="h-3 w-3" />
            View on map
          </a>
        )}
      </div>

      {/* First Step */}
      <div className="form-section">
        <label htmlFor="first_step" className="label">
          What is a small step you can do to start?
        </label>
        <textarea
          id="first_step"
          name="first_step"
          value={formData.first_step}
          onChange={handleChange}
          className="input min-h-[70px] resize-y"
          placeholder="Enter a small first step to get started..."
          rows={2}
        />
      </div>

      {/* Completion Criteria */}
      <div className="form-section">
        <label htmlFor="completion_criteria" className="label">
          What should be accomplished for this to be complete?
        </label>
        <textarea
          id="completion_criteria"
          name="completion_criteria"
          value={formData.completion_criteria}
          onChange={handleChange}
          className="input min-h-[70px] resize-y"
          placeholder="Describe what needs to be accomplished..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t border-dark-border">
        {task && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-secondary text-red-400 hover:text-red-300 hover:border-red-400/30"
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : task ? (
              'Update Task'
            ) : (
              'Add Task'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default TaskForm;
