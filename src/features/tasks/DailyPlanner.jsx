import { useState, useCallback, memo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { EFFORT_SIZES } from '../../lib/constants';
import { Calendar, CheckCircle2, Sun, Sunset, Moon, Clock, Sparkles, Wand2, Check, Undo2 } from 'lucide-react';
import Modal from '../../components/Modal';
import AIPlannerModal from './AIPlannerModal';
import { DailyPlannerSkeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import { useToast } from '../../components/Toast';

function DailyPlanner({ onEditTask }) {
  const { tasks, isLoading, error, fetchTasks, completeTask, uncompleteTask, updateTask } = useTaskStore();
  const { members, scores } = useOrganizationStore();
  const { profile, organization } = useAuthStore();
  const { triggerFirstTaskCelebration } = useOnboardingStore();
  const toast = useToast();

  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Retry handler
  const handleRetry = useCallback(async () => {
    if (!organization?.id) return;
    setIsRetrying(true);
    await fetchTasks(organization.id);
    setIsRetrying(false);
  }, [organization?.id, fetchTasks]);

  // Handle task completion with celebration
  const handleCompleteTask = useCallback(async (taskId) => {
    const result = await completeTask(taskId, profile?.id, organization?.id);
    if (result.success) {
      triggerFirstTaskCelebration();
    }
    return result;
  }, [completeTask, profile?.id, organization?.id, triggerFirstTaskCelebration]);

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
    const memberTasks = todaysTasks.filter((t) => t.assignee_id === memberId);
    return sortTasksByPlan(memberTasks);
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

  // Basic AI Planning - quick automatic planning
  const handleBasicAIPlan = async () => {
    if (todaysTasks.length === 0) {
      toast.warning('No tasks to plan for today');
      return;
    }

    setIsPlanning(true);
    setPlanResult(null);

    try {
      const response = await fetch('/api/plan-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: todaysTasks }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const result = await response.json();
      setPlanResult(result);

      // Show success message
      toast.success(result.summary, { title: 'AI Plan Created!' });
    } catch (error) {
      console.error('AI Planning error:', error);
      toast.error('Failed to create AI plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Advanced AI Planning - with user context
  const handleAdvancedAIPlan = async (userContext) => {
    if (todaysTasks.length === 0) {
      toast.warning('No tasks to plan for today');
      return;
    }

    setIsPlanning(true);
    setPlanResult(null);

    try {
      const response = await fetch('/api/plan-day-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: todaysTasks,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate personalized plan');
      }

      const result = await response.json();
      setPlanResult(result);

      // Show success message
      toast.success(result.summary, { title: 'Personalized Plan Created!' });
    } catch (error) {
      console.error('Advanced AI Planning error:', error);
      toast.error('Failed to create personalized plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Get task order based on AI plan
  const getTaskOrder = (taskId) => {
    if (!planResult || !planResult.scheduledTasks) return null;
    const scheduledTask = planResult.scheduledTasks.find((st) => st.id === taskId);
    return scheduledTask ? scheduledTask.orderIndex : null;
  };

  // Sort tasks by AI plan if available
  const sortTasksByPlan = (taskList) => {
    if (!planResult || !planResult.scheduledTasks) {
      return taskList;
    }

    return [...taskList].sort((a, b) => {
      const orderA = getTaskOrder(a.id);
      const orderB = getTaskOrder(b.id);

      if (orderA !== null && orderB !== null) {
        return orderA - orderB;
      }
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;

      // Fallback to importance
      return b.important - a.important;
    });
  };

  // Time blocks
  const timeBlocks = [
    { id: 'morning', label: 'Morning', icon: Sun, color: '#fcd34d' },
    { id: 'afternoon', label: 'Afternoon', icon: Sunset, color: '#fb923c' },
    { id: 'evening', label: 'Evening', icon: Moon, color: '#a78bfa' },
  ];

  // Show skeleton loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="view-transition-enter">
        <DailyPlannerSkeleton />
      </div>
    );
  }

  // Show error state with retry
  if (error && tasks.length === 0) {
    return (
      <ErrorState
        title="Failed to load tasks"
        message={error}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    );
  }

  return (
    <div className="space-y-6 view-transition-enter">
      {/* Header */}
      <div className="plan-header flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="plan-header-left">
            <h1 className="plan-title font-serif text-2xl text-text-primary flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent-blue" />
              Today&apos;s Plan
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

        {/* AI Planning Buttons */}
        {todaysTasks.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBasicAIPlan}
              disabled={isPlanning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Planning...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">AI Plan My Day</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsAdvancedModalOpen(true)}
              disabled={isPlanning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="h-5 w-5" />
              <span className="font-medium">Personalized Plan</span>
            </button>
          </div>
        )}

        {/* AI Plan Summary */}
        {planResult && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">AI Plan Active</h3>
                <p className="text-sm text-text-secondary">{planResult.summary}</p>
                {planResult.encouragement && (
                  <p className="text-sm text-accent-blue mt-2 italic">{planResult.encouragement}</p>
                )}
              </div>
              <button
                onClick={() => setPlanResult(null)}
                className="text-text-muted hover:text-text-primary transition-colors"
                title="Clear plan"
              >
                ✕
              </button>
            </div>
          </div>
        )}
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
                      onComplete={() => handleCompleteTask(task.id)}
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
                    <div className="space-y-2">
                      {memberCompleted.map((task) => (
                        <PlannerTaskItem
                          key={task.id}
                          task={task}
                          memberColor={member.color}
                          onEdit={() => onEditTask(task)}
                          onUncomplete={() => uncompleteTask(task.id)}
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
                  onComplete={() => handleCompleteTask(task.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Advanced AI Planner Modal */}
      <Modal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        title="Personalized Day Planner"
        size="lg"
      >
        <AIPlannerModal
          onClose={() => setIsAdvancedModalOpen(false)}
          onPlan={handleAdvancedAIPlan}
        />
      </Modal>
    </div>
  );
}

// Task Item Component - Memoized for performance
const PlannerTaskItem = memo(function PlannerTaskItem({ task, memberColor, onEdit, onComplete, onUncomplete, completed = false }) {
  const effort = EFFORT_SIZES[task.effort] || EFFORT_SIZES.m;
  const [isCompleting, setIsCompleting] = useState(false);

  // Handle complete with loading state
  const handleComplete = useCallback(async (e) => {
    e.stopPropagation();
    if (isCompleting || !onComplete) return;
    setIsCompleting(true);
    await onComplete();
    setIsCompleting(false);
  }, [onComplete, isCompleting]);

  // Handle uncomplete with loading state
  const handleUncomplete = useCallback(async (e) => {
    e.stopPropagation();
    if (isCompleting || !onUncomplete) return;
    setIsCompleting(true);
    await onUncomplete();
    setIsCompleting(false);
  }, [onUncomplete, isCompleting]);

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-dark-hover rounded-xl transition-all duration-200 hover:translate-x-1 cursor-pointer group touch-feedback list-item-enter ${
        completed ? 'opacity-60' : ''
      }`}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit()}
    >
      {/* Checkbox - Larger touch target */}
      {!completed && onComplete && (
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-8 h-8 rounded-full border-2 border-dark-border hover:border-emerald-400 hover:bg-emerald-400/10 flex items-center justify-center transition-all flex-shrink-0 group/checkbox focus-ring touch-feedback disabled:opacity-50"
          aria-label={`Complete task: ${task.title}`}
        >
          {isCompleting ? (
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-transparent group-hover/checkbox:text-emerald-400 transition-colors" />
          )}
        </button>
      )}

      {completed && (
        <button
          onClick={handleUncomplete}
          disabled={isCompleting}
          className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-orange-500 flex items-center justify-center transition-all flex-shrink-0 group/undo focus-ring touch-feedback disabled:opacity-50"
          title="Undo complete"
          aria-label={`Undo complete: ${task.title}`}
        >
          {isCompleting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 text-white group-hover/undo:hidden" />
              <Undo2 className="h-4 w-4 text-white hidden group-hover/undo:block" />
            </>
          )}
        </button>
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

      {/* Mark Complete button (shown on hover) */}
      {!completed && onComplete && (
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className="opacity-0 group-hover:opacity-100 transition-all px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap touch-feedback disabled:opacity-50"
        >
          {isCompleting ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          {isCompleting ? 'Completing...' : 'Complete'}
        </button>
      )}

      {/* Undo Complete button (shown on hover for completed tasks) */}
      {completed && onUncomplete && (
        <button
          onClick={handleUncomplete}
          disabled={isCompleting}
          className="opacity-0 group-hover:opacity-100 transition-all px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap touch-feedback disabled:opacity-50"
        >
          {isCompleting ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Undo2 className="h-3 w-3" />
          )}
          {isCompleting ? 'Undoing...' : 'Undo'}
        </button>
      )}
    </div>
  );
});

export default DailyPlanner;
