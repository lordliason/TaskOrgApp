import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { EFFORT_SIZES, URGENCY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/constants';
import { Check, Clock, AlertTriangle, Pencil, Trash2 } from 'lucide-react';

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
  const assigneeColor = task.assignee?.color || '#9CA3AF';
  const assigneeName = task.assignee?.display_name || 'Unassigned';
  const effort = EFFORT_SIZES[task.effort] || EFFORT_SIZES.m;

  if (compact) {
    return (
      <div
        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group ${
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
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {isCompleted && <Check className="h-3 w-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium text-sm ${
                  isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
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
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {effort.label}
              </span>

              {/* Due date if exists */}
              {task.due_date && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString()}
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
              className="p-1 text-gray-400 hover:text-primary-600 rounded"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
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
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {isCompleted && <Check className="h-4 w-4" />}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4
              className={`font-medium ${
                isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>

            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: assigneeColor }}
              />
              <span className="text-sm text-gray-600">{assigneeName}</span>
            </div>

            {/* Effort */}
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {effort.label} ({effort.description})
            </span>

            {/* Urgency */}
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {URGENCY_LEVELS[task.urgent]?.label || 'Today'}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
