import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { EFFORT_SIZES, URGENCY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/constants';
import { Check, Clock, AlertTriangle, Pencil, Trash2, MapPin } from 'lucide-react';

function TaskCard({ task, onEdit, compact = false }) {
  const { profile, organization } = useAuthStore();
  const { completeTask, uncompleteTask, deleteTask } = useTaskStore();

  const handleToggleComplete = async () => {
    if (task.status === 'done') {
      await uncompleteTask(task.id);
    } else {
      await completeTask(task.id, profile.id, organization.id);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  const isCompleted = task.status === 'done';
  const assigneeColor = task.assignee?.color || '#6b6b75';
  const assigneeName = task.assignee?.display_name?.split(' ')[0] || 'Unassigned';
  const effort = EFFORT_SIZES[task.effort] || EFFORT_SIZES.m;

  if (compact) {
    return (
      <div
        className={`bg-dark-card rounded-xl p-3 border border-dark-border hover:border-dark-hover transition-all cursor-pointer group ${
          isCompleted ? 'opacity-60' : ''
        }`}
        onClick={onEdit}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete();
            }}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-dark-border hover:border-emerald-400'
            }`}
          >
            {isCompleted && <Check className="h-3 w-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.icon && <span className="text-base">{task.icon}</span>}
              <span
                className={`font-medium text-sm ${
                  isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                }`}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {/* Assignee badge */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: assigneeColor }}
                title={assigneeName}
              />
              
              {/* Effort */}
              <span className="text-xs text-text-muted bg-dark-hover px-1.5 py-0.5 rounded">
                {effort.label}
              </span>

              {/* Due date if exists */}
              {task.due_date && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}

              {/* Location if exists */}
              {task.location && (
                <span className="text-xs text-text-muted flex items-center gap-1 truncate max-w-[120px]" title={task.location}>
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{task.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions (show on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-text-muted hover:text-accent-blue rounded"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1 text-text-muted hover:text-red-400 rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full card view (for daily planner)
  return (
    <div
      className={`bg-dark-card rounded-xl p-4 border border-dark-border hover:border-dark-hover transition-all ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-dark-border hover:border-emerald-400'
          }`}
        >
          {isCompleted && <Check className="h-4 w-4" />}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.icon && <span className="text-xl">{task.icon}</span>}
              <h4
                className={`font-medium ${
                  isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                }`}
              >
                {task.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-1.5 text-text-muted hover:text-accent-blue rounded-lg hover:bg-dark-hover"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-dark-hover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: assigneeColor }}
              />
              <span className="text-sm text-text-secondary">{assigneeName}</span>
            </div>

            {/* Effort */}
            <span className="text-sm text-text-muted bg-dark-hover px-2 py-0.5 rounded">
              {effort.label} ({effort.description})
            </span>

            {/* Urgency */}
            <span className="text-sm text-text-muted flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {URGENCY_LEVELS[task.urgent]?.label || 'Today'}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span className="text-sm text-text-muted flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}

            {/* Location */}
            {task.location && (
              task.location_lat && task.location_lng ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${task.location_lat}&mlon=${task.location_lng}#map=17/${task.location_lat}/${task.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-blue hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {task.location}
                </a>
              ) : (
                <span className="text-sm text-text-muted flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {task.location}
                </span>
              )
            )}
          </div>

          {/* First Step */}
          {task.first_step && (
            <div className="mt-3 p-2 bg-dark-hover/50 rounded-lg">
              <div className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">
                First Step
              </div>
              <div className="text-sm text-text-secondary">{task.first_step}</div>
            </div>
          )}

          {/* Completion Criteria */}
          {task.completion_criteria && (
            <div className="mt-2 p-2 bg-dark-hover/50 rounded-lg">
              <div className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">
                Done When
              </div>
              <div className="text-sm text-text-secondary">{task.completion_criteria}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
