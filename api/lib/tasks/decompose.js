/**
 * Task decomposition: decompose, refine, finalize.
 */

const { calculateDeadline, parseDeadline } = require('../utils/dateCalc');
const { assignMatrixPositions, suggestIntegrations } = require('../utils/matrixPositions');
const { reviewDecomposition } = require('../utils/decomposeHelpers');

// Default assignee when none specified - uses 'all' for team tasks
const DEFAULT_ASSIGNEE = 'all';

/**
 * Decompose a large task into subtasks with dependencies.
 * @param {object} taskDescription - { name, assignee?, deadline?, urgent?, important?, icon?, firstStep?, completionCriteria? }
 * @param {string|null} [organizationId=null]
 * @returns {{ parentTask: object, subtasks: object[], message: string, matrix_positions: object[], integrations: object[] }}
 */
function decomposeTask(taskDescription, organizationId = null) {
    if (!taskDescription || !taskDescription.name) {
        throw new Error('Task name is required for decomposition');
    }

    const parentTaskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const parentTask = {
        id: parentTaskId,
        name: taskDescription.name,
        assignee: taskDescription.assignee || 'all',
        size: 'xl',
        urgent: taskDescription.urgent || 3,
        important: taskDescription.important || 3,
        completed: false,
        icon: taskDescription.icon || '📋',
        first_step: taskDescription.firstStep || null,
        completion_criteria: taskDescription.completionCriteria || null,
        deadline: taskDescription.deadline || null,
        depends_on: null,
        parent_task_id: null,
        organization_id: organizationId,
        created_at: new Date().toISOString()
    };

    const subtaskCount = Math.floor(Math.random() * 4) + 3;
    const subtasks = [];

    for (let i = 0; i < subtaskCount; i++) {
        const subtaskId = `task_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const subtask = {
            id: subtaskId,
            name: `Subtask ${i + 1} for "${taskDescription.name}"`,
            // Use parent's assignee or default to 'all' for team distribution
            assignee: taskDescription.assignee || DEFAULT_ASSIGNEE,
            size: ['s', 'm', 'l'][Math.floor(Math.random() * 3)],
            urgent: Math.floor(Math.random() * 3) + 2,
            important: Math.floor(Math.random() * 3) + 2,
            completed: false,
            icon: '✅',
            first_step: `Start working on subtask ${i + 1}`,
            completion_criteria: `Complete subtask ${i + 1} requirements`,
            deadline: calculateDeadline(i, taskDescription.deadline),
            depends_on: i > 0 ? [subtasks[i - 1].id] : null,
            parent_task_id: parentTaskId,
            organization_id: organizationId,
            created_at: new Date().toISOString()
        };
        subtasks.push(subtask);
    }

    return {
        parentTask,
        subtasks,
        message: `Task "${taskDescription.name}" has been decomposed into ${subtasks.length} subtasks.`,
        matrix_positions: assignMatrixPositions(subtasks),
        integrations: suggestIntegrations(taskDescription.name, subtasks)
    };
}

/**
 * Refine decomposition based on user answers.
 * @param {object} originalDecomposition - { parentTask, subtasks }
 * @param {Array<{ question: string, response: string }>} userAnswers
 * @returns {{ parentTask: object, subtasks: object[], message: string, matrix_positions: object[], integrations: object[] }}
 */
function refineDecomposition(originalDecomposition, userAnswers) {
    const { parentTask, subtasks } = originalDecomposition;
    let refinedParentTask = { ...parentTask };
    let refinedSubtasks = [...subtasks];

    for (const answer of userAnswers) {
        const question = answer.question.toLowerCase();
        const response = answer.response.toLowerCase();

        if (question.includes('deadline') || question.includes('when')) {
            if (question.includes('overall')) {
                refinedParentTask.deadline = parseDeadline(response);
            }
        }

        if (question.includes('budget') || question.includes('cost')) {
            refinedParentTask.completion_criteria = refinedParentTask.completion_criteria
                ? `${refinedParentTask.completion_criteria}. Budget: ${response}`
                : `Budget: ${response}`;
        }

        // Workload balancing now happens at the UI level based on organization members
        // The AI can suggest reassignments but the actual member IDs are provided by the client
        if (question.includes('balance') || question.includes('workload')) {
            // Note: Workload balancing should be handled by the client-side
            // which has access to the actual organization member IDs
            refinedParentTask.completion_criteria = refinedParentTask.completion_criteria
                ? `${refinedParentTask.completion_criteria}. Workload preference: ${response}`
                : `Workload preference: ${response}`;
        }

        if (question.includes('first step') || question.includes('start')) {
            refinedParentTask.first_step = response;
        }

        if (question.includes('realistic') || question.includes('urgent')) {
            if (response.includes('no') || response.includes('extend')) {
                refinedSubtasks = refinedSubtasks.map(task => {
                    if (task.urgent >= 4 && task.deadline) {
                        const deadline = new Date(task.deadline);
                        deadline.setDate(deadline.getDate() + 2);
                        task.deadline = deadline.toISOString().split('T')[0];
                    }
                    return task;
                });
            }
        }

        if (question.includes('dependency') || question.includes('order')) {
            refinedSubtasks = refinedSubtasks.map((task, index) => {
                if (index === 0) {
                    task.depends_on = null;
                } else {
                    task.depends_on = [refinedSubtasks[index - 1].id];
                }
                return task;
            });
        }
    }

    if (refinedParentTask.deadline && refinedParentTask.deadline !== parentTask.deadline) {
        refinedSubtasks = refinedSubtasks.map((task, index) => ({
            ...task,
            deadline: calculateDeadline(index, refinedParentTask.deadline)
        }));
    }

    return {
        parentTask: refinedParentTask,
        subtasks: refinedSubtasks,
        message: 'Decomposition refined based on your answers.',
        matrix_positions: assignMatrixPositions(refinedSubtasks),
        integrations: suggestIntegrations(refinedParentTask.name, refinedSubtasks)
    };
}

/**
 * Finalize decomposition for DB insertion.
 * @param {object} decomposition - { parentTask, subtasks }
 * @returns {object} Finalized result with summary, next_steps, etc.
 */
function finalizeDecomposition(decomposition) {
    const { parentTask, subtasks } = decomposition;

    // Count tasks by assignee dynamically
    const assigneeCounts = {};
    subtasks.forEach(t => {
        const assignee = t.assignee_id || t.assignee || 'unassigned';
        assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;
    });

    return {
        success: true,
        parentTask,
        subtasks,
        summary: {
            totalTasks: subtasks.length + 1,
            assigneeCounts, // Dynamic count by assignee ID
            sharedTasks: subtasks.filter(t => t.assignee === 'all' || t.assignee === 'both').length,
            deadlines: subtasks.filter(t => t.deadline).length,
            dependencies: subtasks.filter(t => t.depends_on && t.depends_on.length > 0).length
        },
        matrix_positions: assignMatrixPositions(subtasks),
        integrations: suggestIntegrations(parentTask.name, subtasks),
        next_steps: [
            'Review the Eisenhower matrix positions for prioritization',
            'Add important deadlines to your calendar',
            'Consider the suggested integrations',
            'Start with the highest priority tasks'
        ],
        message: `Perfect! Your task "${parentTask.name}" has been successfully decomposed into ${subtasks.length} manageable subtasks.`
    };
}

module.exports = {
    decomposeTask,
    refineDecomposition,
    finalizeDecomposition
};
