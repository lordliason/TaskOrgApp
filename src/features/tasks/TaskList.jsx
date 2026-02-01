import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { useAuthStore } from '../../store/authStore';
import { EFFORT_SIZES } from '../../lib/constants';
import { List, Users, User, CheckCircle2, Clock } from 'lucide-react';

function TaskList({ onEditTask }) {
  const { tasks, isLoading, completeTask } = useTaskStore();
  const { members } = useOrganizationStore();
  const { profile } = useAuthStore();

  // Filter mode: 'all', 'by-user', 'combined'
  const [filterMode, setFilterMode] = useState('all');

  // Filter out completed tasks
  const activeTasks = tasks.filter((task) => task.status !== 'done');

  // Sort tasks by importance and urgency
  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      // First by urgency (descending)
      if (b.urgent !== a.urgent) return b.urgent - a.urgent;
      // Then by importance (descending)
      if (b.important !== a.important) return b.important - a.important;
      // Then by due date (ascending - earlier dates first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      // Finally by created_at (descending)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  // Get tasks by member
  const getTasksByMember = (memberId) => {
    return sortTasks(activeTasks.filter((t) => t.assignee_id === memberId));
  };

  // Get all tasks sorted
  const getAllTasksSorted = () => {
    return sortTasks(activeTasks);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-text-primary flex items-center gap-3">
            <List className="h-6 w-6 text-accent-blue" />
            Task List
          </h1>
          <p className="text-text-secondary mt-1">
            All active tasks organized by priority
          </p>
        </div>

        {/* Filter Mode Toggle */}
        <div className="flex gap-2 bg-dark-card border border-dark-border rounded-xl p-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <List className="h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setFilterMode('by-user')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'by-user'
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="h-4 w-4" />
            By User
          </button>
          <button
            onClick={() => setFilterMode('combined')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'combined'
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <User className="h-4 w-4" />
            My Tasks
          </button>
        </div>
      </div>

      {/* Task Display based on filter mode */}
      {filterMode === 'all' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="space-y-3">
            {getAllTasksSorted().length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <div className="text-lg font-medium">No active tasks</div>
                <div className="text-sm">Create a task to get started</div>
              </div>
            ) : (
              getAllTasksSorted().map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  members={members}
                  onEdit={() => onEditTask(task)}
                  onComplete={() => completeTask(task.id, profile?.id, profile?.organization_id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {filterMode === 'by-user' && (
        <div className={`grid gap-6 ${members.length > 1 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-xl'}`}>
          {members.map((member) => {
            const memberTasks = getTasksByMember(member.id);

            return (
              <div
                key={member.id}
                className="bg-dark-card border border-dark-border rounded-xl overflow-hidden"
                style={{ borderTopColor: member.color, borderTopWidth: '3px' }}
              >
                {/* Member Header */}
                <div className="p-4 border-b border-dark-border flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">
                      {member.display_name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {memberTasks.length} active {memberTasks.length === 1 ? 'task' : 'tasks'}
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {memberTasks.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">No active tasks</div>
                    </div>
                  ) : (
                    memberTasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        members={members}
                        onEdit={() => onEditTask(task)}
                        onComplete={() => completeTask(task.id, profile?.id, profile?.organization_id)}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned Tasks Column */}
          {activeTasks.filter((t) => !t.assignee_id).length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gray-600">
                  ?
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">Unassigned</div>
                  <div className="text-xs text-text-muted">
                    {activeTasks.filter((t) => !t.assignee_id).length} {activeTasks.filter((t) => !t.assignee_id).length === 1 ? 'task' : 'tasks'}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {sortTasks(activeTasks.filter((t) => !t.assignee_id)).map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    members={members}
                    onEdit={() => onEditTask(task)}
                    onComplete={() => completeTask(task.id, profile?.id, profile?.organization_id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filterMode === 'combined' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="space-y-3">
            {getTasksByMember(profile?.id).length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <div className="text-lg font-medium">No tasks assigned to you</div>
                <div className="text-sm">Tasks assigned to you will appear here</div>
              </div>
            ) : (
              getTasksByMember(profile?.id).map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  members={members}
                  onEdit={() => onEditTask(task)}
                  onComplete={() => completeTask(task.id, profile?.id, profile?.organization_id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex gap-3 justify-center">
        <div className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-center">
          <div className="text-2xl font-bold text-accent-blue">
            {activeTasks.length}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">
            Active Tasks
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {tasks.filter((t) => t.status === 'done').length}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">
            Completed
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Item Component
function TaskListItem({ task, members, onEdit, onComplete, compact = false }) {
  const effort = EFFORT_SIZES[task.effort] || EFFORT_SIZES.m;
  const assignee = members.find((m) => m.id === task.assignee_id);
  const assigneeColor = assignee?.color || '#6b6b75';
  const assigneeName = assignee?.display_name?.split(' ')[0] || 'Unassigned';

  // Get urgency and importance colors
  const getUrgencyColor = (urgent) => {
    if (urgent >= 4) return 'bg-red-500';
    if (urgent === 3) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getImportanceColor = (important) => {
    if (important >= 4) return 'bg-purple-500';
    if (important === 3) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-dark-hover rounded-xl transition-all duration-200 hover:translate-x-1 cursor-pointer group ${
        compact ? 'text-sm' : ''
      }`}
      onClick={onEdit}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="w-5 h-5 rounded border-2 border-dark-border hover:border-emerald-400 flex items-center justify-center transition-colors flex-shrink-0"
      >
        <CheckCircle2 className="h-3 w-3 text-transparent hover:text-emerald-400" />
      </button>

      {/* Priority Indicators */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${getUrgencyColor(task.urgent)}`} title={`Urgency: ${task.urgent}/5`} />
        <div className={`w-2 h-2 rounded-full ${getImportanceColor(task.important)}`} title={`Importance: ${task.important}/5`} />
      </div>

      {/* Task Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: assigneeColor }}
      >
        {task.icon || task.title?.charAt(0).toUpperCase()}
      </div>

      {/* Task Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs bg-dark-card px-2 py-0.5 rounded text-text-muted">
            {assigneeName}
          </span>
          <span className="text-xs bg-dark-card px-2 py-0.5 rounded text-text-muted">
            {effort.label}
          </span>
          {task.due_date && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Hover action indicator */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export default TaskList;
