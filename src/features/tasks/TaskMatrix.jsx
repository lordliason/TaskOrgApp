import { useTaskStore } from '../../store/taskStore';
import TaskCard from './TaskCard';

function TaskMatrix({ onEditTask }) {
  const { tasks, isLoading } = useTaskStore();

  // Filter out completed tasks
  const activeTasks = tasks.filter((t) => t.status !== 'done');

  // Categorize tasks into quadrants
  const quadrants = {
    1: { // Do First: High Urgent, High Important
      title: 'Do First',
      subtitle: 'Urgent & Important',
      color: 'red',
      tasks: activeTasks.filter((t) => t.urgent >= 3 && t.important >= 3),
    },
    2: { // Schedule: Low Urgent, High Important
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      color: 'blue',
      tasks: activeTasks.filter((t) => t.urgent < 3 && t.important >= 3),
    },
    3: { // Delegate: High Urgent, Low Important
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      color: 'yellow',
      tasks: activeTasks.filter((t) => t.urgent >= 3 && t.important < 3),
    },
    4: { // Eliminate: Low Urgent, Low Important
      title: 'Eliminate',
      subtitle: 'Neither Urgent Nor Important',
      color: 'gray',
      tasks: activeTasks.filter((t) => t.urgent < 3 && t.important < 3),
    },
  };

  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    gray: 'border-gray-200 bg-gray-50',
  };

  const headerColors = {
    red: 'text-red-700 bg-red-100',
    blue: 'text-blue-700 bg-blue-100',
    yellow: 'text-yellow-700 bg-yellow-100',
    gray: 'text-gray-700 bg-gray-100',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(quadrants).map(([key, quadrant]) => (
        <div
          key={key}
          className={`rounded-xl border-2 ${colorClasses[quadrant.color]} min-h-[300px] flex flex-col`}
        >
          {/* Quadrant header */}
          <div className={`px-4 py-3 rounded-t-lg ${headerColors[quadrant.color]}`}>
            <h3 className="font-semibold">{quadrant.title}</h3>
            <p className="text-sm opacity-75">{quadrant.subtitle}</p>
          </div>

          {/* Tasks list */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[400px]">
            {quadrant.tasks.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No tasks in this quadrant
              </p>
            ) : (
              quadrant.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  compact
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskMatrix;
