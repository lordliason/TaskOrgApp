/**
 * Decomposition review helpers: circular dependency check, confidence, suggestions.
 */

/**
 * Check for circular dependencies in task list.
 * @param {Array<{id: string, depends_on?: string[]}>} tasks
 * @returns {boolean}
 */
function checkCircularDependencies(tasks) {
    for (const task of tasks) {
        if (task.depends_on) {
            for (const depId of task.depends_on) {
                const depTask = tasks.find(t => t.id === depId);
                if (depTask && depTask.depends_on && depTask.depends_on.includes(task.id)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Calculate confidence level from issue count.
 * @param {string[]} issues
 * @param {Array} subtasks
 * @returns {'high'|'medium'|'low'}
 */
function calculateConfidence(issues, subtasks) {
    if (issues.length === 0) return 'high';
    if (issues.length <= 2) return 'medium';
    return 'low';
}

/**
 * Generate improvement suggestions from issues.
 * @param {string[]} issues
 * @param {Array} subtasks
 * @returns {string[]}
 */
function generateSuggestions(issues, subtasks) {
    const suggestions = [];

    if (issues.includes('Unbalanced workload')) {
        suggestions.push('Consider redistributing some tasks to balance the workload');
    }

    if (issues.includes('Potentially unrealistic urgent deadlines')) {
        suggestions.push('Consider extending some deadlines or reducing urgency levels');
    }

    if (issues.includes('Missing deadline for parent task')) {
        suggestions.push('Setting a clear deadline helps with prioritization');
    }

    return suggestions;
}

/**
 * Review a decomposition for completeness and quality.
 * @param {{ parentTask: object, subtasks: Array }} decomposition
 * @param {boolean} [isRefinement=false]
 * @returns {{ isComplete: boolean, confidence: string, issues: string[], questions: string[], suggestions: string[] }}
 */
function reviewDecomposition(decomposition, isRefinement = false) {
    const { parentTask, subtasks } = decomposition;
    const issues = [];
    const questions = [];
    const strictMode = !isRefinement;

    if (!parentTask.deadline && (parentTask.urgent >= 4 || parentTask.important >= 4)) {
        if (strictMode) {
            issues.push('Missing deadline for urgent/important task');
            questions.push('What\'s the overall deadline for this task?');
        }
    }

    if (!parentTask.first_step && parentTask.size === 'xl' && strictMode) {
        issues.push('Missing first step for complex task');
        questions.push('What would be a good first step to get started?');
    }

    if (parentTask.name.toLowerCase().includes('buy') ||
        parentTask.name.toLowerCase().includes('purchase') ||
        parentTask.name.toLowerCase().includes('cost') ||
        parentTask.name.toLowerCase().includes('budget')) {
        if (!parentTask.completion_criteria || !parentTask.completion_criteria.includes('budget')) {
            if (strictMode) {
                issues.push('Budget not considered');
                questions.push('What\'s your budget for this task?');
            }
        }
    }

    const marioTasks = subtasks.filter(t => t.assignee === 'mario').length;
    const mariaTasks = subtasks.filter(t => t.assignee === 'maria').length;
    const bothTasks = subtasks.filter(t => t.assignee === 'both').length;
    const allTasks = subtasks.filter(t => t.assignee === 'all').length;
    const totalAssignedTasks = marioTasks + mariaTasks + bothTasks + allTasks;
    if (totalAssignedTasks > 0 && Math.abs(marioTasks - mariaTasks) > 2 && subtasks.length > 3) {
        if (strictMode) {
            issues.push('Unbalanced workload');
            questions.push('Would you prefer to balance the workload differently between team members?');
        }
    }

    const today = new Date();
    const urgentTasks = subtasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return daysUntil < 2 && t.urgent >= 4;
    });

    if (urgentTasks.length > 0 && strictMode) {
        issues.push('Potentially unrealistic urgent deadlines');
        questions.push('Are these urgent deadlines realistic given the task complexity?');
    }

    const hasCircularDeps = checkCircularDependencies(subtasks);
    if (hasCircularDeps) {
        issues.push('Circular dependencies detected');
        questions.push('Can you clarify the dependency relationships between these tasks?');
    }

    let confidence = calculateConfidence(issues, subtasks);
    if (isRefinement && confidence === 'low' && issues.length <= 1) {
        confidence = 'medium';
    }

    const isComplete = isRefinement ? (issues.length <= 1 && !hasCircularDeps) : (issues.length === 0);

    return {
        isComplete,
        confidence,
        issues,
        questions: questions.slice(0, 2),
        suggestions: generateSuggestions(issues, subtasks)
    };
}

module.exports = {
    checkCircularDependencies,
    calculateConfidence,
    generateSuggestions,
    reviewDecomposition
};
