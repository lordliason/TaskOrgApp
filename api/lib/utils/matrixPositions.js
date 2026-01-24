/**
 * Eisenhower matrix position assignment and integration suggestions.
 */

/**
 * Assign matrix quadrant positions (do/schedule/delegate/delete) based on urgency/importance.
 * @param {Array<{id: string, urgent: number, important: number}>} tasks
 * @returns {Array<{taskId: string, position: string, reasoning: string}>}
 */
function assignMatrixPositions(tasks) {
    return tasks.map(task => {
        let position = 'do';
        if (task.urgent >= 4 && task.important >= 4) position = 'do';
        else if (task.urgent >= 4 && task.important <= 2) position = 'delegate';
        else if (task.urgent <= 2 && task.important >= 4) position = 'schedule';
        else if (task.urgent <= 2 && task.important <= 2) position = 'delete';

        return {
            taskId: task.id,
            position: position,
            reasoning: `Urgent: ${task.urgent}/5, Important: ${task.important}/5 → ${position}`
        };
    });
}

/**
 * Suggest calendar/shopping integrations based on task name and subtasks.
 * @param {string} taskName
 * @param {Array<{name: string}>} subtasks
 * @returns {Array<{type: string, action: string, details: string}>}
 */
function suggestIntegrations(taskName, subtasks) {
    const integrations = [];

    if (taskName.toLowerCase().includes('event') || taskName.toLowerCase().includes('meeting')) {
        integrations.push({
            type: 'calendar',
            action: 'schedule',
            details: `Consider adding "${taskName}" deadlines to your calendar`
        });
    }

    if (taskName.toLowerCase().includes('buy') || taskName.toLowerCase().includes('purchase') || taskName.toLowerCase().includes('shop')) {
        integrations.push({
            type: 'shopping',
            action: 'add_items',
            details: `Create shopping list for "${taskName}"`
        });
    }

    subtasks.forEach(subtask => {
        if (subtask.name.toLowerCase().includes('research') || subtask.name.toLowerCase().includes('call')) {
            integrations.push({
                type: 'calendar',
                action: 'block_time',
                details: `Block time for "${subtask.name}"`
            });
        }
    });

    return integrations;
}

module.exports = { assignMatrixPositions, suggestIntegrations };
