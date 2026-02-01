import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { useAuthStore } from '../../store/authStore';
import { EFFORT_SIZES } from '../../lib/constants';
import { Calendar, CheckCircle2, Sun, Sunset, Moon, Clock, Sparkles, Wand2 } from 'lucide-react';
import Modal from '../../components/Modal';
import AIPlannerModal from './AIPlannerModal';

function DailyPlanner({ onEditTask }) {
  const { tasks, isLoading, completeTask, updateTask } = useTaskStore();
  const { members, scores } = useOrganizationStore();
  const { profile } = useAuthStore();

  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);

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
      alert('No tasks to plan for today');
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
      alert(`✨ AI Plan Created!\n\n${result.summary}`);
    } catch (error) {
      console.error('AI Planning error:', error);
      alert('Failed to create AI plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Advanced AI Planning - with user context
  const handleAdvancedAIPlan = async (userContext) => {
    if (todaysTasks.length === 0) {
      alert('No tasks to plan for today');
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
      alert(`✨ Personalized Plan Created!\n\n${result.summary}\n\n${result.encouragement || ''}`);
    } catch (error) {
      console.error('Advanced AI Planning error:', error);
      alert('Failed to create personalized plan. Please try again.');
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
