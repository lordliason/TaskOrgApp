/**
 * Task CRUD: create, split, update, get.
 */

const { ValidationError } = require('../errors');
const {
    validateAssigneeCreate,
    validateAssigneeUpdate,
    validateSize,
    clampUrgencyImportance,
    VALID_SIZES,
    VALID_ASSIGNEES_UPDATE
} = require('../validation/taskValidation');

/**
 * Create a new task (validation + defaults). Does not persist to DB.
 * @param {object} taskData
 * @param {string|null} [organizationId=null]
 * @returns {object} Task object
 */
function createTask(taskData, organizationId = null) {
    if (!taskData.name || !taskData.assignee) {
        throw new ValidationError('Task name and assignee are required');
    }
    validateAssigneeCreate(taskData.assignee);
    validateSize(taskData.size);

    return {
        name: taskData.name,
        assignee: taskData.assignee,
        size: taskData.size || 'm',
        urgent: clampUrgencyImportance(taskData.urgent || 3),
        important: clampUrgencyImportance(taskData.important || 3),
        completed: false,
        icon: taskData.icon || null,
        first_step: taskData.first_step || null,
        completion_criteria: taskData.completion_criteria || null
    };
}

/**
 * Split a task into two subtasks.
 * @param {string} taskId
 * @param {object} splitDescription - { part1, part2, size1?, size2?, firstStep1?, firstStep2?, completionCriteria1?, completionCriteria2? }
 * @param {string|null} [organizationId=null]
 * @returns {{ originalTaskId: string, newTasks: object[], message: string }}
 */
function splitTask(taskId, splitDescription, organizationId = null) {
    if (!taskId) {
        throw new ValidationError('Task ID is required', 'taskId');
    }
    if (!splitDescription || !splitDescription.part1 || !splitDescription.part2) {
        throw new ValidationError('Split description must include both part1 and part2 task names', 'splitDescription');
    }

    const task1 = {
        name: splitDescription.part1,
        assignee: 'mario',
        size: splitDescription.size1 || 'm',
        urgent: 3,
        important: 3,
        completed: false,
        icon: '📋',
        first_step: splitDescription.firstStep1 || null,
        completion_criteria: splitDescription.completionCriteria1 || null
    };

    const task2 = {
        name: splitDescription.part2,
        assignee: 'mario',
        size: splitDescription.size2 || 'm',
        urgent: 3,
        important: 3,
        completed: false,
        icon: '📋',
        first_step: splitDescription.firstStep2 || null,
        completion_criteria: splitDescription.completionCriteria2 || null
    };

    return {
        originalTaskId: taskId,
        newTasks: [task1, task2],
        message: 'Task has been split into two subtasks.'
    };
}

/**
 * Validate and build update payload for an existing task.
 * @param {string} taskId
 * @param {object} updates
 * @param {string|null} [organizationId=null]
 * @returns {{ taskId: string, updates: object, message: string }}
 */
function updateTask(taskId, updates, organizationId = null) {
    if (!taskId) {
        throw new ValidationError('Task ID is required', 'taskId');
    }

    const validUpdates = {};

    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.assignee !== undefined) {
        validateAssigneeUpdate(updates.assignee);
        validUpdates.assignee = updates.assignee;
    }
    if (updates.size !== undefined) {
        validateSize(updates.size);
        validUpdates.size = updates.size;
    }
    if (updates.urgent !== undefined) {
        validUpdates.urgent = Math.max(1, Math.min(5, updates.urgent));
    }
    if (updates.important !== undefined) {
        validUpdates.important = Math.max(1, Math.min(5, updates.important));
    }
    if (updates.completed !== undefined) validUpdates.completed = Boolean(updates.completed);
    if (updates.icon !== undefined) validUpdates.icon = updates.icon;
    if (updates.first_step !== undefined) validUpdates.first_step = updates.first_step;
    if (updates.completion_criteria !== undefined) validUpdates.completion_criteria = updates.completion_criteria;

    return {
        taskId,
        updates: validUpdates,
        message: 'Task updated successfully.'
    };
}

/**
 * Get tasks (mock implementation; real app would query Supabase).
 * @param {object} [filters={}]
 * @param {string|null} [organizationId=null]
 * @returns {{ tasks: object[], count: number, message: string }}
 */
function getTasks(filters = {}, organizationId = null) {
    return {
        tasks: [
            { id: 'task_001', name: 'Sample task', assignee: 'mario', completed: false }
        ],
        count: 1,
        message: 'Tasks retrieved successfully.'
    };
}

module.exports = { createTask, splitTask, updateTask, getTasks };
