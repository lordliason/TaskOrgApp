import { useTaskStore } from '../../store/taskStore';
import TaskCard from './TaskCard';
import { Calendar, CheckCircle2 } from 'lucide-react';

function DailyPlanner({ onEditTask }) {
  const { tasks, isLoading } = useTaskStore();

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

  // Sort by urgency (highest first) then importance
  const sortedTasks = [...todaysTasks].sort((a, b) => {
    if (b.urgent !== a.urgent) return b.urgent - a.urgent;
    return b.important - a.important;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Today's Focus
          </h2>
          <p className="text-sm text-gray-500">
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-primary-600">
            {sortedTasks.length}
          </div>
          <div className="text-sm text-gray-500">Tasks to do</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-green-600">
            {completedToday.length}
          </div>
          <div className="text-sm text-gray-500">Completed today</div>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">To Do</h3>
        
        {sortedTasks.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900">All done!</h4>
            <p className="text-gray-500 mt-1">
              No tasks scheduled for today. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => onEditTask(task)}
              />
            ))}
          </div>
        )}

        {/* Completed section */}
        {completedToday.length > 0 && (
          <>
            <h3 className="font-medium text-gray-700 mt-8 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completed Today
            </h3>
            <div className="space-y-3 opacity-60">
              {completedToday.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DailyPlanner;
