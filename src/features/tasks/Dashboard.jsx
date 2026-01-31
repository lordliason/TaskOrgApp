import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import TaskMatrix from './TaskMatrix';
import DailyPlanner from './DailyPlanner';
import TaskForm from './TaskForm';
import Leaderboard from '../gamification/Leaderboard';
import Modal from '../../components/Modal';
import { Plus, LayoutGrid, Calendar, Trophy, List } from 'lucide-react';

function Dashboard() {
  const { profile, organization } = useAuthStore();
  const { tasks, fetchTasks, subscribeToTasks, unsubscribe } = useTaskStore();
  const { members, scores, fetchMembers, fetchScores } = useOrganizationStore();
  
  const [activeView, setActiveView] = useState('matrix');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

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

  const handleNewTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const views = [
    { id: 'matrix', label: 'Matrix', icon: LayoutGrid },
    { id: 'planner', label: "Today's Plan", icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  // Calculate today's scores for the header
  const todayStr = new Date().toISOString().split('T')[0];
  const memberScores = members.map((member) => {
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

  return (
    <div className="space-y-6">
      {/* View Tabs - Old style navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`top-nav-btn ${activeView === view.id ? 'active' : ''}`}
            >
              <Icon className="h-4 w-4 inline-block mr-2" />
              {view.label}
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

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

        {/* New Task Button */}
        <button
          onClick={handleNewTask}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Main content based on active view */}
      {activeView === 'matrix' && (
        <TaskMatrix onEditTask={handleEditTask} />
      )}
      
      {activeView === 'planner' && (
        <DailyPlanner onEditTask={handleEditTask} />
      )}
      
      {activeView === 'leaderboard' && (
        <Leaderboard />
      )}

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
