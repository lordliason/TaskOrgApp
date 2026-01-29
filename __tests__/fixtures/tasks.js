/**
 * Test fixtures for task-related data
 * Provides realistic test data for various scenarios
 */

const baseTask = {
  id: 'task_123',
  name: 'Test Task',
  assignee: 'mario',
  size: 'm',
  urgent: 3,
  important: 3,
  completed: false,
  icon: '📋',
  first_step: null,
  completion_criteria: null,
  deadline: null,
  depends_on: null,
  parent_task_id: null,
  organization_id: 'org_test',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const taskFixtures = {
  // Basic valid tasks
  simple: {
    ...baseTask
  },

  completed: {
    ...baseTask,
    completed: true,
    updated_at: '2025-01-02T00:00:00Z'
  },

  withDeadline: {
    ...baseTask,
    deadline: '2025-12-31',
    urgent: 4,
    important: 4
  },

  withDependencies: {
    ...baseTask,
    depends_on: ['task_122']
  },

  urgent: {
    ...baseTask,
    urgent: 5,
    important: 2,
    name: 'Urgent Task'
  },

  important: {
    ...baseTask,
    urgent: 2,
    important: 5,
    name: 'Important Task'
  },

  // Task collections
  taskList: [
    { ...baseTask, id: 'task_1', name: 'Task One', assignee: 'mario' },
    { ...baseTask, id: 'task_2', name: 'Task Two', assignee: 'maria' },
    { ...baseTask, id: 'task_3', name: 'Task Three', assignee: 'both' }
  ],

  // Eisenhower matrix positions
  matrixTasks: [
    { ...baseTask, id: 'do_1', name: 'Do Task', urgent: 5, important: 5 },
    { ...baseTask, id: 'schedule_1', name: 'Schedule Task', urgent: 2, important: 5 },
    { ...baseTask, id: 'delegate_1', name: 'Delegate Task', urgent: 5, important: 2 },
    { ...baseTask, id: 'delete_1', name: 'Delete Task', urgent: 2, important: 2 }
  ],

  // Parent-child relationships
  parentTask: {
    ...baseTask,
    id: 'parent_1',
    name: 'Parent Task',
    size: 'xl'
  },

  subTasks: [
    {
      ...baseTask,
      id: 'sub_1',
      name: 'Subtask One',
      parent_task_id: 'parent_1',
      size: 's'
    },
    {
      ...baseTask,
      id: 'sub_2',
      name: 'Subtask Two',
      parent_task_id: 'parent_1',
      size: 'm',
      depends_on: ['sub_1']
    }
  ],

  // Task creation payloads
  createPayloads: {
    minimal: {
      name: 'New Task',
      assignee: 'mario'
    },

    full: {
      name: 'Complete Task',
      assignee: 'maria',
      size: 'l',
      urgent: 4,
      important: 5,
      icon: '🚀',
      first_step: 'Start here',
      completion_criteria: 'Done when complete'
    },

    invalid: {
      assignee: 'mario' // missing name
    }
  },

  // Update payloads
  updatePayloads: {
    name: { name: 'Updated Name' },
    status: { completed: true },
    priority: { urgent: 5, important: 4 },
    multiple: {
      name: 'Updated Task',
      size: 'l',
      urgent: 4,
      important: 5,
      completed: true
    }
  },

  // Edge cases
  edgeCases: {
    emptyName: { ...baseTask, name: '' },
    longName: { ...baseTask, name: 'A'.repeat(500) },
    invalidAssignee: { ...baseTask, assignee: 'invalid' },
    invalidSize: { ...baseTask, size: 'invalid' },
    outOfRangeUrgent: { ...baseTask, urgent: 10 },
    negativeImportant: { ...baseTask, important: -1 },
    invalidDeadline: { ...baseTask, deadline: 'invalid-date' },
    circularDependency: { ...baseTask, depends_on: ['task_123'] } // depends on itself
  }
};

// Helper functions to generate dynamic fixtures
const createTaskFixture = (overrides = {}) => ({
  ...baseTask,
  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  ...overrides
});

const createTaskList = (count, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => ({
    ...baseTask,
    id: `task_${index + 1}`,
    name: `Task ${index + 1}`,
    ...overrides
  }));
};

const createDecompositionFixture = (parentOverrides = {}, subTaskOverrides = []) => ({
  parentTask: {
    ...baseTask,
    size: 'xl',
    ...parentOverrides
  },
  subtasks: subTaskOverrides.length > 0 ? subTaskOverrides.map((override, index) => ({
    ...baseTask,
    id: `sub_${index + 1}`,
    parent_task_id: 'parent_1',
    size: 'm',
    ...override
  })) : [
    { ...baseTask, id: 'sub_1', name: 'Subtask 1', parent_task_id: 'parent_1' },
    { ...baseTask, id: 'sub_2', name: 'Subtask 2', parent_task_id: 'parent_1' }
  ]
});

module.exports = {
  baseTask,
  taskFixtures,
  createTaskFixture,
  createTaskList,
  createDecompositionFixture
};