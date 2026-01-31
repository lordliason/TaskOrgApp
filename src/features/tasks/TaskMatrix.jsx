import { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useTaskStore } from '../../store/taskStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { EFFORT_SIZES } from '../../lib/constants';

function TaskMatrix({ onEditTask }) {
  const { tasks, isLoading, completeTask, uncompleteTask, updateTask } = useTaskStore();
  const { members } = useOrganizationStore();
  const [tooltip, setTooltip] = useState({ visible: false, task: null, x: 0, y: 0 });
  const [filter, setFilter] = useState('all'); // 'all' or member id
  const [activeTask, setActiveTask] = useState(null);

  // Configure drag sensor with activation constraint to distinguish from clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Quadrant mappings for drag & drop
  const quadrantValues = {
    'do-first': { urgent: 5, important: 5 },
    'schedule': { urgent: 1, important: 5 },
    'delegate': { urgent: 5, important: 1 },
    'eliminate': { urgent: 1, important: 1 },
  };

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task);
    setTooltip({ visible: false, task: null, x: 0, y: 0 });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      const quadrantId = over.id;
      const values = quadrantValues[quadrantId];
      
      if (values) {
        await updateTask(active.id, {
          urgent: values.urgent,
          important: values.important,
        });
      }
    }
  };

  // Filter out completed tasks
  const activeTasks = tasks.filter((t) => t.status !== 'done');

  // Apply member filter
  const filteredTasks = filter === 'all' 
    ? activeTasks 
    : activeTasks.filter((t) => t.assignee_id === filter);

  // Categorize tasks into quadrants and sort by urgency and importance
  const getQuadrantTasks = (urgentHigh, importantHigh) => {
    return filteredTasks
      .filter((t) => {
        const isUrgentHigh = t.urgent >= 3;
        const isImportantHigh = t.important >= 3;
        return isUrgentHigh === urgentHigh && isImportantHigh === importantHigh;
      })
      .sort((a, b) => {
        // Sort by urgency first (descending - higher urgency first)
        if (b.urgent !== a.urgent) {
          return b.urgent - a.urgent;
        }
        // Then by importance (descending - higher importance first)
        return b.important - a.important;
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
    return member?.display_name?.split(' ')[0] || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              {member.display_name?.split(' ')[0]}
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
            <DroppableQuadrant id="do-first" quadrant={quadrants['do-first']}>
              {quadrants['do-first'].tasks.map((task) => (
                <DraggableTaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </DroppableQuadrant>

            <DroppableQuadrant id="schedule" quadrant={quadrants['schedule']}>
              {quadrants['schedule'].tasks.map((task) => (
                <DraggableTaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </DroppableQuadrant>

            {/* Quadrants - Row 2 */}
            <DroppableQuadrant id="delegate" quadrant={quadrants['delegate']}>
              {quadrants['delegate'].tasks.map((task) => (
                <DraggableTaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </DroppableQuadrant>

            <DroppableQuadrant id="eliminate" quadrant={quadrants['eliminate']}>
              {quadrants['eliminate'].tasks.map((task) => (
                <DraggableTaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                />
              ))}
            </DroppableQuadrant>
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
        {tooltip.visible && tooltip.task && !activeTask && (
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div
            className={`task-dot ${sizeClasses[activeTask.effort] || 'm'}`}
            style={{ 
              backgroundColor: getAssigneeColor(activeTask.assignee_id),
              cursor: 'grabbing',
              opacity: 0.9,
              transform: 'scale(1.1)',
            }}
          >
            <span className="dot-text">
              {activeTask.icon || activeTask.title?.slice(0, 2).toUpperCase()}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Quadrant Component
function DroppableQuadrant({ id, quadrant, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`quadrant ${quadrant.class} ${isOver ? 'ring-2 ring-accent-blue ring-inset' : ''}`}
      style={{ transition: 'box-shadow 0.2s ease' }}
    >
      <span className="quadrant-label">{quadrant.title}</span>
      <div className="flex flex-wrap gap-2 pt-8 content-start">
        {children}
      </div>
    </div>
  );
}

// Draggable Task Dot Component
function DraggableTaskDot({ task, sizeClass, color, onHover, onLeave, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  const isCompleted = task.status === 'done';
  const content = task.icon || task.title?.slice(0, 2).toUpperCase();

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`task-dot ${sizeClass} ${isCompleted ? 'completed' : ''} ${isDragging ? 'opacity-50' : ''}`}
      style={{ 
        backgroundColor: isCompleted ? undefined : color,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onMouseEnter={(e) => !isDragging && onHover(task, e)}
      onMouseLeave={onLeave}
      onClick={() => !isDragging && onClick(task)}
      title={task.title}
    >
      <span className="dot-text">{content}</span>
    </div>
  );
}

export default TaskMatrix;
