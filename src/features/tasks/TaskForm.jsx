import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { EFFORT_SIZES, URGENCY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/constants';
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react';

function TaskForm({ task, onClose }) {
  const { profile, organization } = useAuthStore();
  const { createTask, updateTask } = useTaskStore();
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      });
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
        <input
          id="title"
          name="title"
          type="text"
          required
          value={formData.title}
          onChange={handleChange}
          className="input"
          placeholder="What needs to be done?"
          autoFocus
        />
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

      {/* Effort Size */}
      <div className="form-section">
        <label className="label">Size (Effort)</label>
        <div className="flex gap-1">
          {Object.entries(EFFORT_SIZES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, effort: key }))}
              className={`size-btn ${formData.effort === key ? 'active' : ''}`}
            >
              <div>{value.label}</div>
              <div className="text-[0.6rem] opacity-70 mt-0.5">{value.description}</div>
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
          <div className="toggle-switch mt-2">
            <input
              type="checkbox"
              id="is_recurring"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
            />
            <span className="toggle-slider" onClick={() => setFormData(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}></span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
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
    </form>
  );
}

export default TaskForm;
