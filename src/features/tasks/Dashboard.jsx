import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import TaskMatrix from './TaskMatrix';
import DailyPlanner from './DailyPlanner';
import TaskForm from './TaskForm';
import Leaderboard from '../gamification/Leaderboard';
import Modal from '../../components/Modal';
import { Plus, LayoutGrid, Calendar, Trophy } from 'lucide-react';

function Dashboard() {
  const { profile, organization } = useAuthStore();
  const { fetchTasks, subscribeToTasks, unsubscribe } = useTaskStore();
  const { fetchMembers, fetchScores } = useOrganizationStore();
  
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
    { id: 'planner', label: 'Today', icon: Calendar },
    { id: 'leaderboard', label: 'Scores', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Header with view switcher and new task button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {view.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNewTask}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
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
