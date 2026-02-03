import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import TaskMatrix from './TaskMatrix';
import TaskList from './TaskList';
import DailyPlanner from './DailyPlanner';
import TaskForm from './TaskForm';
import Leaderboard from '../gamification/Leaderboard';
import ResetDayButton from './ResetDayButton';
import Modal from '../../components/Modal';
import { Plus, LayoutGrid, Calendar, Trophy, List } from 'lucide-react';

function Dashboard() {
  const { profile, organization } = useAuthStore();
  const { tasks, fetchTasks, subscribeToTasks, unsubscribe } = useTaskStore();
  const { members, scores, fetchMembers, fetchScores } = useOrganizationStore();

  const [activeView, setActiveView] = useState('matrix');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewKey, setViewKey] = useState(0); // Key to trigger view transition

  useEffect(() => {
    if (organization?.id) {
      fetchTasks(organization.id);
      fetchMembers(organization.id);
      fetchScores(organization.id);
      subscribeToTasks(organization.id);
    }

    return () => {
      unsubscribe();
    };
  }, [organization?.id]);

  // Memoized handlers
  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  }, []);

  // Handle view change with transition
  const handleViewChange = useCallback((newView) => {
    if (newView !== activeView) {
      setActiveView(newView);
      setViewKey((prev) => prev + 1); // Trigger re-animation
    }
  }, [activeView]);

  const views = [
    { id: 'matrix', label: 'Matrix', icon: LayoutGrid },
    { id: 'task-list', label: 'Task List', icon: List },
    { id: 'planner', label: "Today's Plan", icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  // Memoized member scores calculation
  const memberScores = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return members.map((member) => {
      const todayScore = scores.find(
        (s) => s.user_id === member.id && s.date === todayStr
      );
      return {
        id: member.id,
        displayName: member.display_name,
        color: member.color,
        points: todayScore?.points || 0,
      };
    });
  }, [members, scores]);

  return (
    <div className="space-y-6">
      {/* View Tabs - Old style navigation */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className={`top-nav-btn touch-feedback focus-ring ${activeView === view.id ? 'active' : ''}`}
            >
              <Icon className="h-4 w-4 inline-block sm:mr-2" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Score display */}
        {memberScores.length > 0 && (
          <div className="hidden md:flex items-center gap-3">
            {memberScores.slice(0, 2).map((member, idx) => (
              <div key={member.id} className="score-player">
                <div
                  className="score-avatar"
                  style={{ backgroundColor: member.color }}
                >
                  {member.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-text-primary">
                    {member.points}
                  </span>
                  <span className="text-xs text-text-muted">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reset Day Button */}
        <ResetDayButton />

        {/* New Task Button */}
        <button
          onClick={handleNewTask}
          className="btn btn-primary flex items-center gap-2 touch-feedback focus-ring"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Main content based on active view - with view transitions */}
      <div key={viewKey} className="view-transition-enter">
        {activeView === 'matrix' && (
          <TaskMatrix onEditTask={handleEditTask} />
        )}

        {activeView === 'task-list' && (
          <TaskList onEditTask={handleEditTask} />
        )}

        {activeView === 'planner' && (
          <DailyPlanner onEditTask={handleEditTask} />
        )}

        {activeView === 'leaderboard' && (
          <Leaderboard />
        )}
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={isTaskFormOpen}
        onClose={handleCloseForm}
        title={editingTask ? 'Edit Task' : 'New Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;
