import { useState, useRef } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { EFFORT_SIZES } from '../../lib/constants';

function TaskMatrix({ onEditTask }) {
  const { tasks, isLoading, completeTask, uncompleteTask } = useTaskStore();
  const { members } = useOrganizationStore();
  const [tooltip, setTooltip] = useState({ visible: false, task: null, x: 0, y: 0 });
  const [filter, setFilter] = useState('all'); // 'all' or member id

  // Filter out completed tasks
  const activeTasks = tasks.filter((t) => t.status !== 'done');

  // Apply member filter
  const filteredTasks = filter === 'all' 
    ? activeTasks 
    : activeTasks.filter((t) => t.assignee_id === filter);

  // Categorize tasks into quadrants
  const getQuadrantTasks = (urgentHigh, importantHigh) => {
    return filteredTasks.filter((t) => {
      const isUrgentHigh = t.urgent >= 3;
      const isImportantHigh = t.important >= 3;
      return isUrgentHigh === urgentHigh && isImportantHigh === importantHigh;
    });
  };

  const quadrants = {
    'do-first': {
      title: 'Do First',
      class: 'quadrant-do',
      tasks: getQuadrantTasks(true, true),
    },
    'schedule': {
      title: 'Schedule',
      class: 'quadrant-schedule',
      tasks: getQuadrantTasks(false, true),
    },
    'delegate': {
      title: 'Delegate',
      class: 'quadrant-delegate',
      tasks: getQuadrantTasks(true, false),
    },
    'eliminate': {
      title: 'Eliminate',
      class: 'quadrant-eliminate',
      tasks: getQuadrantTasks(false, false),
    },
  };

  // Size mapping for dots
  const sizeClasses = {
    xs: 'xs',
    s: 's',
    m: 'm',
    l: 'l',
    xl: 'xl',
  };

  const handleDotHover = (task, e) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      task,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleDotLeave = () => {
    setTooltip({ visible: false, task: null, x: 0, y: 0 });
  };

  const handleDotClick = (task) => {
    onEditTask(task);
  };

  const handleToggleComplete = async (task, e) => {
    e.stopPropagation();
    if (task.status === 'done') {
      await uncompleteTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const getAssigneeColor = (assigneeId) => {
    if (!assigneeId) return '#6b6b75';
    const member = members.find((m) => m.id === assigneeId);
    return member?.color || '#a78bfa';
  };

  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return 'Unassigned';
    const member = members.find((m) => m.id === assigneeId);
    return member?.display_name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assignee Filter */}
      <div className="assignee-filter">
        <button
          onClick={() => setFilter('all')}
          className={`assignee-filter-btn ${filter === 'all' ? 'active' : ''}`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #4a9eff, #ff7eb3)' }}
          />
          All
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => setFilter(member.id)}
            className={`assignee-filter-btn ${filter === member.id ? 'active' : ''}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            {member.display_name}
          </button>
        ))}
      </div>

      {/* Matrix Container */}
      <div className="flex flex-col">
        {/* Top axis labels */}
        <div className="grid grid-cols-[40px_1fr_1fr] mb-2">
          <div /> {/* Spacer for left labels */}
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
            Urgent
          </div>
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
            Not Urgent
          </div>
        </div>

        {/* Matrix body */}
        <div className="grid grid-cols-[40px_1fr_1fr] grid-rows-2 min-h-[500px]">
          {/* Left axis labels */}
          <div className="row-span-2 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <span className="transform -rotate-90 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-text-muted">
                Important
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="transform -rotate-90 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-text-muted">
                Not Important
              </span>
            </div>
          </div>

          {/* Quadrants - Row 1 */}
          <div className={`quadrant ${quadrants['do-first'].class}`}>
            <span className="quadrant-label">{quadrants['do-first'].title}</span>
            <div className="flex flex-wrap gap-2 pt-8 content-start">
              {quadrants['do-first'].tasks.map((task) => (
                <TaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </div>
          </div>

          <div className={`quadrant ${quadrants['schedule'].class}`}>
            <span className="quadrant-label">{quadrants['schedule'].title}</span>
            <div className="flex flex-wrap gap-2 pt-8 content-start">
              {quadrants['schedule'].tasks.map((task) => (
                <TaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </div>
          </div>

          {/* Quadrants - Row 2 */}
          <div className={`quadrant ${quadrants['delegate'].class}`}>
            <span className="quadrant-label">{quadrants['delegate'].title}</span>
            <div className="flex flex-wrap gap-2 pt-8 content-start">
              {quadrants['delegate'].tasks.map((task) => (
                <TaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </div>
          </div>

          <div className={`quadrant ${quadrants['eliminate'].class}`}>
            <span className="quadrant-label">{quadrants['eliminate'].title}</span>
            <div className="flex flex-wrap gap-2 pt-8 content-start">
              {quadrants['eliminate'].tasks.map((task) => (
                <TaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-dark-border">
        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Size:</span>
        {Object.entries(EFFORT_SIZES).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className={`task-dot ${key} bg-text-muted`}
              style={{ animation: 'none' }}
            />
            <span className="text-xs text-text-secondary">{value.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.task && (
        <div
          className="fixed bg-dark-card border border-dark-border px-4 py-3 rounded-xl text-sm z-50 max-w-[200px] shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
          }}
        >
          <div className="font-semibold text-text-primary mb-1">
            {tooltip.task.title}
          </div>
          <div className="text-xs text-text-muted">
            {getAssigneeName(tooltip.task.assignee_id)} • {EFFORT_SIZES[tooltip.task.effort]?.label || 'M'}
          </div>
        </div>
      )}
    </div>
  );
}

// Task Dot Component
function TaskDot({ task, sizeClass, color, onHover, onLeave, onClick }) {
  const isCompleted = task.status === 'done';
  
  // Show icon if present, otherwise first 2 chars of title
  const content = task.icon || task.title?.slice(0, 2).toUpperCase();

  return (
    <div
      className={`task-dot ${sizeClass} ${isCompleted ? 'completed' : ''}`}
      style={{ backgroundColor: isCompleted ? undefined : color }}
      onMouseEnter={(e) => onHover(task, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(task)}
      title={task.title}
    >
      <span className="dot-text">{content}</span>
    </div>
  );
}

export default TaskMatrix;
