import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { useAuthStore } from '../../store/authStore';
import { EFFORT_SIZES } from '../../lib/constants';
import { Calendar, CheckCircle2, Sun, Sunset, Moon, Clock } from 'lucide-react';

function DailyPlanner({ onEditTask }) {
  const { tasks, isLoading, completeTask } = useTaskStore();
  const { members, scores } = useOrganizationStore();
  const { profile } = useAuthStore();

  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Filter tasks for today
  const todaysTasks = tasks.filter((task) => {
    if (task.status === 'done') return false;
    // Include if urgency is "Today" (3) or higher
    if (task.urgent >= 3) return true;
    // Include if due date is today
    if (task.due_date) {
      return task.due_date.split('T')[0] === todayStr;
    }
    return false;
  });

  // Get completed tasks for today
  const completedToday = tasks.filter((task) => {
    if (task.status !== 'done') return false;
    if (task.completed_at) {
      return task.completed_at.split('T')[0] === todayStr;
    }
    return false;
  });

  // Group tasks by member
  const getTasksByMember = (memberId) => {
    return todaysTasks
      .filter((t) => t.assignee_id === memberId)
      .sort((a, b) => b.important - a.important);
  };

  const getCompletedByMember = (memberId) => {
    return completedToday.filter((t) => t.assignee_id === memberId);
  };

  // Get member's score for today
  const getMemberScore = (memberId) => {
    const todayScore = scores.find(
      (s) => s.user_id === memberId && s.date === todayStr
    );
    return todayScore?.points || 0;
  };

  // Calculate total time estimate (simple version based on effort)
  const getTimeEstimate = (memberTasks) => {
    const effortMinutes = { xs: 15, s: 30, m: 60, l: 120, xl: 240 };
    const total = memberTasks.reduce(
      (sum, t) => sum + (effortMinutes[t.effort] || 60),
      0
    );
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Time blocks
  const timeBlocks = [
    { id: 'morning', label: 'Morning', icon: Sun, color: '#fcd34d' },
    { id: 'afternoon', label: 'Afternoon', icon: Sunset, color: '#fb923c' },
    { id: 'evening', label: 'Evening', icon: Moon, color: '#a78bfa' },
  ];

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
      <div className="plan-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="plan-header-left">
          <h1 className="plan-title font-serif text-2xl text-text-primary flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent-blue" />
            Today's Plan
          </h1>
          <p className="plan-date text-text-secondary">
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-accent-blue">
              {todaysTasks.length}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              To Do
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {completedToday.length}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              Done
            </div>
          </div>
        </div>
      </div>

      {/* Member Columns */}
      <div className={`grid gap-6 ${members.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
        {members.map((member) => {
          const memberTasks = getTasksByMember(member.id);
          const memberCompleted = getCompletedByMember(member.id);
          const memberScore = getMemberScore(member.id);

          return (
            <div
              key={member.id}
              className="plan-column"
              style={{ borderTopColor: member.color, borderTopWidth: '3px' }}
            >
              {/* Column Header */}
              <div className="plan-column-header">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.display_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">
                    {member.display_name?.split(' ')[0]}
                  </div>
                  <div className="text-xs text-text-muted">
                    {memberTasks.length} tasks • {getTimeEstimate(memberTasks)} estimated
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: member.color }}>
                    {memberScore}
                  </div>
                  <div className="text-xs text-text-muted">pts today</div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3 flex-1">
                {memberTasks.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No tasks scheduled</div>
                  </div>
                ) : (
                  memberTasks.map((task) => (
                    <PlannerTaskItem
                      key={task.id}
                      task={task}
                      memberColor={member.color}
                      onEdit={() => onEditTask(task)}
                      onComplete={() => completeTask(task.id, profile?.id, profile?.organization_id)}
                    />
                  ))
                )}

                {/* Completed Section */}
                {memberCompleted.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Completed ({memberCompleted.length})
                    </div>
                    <div className="space-y-2 opacity-60">
                      {memberCompleted.map((task) => (
                        <PlannerTaskItem
                          key={task.id}
                          task={task}
                          memberColor={member.color}
                          onEdit={() => onEditTask(task)}
                          completed
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Tasks */}
      {todaysTasks.filter((t) => !t.assignee_id).length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Unassigned Tasks
          </h3>
          <div className="space-y-2">
            {todaysTasks
              .filter((t) => !t.assignee_id)
              .map((task) => (
                <PlannerTaskItem
                  key={task.id}
                  task={task}
                  memberColor="#6b6b75"
                  onEdit={() => onEditTask(task)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Task Item Component
function PlannerTaskItem({ task, memberColor, onEdit, onComplete, completed = false }) {
  const effort = EFFORT_SIZES[task.effort] || EFFORT_SIZES.m;

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-dark-hover rounded-xl transition-all duration-200 hover:translate-x-1 cursor-pointer ${
        completed ? 'opacity-60' : ''
      }`}
      onClick={onEdit}
    >
      {/* Checkbox */}
      {!completed && onComplete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="w-5 h-5 rounded border-2 border-dark-border hover:border-emerald-400 flex items-center justify-center transition-colors"
        >
          <CheckCircle2 className="h-3 w-3 text-transparent hover:text-emerald-400" />
        </button>
      )}

      {completed && (
        <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Task Icon/Dot */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: completed ? '#6b6b75' : memberColor }}
      >
        {task.icon || task.title?.charAt(0).toUpperCase()}
      </div>

      {/* Task Details */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium text-text-primary truncate ${
            completed ? 'line-through text-text-muted' : ''
          }`}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
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
    </div>
  );
}

export default DailyPlanner;
