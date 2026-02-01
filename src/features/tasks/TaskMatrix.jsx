import { useState, useRef } from 'react';
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
  const [dragPosition, setDragPosition] = useState(null);
  const matrixRef = useRef(null);

  // Configure drag sensor with activation constraint to distinguish from clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task);
    setTooltip({ visible: false, task: null, x: 0, y: 0 });
  };

  const handleDragMove = (event) => {
    // Track drag position for visual feedback
    if (matrixRef.current && event.delta) {
      const rect = matrixRef.current.getBoundingClientRect();
      const x = event.activatorEvent?.clientX + event.delta.x;
      const y = event.activatorEvent?.clientY + event.delta.y;

      if (x && y) {
        setDragPosition({ x, y, rect });
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active } = event;
    setActiveTask(null);
    setDragPosition(null);

    // Calculate position-based urgency and importance
    // Don't require 'over' - calculate from raw coordinates
    if (matrixRef.current) {
      const rect = matrixRef.current.getBoundingClientRect();
      const x = event.activatorEvent?.clientX + (event.delta?.x || 0);
      const y = event.activatorEvent?.clientY + (event.delta?.y || 0);

      if (x && y) {
        // The matrix has a 40px left column for labels, so we need to account for that
        const labelWidth = 40; // pixels
        const quadrantAreaWidth = rect.width - labelWidth;
        const quadrantAreaLeft = rect.left + labelWidth;

        // Check if drop is within matrix bounds
        const isWithinX = x >= quadrantAreaLeft && x <= rect.right;
        const isWithinY = y >= rect.top && y <= rect.bottom;

        if (!isWithinX || !isWithinY) {
          // Dropped outside matrix, don't update
          return;
        }

        // Calculate relative position within the quadrant area (0 to 1)
        const relativeX = Math.max(0, Math.min(1, (x - quadrantAreaLeft) / quadrantAreaWidth));
        const relativeY = Math.max(0, Math.min(1, (y - rect.top) / rect.height));

        // Map to urgency (1-5): Left = High (5), Right = Low (1)
        // Map across entire width: 0 = urgent 5, 1 = urgent 1
        const urgent = Math.max(1, Math.min(5, Math.round(5 - relativeX * 4)));

        // Map to importance (1-5): Top = High (5), Bottom = Low (1)
        // Map across entire height: 0 = important 5, 1 = important 1
        const important = Math.max(1, Math.min(5, Math.round(5 - relativeY * 4)));

        await updateTask(active.id, {
          urgent,
          important,
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

  // Calculate task position as percentage based on urgent/important (1-5 scale)
  const getTaskPosition = (task) => {
    // urgent 5 = left (0%), urgent 1 = right (100%)
    // important 5 = top (0%), important 1 = bottom (100%)
    const xPercent = ((5 - task.urgent) / 4) * 100;
    const yPercent = ((5 - task.important) / 4) * 100;
    return { x: xPercent, y: yPercent };
  };

  // Quadrant definitions for labels only
  const quadrants = {
    'do-first': {
      title: 'Do First',
      class: 'quadrant-do',
    },
    'schedule': {
      title: 'Schedule',
      class: 'quadrant-schedule',
    },
    'delegate': {
      title: 'Delegate',
      class: 'quadrant-delegate',
    },
    'eliminate': {
      title: 'Eliminate',
      class: 'quadrant-eliminate',
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
      onDragMove={handleDragMove}
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
          <DroppableMatrix matrixRef={matrixRef}>
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
            <QuadrantBackground id="do-first" quadrant={quadrants['do-first']} />
            <QuadrantBackground id="schedule" quadrant={quadrants['schedule']} />

            {/* Quadrants - Row 2 */}
            <QuadrantBackground id="delegate" quadrant={quadrants['delegate']} />
            <QuadrantBackground id="eliminate" quadrant={quadrants['eliminate']} />
          </div>

          {/* Task dots overlay - positioned absolutely based on X,Y values */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: '40px', right: 0 }}
          >
            {filteredTasks.map((task) => {
              const pos = getTaskPosition(task);
              return (
                <DraggableTaskDot
                  key={task.id}
                  task={task}
                  sizeClass={sizeClasses[task.effort] || 'm'}
                  color={getAssigneeColor(task.assignee_id)}
                  onHover={handleDotHover}
                  onLeave={handleDotLeave}
                  onClick={handleDotClick}
                  position={pos}
                />
              );
            })}
          </div>
          </DroppableMatrix>
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

// Droppable Matrix Component - makes entire matrix droppable
function DroppableMatrix({ matrixRef, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'matrix' });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (matrixRef) {
          matrixRef.current = node;
        }
      }}
      className="relative"
      style={{ position: 'relative' }}
    >
      {/* Visual grid overlay for 5 levels (1-5 scale) */}
      {/* Position grid only over quadrant area (excluding 40px label column) */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: '40px', // Account for label column
          right: 0,
          zIndex: 1
        }}
      >
        {/* Vertical lines at 25%, 50%, 75% - 50% is quadrant boundary (stronger) */}
        {[25, 50, 75].map((pct) => (
          <div
            key={`v-${pct}`}
            className={`absolute top-0 bottom-0 border-l border-dark-border ${pct === 50 ? 'opacity-50' : 'opacity-20'}`}
            style={{ left: `${pct}%` }}
          />
        ))}
        {/* Horizontal lines at 25%, 50%, 75% - 50% is quadrant boundary (stronger) */}
        {[25, 50, 75].map((pct) => (
          <div
            key={`h-${pct}`}
            className={`absolute left-0 right-0 border-t border-dark-border ${pct === 50 ? 'opacity-50' : 'opacity-20'}`}
            style={{ top: `${pct}%` }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

// Quadrant Background Component (just for visual background and label)
function QuadrantBackground({ id, quadrant }) {
  return (
    <div
      className={`quadrant ${quadrant.class}`}
      style={{ transition: 'box-shadow 0.2s ease' }}
    >
      <span className="quadrant-label">{quadrant.title}</span>
    </div>
  );
}

// Draggable Task Dot Component
function DraggableTaskDot({ task, sizeClass, color, onHover, onLeave, onClick, position }) {
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
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
        zIndex: isDragging ? 100 : 10,
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
