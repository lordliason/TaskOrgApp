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
    const { active, over } = event;
    setActiveTask(null);
    setDragPosition(null);

    // Calculate position-based urgency and importance
    if (over && matrixRef.current) {
      const rect = matrixRef.current.getBoundingClientRect();
      const x = event.activatorEvent?.clientX + (event.delta?.x || 0);
      const y = event.activatorEvent?.clientY + (event.delta?.y || 0);

      if (x && y) {
        // The matrix has a 40px left column for labels, so we need to account for that
        // The actual quadrant area is divided into 2 columns
        const labelWidth = 40; // pixels
        const quadrantAreaWidth = rect.width - labelWidth;
        const quadrantAreaLeft = rect.left + labelWidth;

        // Calculate relative position within the quadrant area (0 to 1)
        const relativeX = Math.max(0, Math.min(1, (x - quadrantAreaLeft) / quadrantAreaWidth));
        const relativeY = Math.max(0, Math.min(1, (y - rect.top) / rect.height));

        // Map to urgency (1-5): Left = High (5), Right = Low (1)
        // We divide the width into 5 zones, but we have 2 columns (urgent vs not urgent)
        // Left half (0-0.5) maps to urgent 3-5, right half (0.5-1.0) maps to urgent 1-3
        let urgent;
        if (relativeX < 0.5) {
          // Left column: urgent 3-5 (more urgent)
          const posInColumn = relativeX * 2; // normalize to 0-1 within left column
          urgent = Math.max(3, Math.min(5, Math.round(5 - posInColumn * 2)));
        } else {
          // Right column: urgent 1-3 (less urgent)
          const posInColumn = (relativeX - 0.5) * 2; // normalize to 0-1 within right column
          urgent = Math.max(1, Math.min(3, Math.round(3 - posInColumn * 2)));
        }

        // Map to importance (1-5): Top = High (5), Bottom = Low (1)
        // We divide the height into 5 zones across 2 rows
        // Top row (0-0.5) maps to important 3-5, bottom row (0.5-1.0) maps to important 1-3
        let important;
        if (relativeY < 0.5) {
          // Top row: important 3-5 (more important)
          const posInRow = relativeY * 2; // normalize to 0-1 within top row
          important = Math.max(3, Math.min(5, Math.round(5 - posInRow * 2)));
        } else {
          // Bottom row: important 1-3 (less important)
          const posInRow = (relativeY - 0.5) * 2; // normalize to 0-1 within bottom row
          important = Math.max(1, Math.min(3, Math.round(3 - posInRow * 2)));
        }

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
      {/* Visual grid overlay for 5x5 levels */}
      {/* Position grid only over quadrant area (excluding 40px label column) */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: '40px', // Account for label column
          right: 0,
          zIndex: 1
        }}
      >
        {/* Vertical lines - 3 lines dividing each column into 3 sub-zones (for levels 3-5 and 1-3) */}
        {/* Left column (urgent): divide into 3 zones for levels 5, 4, 3 */}
        {[1/6, 2/6, 3/6].map((ratio, i) => (
          <div
            key={`v-left-${i}`}
            className="absolute top-0 bottom-0 border-l border-dark-border opacity-20"
            style={{ left: `${ratio * 100}%` }}
          />
        ))}
        {/* Right column (not urgent): divide into 3 zones for levels 3, 2, 1 */}
        {[4/6, 5/6].map((ratio, i) => (
          <div
            key={`v-right-${i}`}
            className="absolute top-0 bottom-0 border-l border-dark-border opacity-20"
            style={{ left: `${ratio * 100}%` }}
          />
        ))}
        {/* Horizontal lines - 3 lines dividing each row into 3 sub-zones */}
        {/* Top row (important): divide into 3 zones for levels 5, 4, 3 */}
        {[1/6, 2/6, 3/6].map((ratio, i) => (
          <div
            key={`h-top-${i}`}
            className="absolute left-0 right-0 border-t border-dark-border opacity-20"
            style={{ top: `${ratio * 100}%` }}
          />
        ))}
        {/* Bottom row (not important): divide into 3 zones for levels 3, 2, 1 */}
        {[4/6, 5/6].map((ratio, i) => (
          <div
            key={`h-bottom-${i}`}
            className="absolute left-0 right-0 border-t border-dark-border opacity-20"
            style={{ top: `${ratio * 100}%` }}
          />
        ))}
        {/* Main dividing lines (stronger opacity) */}
        <div
          className="absolute top-0 bottom-0 border-l border-dark-border opacity-40"
          style={{ left: '50%' }} // Divides urgent vs not urgent
        />
        <div
          className="absolute left-0 right-0 border-t border-dark-border opacity-40"
          style={{ top: '50%' }} // Divides important vs not important
        />
      </div>
      {children}
    </div>
  );
}

// Droppable Quadrant Component
function DroppableQuadrant({ id, quadrant, children }) {
  // No longer using useDroppable here since the entire matrix is droppable
  return (
    <div
      className={`quadrant ${quadrant.class}`}
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
