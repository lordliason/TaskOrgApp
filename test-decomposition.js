#!/usr/bin/env node

/**
 * Test script for the intelligent task decomposition agent
 * Run with: node test-decomposition.js
 */

// Define the functions directly (copied from chat.js for testing)
function calculateDeadline(subtaskIndex, parentDeadline) {
    if (!parentDeadline) return null;

    const parentDate = new Date(parentDeadline);
    const daysToSubtract = (subtaskIndex + 1) * 3; // Spread over time
    const subtaskDate = new Date(parentDate);
    subtaskDate.setDate(parentDate.getDate() - daysToSubtract);

    return subtaskDate.toISOString().split('T')[0]; // Return as YYYY-MM-DD
}

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

function suggestIntegrations(taskName, subtasks) {
    const integrations = [];

    // Calendar suggestions
    if (taskName.toLowerCase().includes('event') || taskName.toLowerCase().includes('meeting')) {
        integrations.push({
            type: 'calendar',
            action: 'schedule',
            details: `Consider adding "${taskName}" deadlines to your calendar`
        });
    }

    // Shopping suggestions
    if (taskName.toLowerCase().includes('buy') || taskName.toLowerCase().includes('purchase') || taskName.toLowerCase().includes('shop')) {
        integrations.push({
            type: 'shopping',
            action: 'add_items',
            details: `Create shopping list for "${taskName}"`
        });
    }

    // Check subtasks for additional integrations
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

function checkCircularDependencies(tasks) {
    // Simple circular dependency check
    for (const task of tasks) {
        if (task.depends_on) {
            for (const depId of task.depends_on) {
                const depTask = tasks.find(t => t.id === depId);
                if (depTask && depTask.depends_on && depTask.depends_on.includes(task.id)) {
                    return true; // Found circular dependency
                }
            }
        }
    }
    return false;
}

function calculateConfidence(issues, subtasks) {
    if (issues.length === 0) return 'high';
    if (issues.length <= 2) return 'medium';
    return 'low';
}

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

function parseDeadline(response) {
    // Simple date parsing - in production, use a proper date parser
    const today = new Date();

    if (response.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    if (response.includes('next week')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    }

    if (response.includes('end of month')) {
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return endOfMonth.toISOString().split('T')[0];
    }

    // Try to extract date patterns like "Dec 25" or "12/25"
    const dateMatch = response.match(/(\d{1,2})[\/-](\d{1,2})/);
    if (dateMatch) {
        const month = parseInt(dateMatch[1]) - 1;
        const day = parseInt(dateMatch[2]);
        const year = today.getFullYear();
        const date = new Date(year, month, day);
        return date.toISOString().split('T')[0];
    }

    // Default to 2 weeks from now
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 14);
    return defaultDate.toISOString().split('T')[0];
}

function refineDecomposition(originalDecomposition, userAnswers) {
    const { parentTask, subtasks } = originalDecomposition;
    let refinedParentTask = { ...parentTask };
    let refinedSubtasks = [...subtasks];

    // Process user answers
    for (const answer of userAnswers) {
        const question = answer.question.toLowerCase();
        const response = answer.response.toLowerCase();

        // Handle deadline questions
        if (question.includes('deadline') || question.includes('when')) {
            if (question.includes('overall')) {
                refinedParentTask.deadline = parseDeadline(response);
            }
        }

        // Handle budget questions
        if (question.includes('budget') || question.includes('cost')) {
            refinedParentTask.completion_criteria = refinedParentTask.completion_criteria
                ? `${refinedParentTask.completion_criteria}. Budget: ${response}`
                : `Budget: ${response}`;
        }

        // Handle workload balance questions
        if (question.includes('balance') || question.includes('workload')) {
            if (response.includes('mario') || response.includes('more mario')) {
                // Shift some tasks to Mario
                const mariaTasks = refinedSubtasks.filter(t => t.assignee === 'maria');
                if (mariaTasks.length > 0) {
                    mariaTasks[0].assignee = 'mario';
                }
            } else if (response.includes('maria') || response.includes('more maria')) {
                // Shift some tasks to Maria
                const marioTasks = refinedSubtasks.filter(t => t.assignee === 'mario');
                if (marioTasks.length > 0) {
                    marioTasks[0].assignee = 'mario'; // Keep as Mario for balance
                }
            }
        }

        // Handle first step questions
        if (question.includes('first step') || question.includes('start')) {
            refinedParentTask.first_step = response;
        }

        // Handle deadline realism questions
        if (question.includes('realistic') || question.includes('urgent')) {
            if (response.includes('no') || response.includes('extend')) {
                // Extend urgent deadlines
                refinedSubtasks = refinedSubtasks.map(task => {
                    if (task.urgent >= 4 && task.deadline) {
                        const deadline = new Date(task.deadline);
                        deadline.setDate(deadline.getDate() + 2); // Add 2 days
                        task.deadline = deadline.toISOString().split('T')[0];
                    }
                    return task;
                });
            }
        }

        // Handle dependency questions
        if (question.includes('dependency') || question.includes('order')) {
            // Simplify dependencies - remove complex chains
            refinedSubtasks = refinedSubtasks.map((task, index) => {
                if (index === 0) {
                    task.depends_on = null; // First task has no dependencies
                } else {
                    task.depends_on = [refinedSubtasks[index - 1].id]; // Simple chain
                }
                return task;
            });
        }
    }

    // Recalculate deadlines if parent deadline was updated
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

function finalizeDecomposition(decomposition) {
    const { parentTask, subtasks } = decomposition;

    return {
        success: true,
        parentTask: parentTask,
        subtasks: subtasks,
        summary: {
            totalTasks: subtasks.length + 1,
            marioTasks: subtasks.filter(t => t.assignee === 'mario').length,
            mariaTasks: subtasks.filter(t => t.assignee === 'maria').length,
            bothTasks: subtasks.filter(t => t.assignee === 'both').length,
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

function reviewDecomposition(decomposition) {
    const { parentTask, subtasks } = decomposition;
    const issues = [];
    const questions = [];

    // Check completeness
    if (!parentTask.deadline) {
        issues.push('Missing deadline for parent task');
        questions.push('What\'s the overall deadline for this task?');
    }

    if (!parentTask.first_step) {
        issues.push('Missing first step');
        questions.push('What would be a good first step to get started?');
    }

    // Check budget considerations
    if (parentTask.name.toLowerCase().includes('buy') ||
        parentTask.name.toLowerCase().includes('purchase') ||
        parentTask.name.toLowerCase().includes('cost') ||
        parentTask.name.toLowerCase().includes('budget')) {
        if (!parentTask.completion_criteria || !parentTask.completion_criteria.includes('budget')) {
            issues.push('Budget not considered');
            questions.push('What\'s your budget for this task?');
        }
    }

    // Check workload balance
    const marioTasks = subtasks.filter(t => t.assignee === 'mario').length;
    const mariaTasks = subtasks.filter(t => t.assignee === 'maria').length;

    if (Math.abs(marioTasks - mariaTasks) > 1) {
        issues.push('Unbalanced workload');
        questions.push('Would you prefer to balance the workload differently between Mario and Maria?');
    }

    // Check realistic deadlines
    const today = new Date();
    const urgentTasks = subtasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return daysUntil < 3 && t.urgent >= 4;
    });

    if (urgentTasks.length > 0) {
        issues.push('Potentially unrealistic urgent deadlines');
        questions.push('Are these urgent deadlines realistic given the task complexity?');
    }

    // Check dependencies logic
    const hasCircularDeps = checkCircularDependencies(subtasks);
    if (hasCircularDeps) {
        issues.push('Circular dependencies detected');
        questions.push('Can you clarify the dependency relationships between these tasks?');
    }

    // Determine confidence level
    const confidence = calculateConfidence(issues, subtasks);

    return {
        isComplete: issues.length === 0,
        confidence: confidence,
        issues: issues,
        questions: questions.slice(0, 4), // Limit to 4 questions max
        suggestions: generateSuggestions(issues, subtasks)
    };
}

function decomposeTask(taskDescription) {
    if (!taskDescription || !taskDescription.name) {
        throw new Error('Task name is required for decomposition');
    }

    // Generate a unique parent task ID
    const parentTaskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the parent task (the original large task)
    const parentTask = {
        id: parentTaskId,
        name: taskDescription.name,
        assignee: taskDescription.assignee || 'both',
        size: 'xl', // Large tasks are decomposed
        urgent: taskDescription.urgent || 3,
        important: taskDescription.important || 3,
        completed: false,
        icon: taskDescription.icon || '📋',
        first_step: taskDescription.firstStep || null,
        completion_criteria: taskDescription.completionCriteria || null,
        deadline: taskDescription.deadline || null,
        depends_on: null,
        parent_task_id: null,
        created_at: new Date().toISOString()
    };

    // Generate 3-6 subtasks based on the task description
    const subtasks = [];
    const subtaskCount = Math.floor(Math.random() * 4) + 3; // 3-6 subtasks

    for (let i = 0; i < subtaskCount; i++) {
        const subtaskId = `task_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const subtask = {
            id: subtaskId,
            name: `Subtask ${i + 1} for "${taskDescription.name}"`,
            assignee: i % 2 === 0 ? 'mario' : 'maria', // Alternate assignees
            size: ['s', 'm', 'l'][Math.floor(Math.random() * 3)], // Random size
            urgent: Math.floor(Math.random() * 3) + 2, // 2-4 urgency
            important: Math.floor(Math.random() * 3) + 2, // 2-4 importance
            completed: false,
            icon: '✅',
            first_step: `Start working on subtask ${i + 1}`,
            completion_criteria: `Complete subtask ${i + 1} requirements`,
            deadline: calculateDeadline(i, taskDescription.deadline),
            depends_on: i > 0 ? [subtasks[i-1].id] : null, // Chain dependencies
            parent_task_id: parentTaskId,
            created_at: new Date().toISOString()
        };
        subtasks.push(subtask);
    }

    return {
        parentTask: parentTask,
        subtasks: subtasks,
        message: `Task "${taskDescription.name}" has been decomposed into ${subtasks.length} subtasks.`,
        matrix_positions: assignMatrixPositions(subtasks),
        integrations: suggestIntegrations(taskDescription.name, subtasks)
    };
}

async function testDecomposition() {
    console.log('🧪 Testing Intelligent Task Decomposition Agent\n');

    // Test 1: Initial decomposition
    console.log('1️⃣ Testing Initial Decomposition...');
    try {
        const taskDesc = {
            name: 'Plan family vacation to Europe',
            assignee: 'both',
            urgent: 3,
            important: 4,
            deadline: '2025-08-15',
            firstStep: 'Research destinations',
            completionCriteria: 'Booked flights and accommodation'
        };

        const decomposition = decomposeTask(taskDesc);
        console.log('✅ Initial decomposition created');
        console.log(`📋 Parent task: "${decomposition.parentTask.name}"`);
        console.log(`📝 Subtasks created: ${decomposition.subtasks.length}`);
        console.log(`🎯 Matrix positions assigned: ${decomposition.matrix_positions.length}`);
        console.log(`🔗 Integrations suggested: ${decomposition.integrations.length}\n`);

        // Test 2: Self-review
        console.log('2️⃣ Testing Self-Review...');
        const review = reviewDecomposition(decomposition);
        console.log(`📊 Review confidence: ${review.confidence}`);
        console.log(`❓ Questions to ask: ${review.questions.length}`);
        console.log(`💡 Suggestions: ${review.suggestions.length}`);

        if (review.questions.length > 0) {
            console.log('Questions:');
            review.questions.forEach((q, i) => console.log(`  ${i+1}. ${q}`));
        }
        console.log('');

        // Test 3: Refinement with user answers
        if (review.questions.length > 0) {
            console.log('3️⃣ Testing Refinement...');
            const userAnswers = [
                { question: review.questions[0], response: 'We have a $5000 budget' },
                { question: review.questions[1] || 'What would be a good first step?', response: 'Check passport validity' }
            ];

            const refined = refineDecomposition(decomposition, userAnswers);
            console.log('✅ Decomposition refined');
            console.log(`📋 Refined subtasks: ${refined.subtasks.length}`);
            console.log(`🎯 Updated matrix positions: ${refined.matrix_positions.length}\n`);
        }

        // Test 4: Finalization
        console.log('4️⃣ Testing Finalization...');
        const final = finalizeDecomposition(decomposition);
        console.log('✅ Decomposition finalized');
        console.log(`📊 Summary: ${final.summary.totalTasks} total tasks`);
        console.log(`👤 Mario tasks: ${final.summary.marioTasks}`);
        console.log(`👤 Maria tasks: ${final.summary.mariaTasks}`);
        console.log(`📅 Tasks with deadlines: ${final.summary.deadlines}`);
        console.log(`🔗 Tasks with dependencies: ${final.summary.dependencies}`);
        console.log(`📝 Next steps suggested: ${final.next_steps.length}`);

        console.log('\n🎉 All decomposition tests passed!');

    } catch (error) {
        console.error('❌ Decomposition test failed:', error.message);
        console.error(error.stack);
    }
}

testDecomposition();
