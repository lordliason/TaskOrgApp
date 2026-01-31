import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { EFFORT_SIZES, URGENCY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/constants';
import { AlertCircle } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="label">
          Task Title *
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

      {/* Assignee */}
      <div>
        <label htmlFor="assignee_id" className="label">
          Assign To
        </label>
        <select
          id="assignee_id"
          name="assignee_id"
          value={formData.assignee_id || ''}
          onChange={handleChange}
          className="input"
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Effort */}
      <div>
        <label className="label">Effort Size</label>
        <div className="flex gap-2">
          {Object.entries(EFFORT_SIZES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, effort: key }))}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                formData.effort === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div>{value.label}</div>
              <div className="text-xs opacity-75">{value.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="label">Urgency</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(URGENCY_LEVELS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, urgent: parseInt(key) }))}
              className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                formData.urgent === parseInt(key)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Importance */}
      <div>
        <label className="label">Importance</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(IMPORTANCE_LEVELS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, important: parseInt(key) }))}
              className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                formData.important === parseInt(key)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due_date" className="label">
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

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
            'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
