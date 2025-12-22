// Vercel Serverless Function for OpenAI Chat with Function Calling
// This keeps the API key secure on the server side

// Task Management Functions (same as in test-openai.js)
function createTask(taskData) {
    // Validate required fields
    if (!taskData.name || !taskData.assignee) {
        throw new Error('Task name and assignee are required');
    }

    // Validate assignee values
    const validAssignees = ['mario', 'maria', 'both'];
    if (!validAssignees.includes(taskData.assignee)) {
        throw new Error(`Assignee must be one of: ${validAssignees.join(', ')}`);
    }

    // Validate size values
    const validSizes = ['xs', 's', 'm', 'l', 'xl'];
    if (taskData.size && !validSizes.includes(taskData.size)) {
        throw new Error(`Size must be one of: ${validSizes.join(', ')}`);
    }

    // Set defaults and validate ranges
    const task = {
        name: taskData.name,
        assignee: taskData.assignee,
        size: taskData.size || 'm',
        urgent: Math.max(1, Math.min(5, taskData.urgent || 3)),
        important: Math.max(1, Math.min(5, taskData.important || 3)),
        completed: false,
        icon: taskData.icon || null,
        first_step: taskData.first_step || null,
        completion_criteria: taskData.completion_criteria || null
    };

    return task;
}

function splitTask(taskId, splitDescription) {
    if (!taskId) {
        throw new Error('Task ID is required');
    }

    if (!splitDescription || !splitDescription.part1 || !splitDescription.part2) {
        throw new Error('Split description must include both part1 and part2 task names');
    }

    // In the real app, you'd query the database for the original task
    // For now, we'll create mock subtasks
    const task1 = {
        name: splitDescription.part1,
        assignee: 'mario', // This should come from the original task
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
        assignee: 'mario', // This should come from the original task
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
        message: `Task has been split into two subtasks.`
    };
}

function updateTask(taskId, updates) {
    if (!taskId) {
        throw new Error('Task ID is required');
    }

    // Validate updates
    const validUpdates = {};
    const validAssignees = ['mario', 'maria', 'both'];
    const validSizes = ['xs', 's', 'm', 'l', 'xl'];

    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.assignee !== undefined) {
        if (!validAssignees.includes(updates.assignee)) {
            throw new Error(`Assignee must be one of: ${validAssignees.join(', ')}`);
        }
        validUpdates.assignee = updates.assignee;
    }
    if (updates.size !== undefined) {
        if (!validSizes.includes(updates.size)) {
            throw new Error(`Size must be one of: ${validSizes.join(', ')}`);
        }
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
        taskId: taskId,
        updates: validUpdates,
        message: `Task updated successfully.`
    };
}

function getTasks(filters = {}) {
    // In the real app, this would query your Supabase database
    // For now, return a mock response
    return {
        tasks: [
            {
                id: 'task_001',
                name: 'Sample task',
                assignee: 'mario',
                completed: false
            }
        ],
        count: 1,
        message: 'Tasks retrieved successfully.'
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
                    marioTasks[0].assignee = 'maria';
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

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('OPENAI_API_KEY is missing from environment variables');
        return res.status(500).json({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable in Vercel.'
        });
    }

    try {
        // Parse request body - Vercel may send it as a string or already parsed
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (parseError) {
                console.error('Failed to parse request body:', parseError);
                return res.status(400).json({ error: 'Invalid JSON in request body' });
            }
        }

        if (!body) {
            console.error('Request body is empty or undefined');
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { taskContext, message, enableFunctions = false } = body;

        console.log('Received request:', { 
            hasMessage: !!message, 
            hasTaskContext: !!taskContext, 
            enableFunctions 
        });

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Prepare the request body
        const requestBody = {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are an intelligent task decomposition agent for TaskOrgApp. You help break down large tasks into manageable subtasks with proper assignees, deadlines, and dependencies.

CORE BEHAVIOR:
- When users ask to decompose/decompose/break down large tasks, immediately call decomposeTask()
- Be collaborative: ask clarifying questions instead of assuming details
- Be iterative: refine plans based on user answers until confident
- Consider couple-friendly workload balance between Mario and Maria
- Suggest calendar/shopping integrations when relevant
- Use Eisenhower matrix for prioritization (urgent+important=DO, etc.)

DECOMPOSITION PROCESS:
1. Generate initial draft with decomposeTask()
2. Self-review and ask 2-4 clarifying questions if needed
3. Refine with refineDecomposition() based on answers
4. Repeat until confident, then finalizeDecomposition()

${taskContext ? `Here is current task context:\n\n${taskContext}` : ''}`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        };

        // Add function calling if enabled
        if (enableFunctions) {
            requestBody.functions = [
                {
                    name: 'createTask',
                    description: 'Create a new task in the TaskOrgApp system',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'The name/title of the task' },
                            assignee: { type: 'string', enum: ['mario', 'maria', 'both'], description: 'Who the task is assigned to' },
                            size: { type: 'string', enum: ['xs', 's', 'm', 'l', 'xl'], description: 'The estimated size/complexity' },
                            urgent: { type: 'integer', minimum: 1, maximum: 5, description: 'Urgency level (1-5)' },
                            important: { type: 'integer', minimum: 1, maximum: 5, description: 'Importance level (1-5)' },
                            icon: { type: 'string', description: 'Emoji icon for the task' },
                            first_step: { type: 'string', description: 'The first step to start working on this task' },
                            completion_criteria: { type: 'string', description: 'What needs to be true for completion' }
                        },
                        required: ['name', 'assignee']
                    }
                },
                {
                    name: 'splitTask',
                    description: 'Split an existing task into two smaller subtasks',
                    parameters: {
                        type: 'object',
                        properties: {
                            taskId: { type: 'string', description: 'The ID of the task to split' },
                            splitDescription: {
                                type: 'object',
                                properties: {
                                    part1: { type: 'string', description: 'Name of the first part' },
                                    part2: { type: 'string', description: 'Name of the second part' },
                                    size1: { type: 'string', enum: ['xs', 's', 'm', 'l', 'xl'] },
                                    size2: { type: 'string', enum: ['xs', 's', 'm', 'l', 'xl'] },
                                    firstStep1: { type: 'string' },
                                    firstStep2: { type: 'string' },
                                    completionCriteria1: { type: 'string' },
                                    completionCriteria2: { type: 'string' }
                                },
                                required: ['part1', 'part2']
                            }
                        },
                        required: ['taskId', 'splitDescription']
                    }
                },
                {
                    name: 'updateTask',
                    description: 'Update an existing task with new information',
                    parameters: {
                        type: 'object',
                        properties: {
                            taskId: { type: 'string', description: 'The ID of the task to update' },
                            updates: { type: 'object', description: 'The updates to apply' }
                        },
                        required: ['taskId', 'updates']
                    }
                },
                {
                    name: 'getTasks',
                    description: 'Query and retrieve tasks based on filters',
                    parameters: {
                        type: 'object',
                        properties: {
                            filters: { type: 'object', description: 'Filters to apply to the query' }
                        }
                    }
                },
                {
                    name: 'decomposeTask',
                    description: 'Intelligently decompose a large task into smaller subtasks with assignees, deadlines, and dependencies. Use this when users ask to decompose, break down, or split a large task into subtasks. This is different from getTasks - use decomposeTask to CREATE new subtasks from a task description, not to query existing tasks.',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'The name/title of the large task to decompose' },
                            assignee: { type: 'string', enum: ['mario', 'maria', 'both'], description: 'Initial assignee preference' },
                            deadline: { type: 'string', description: 'Overall deadline (YYYY-MM-DD format)' },
                            urgent: { type: 'integer', minimum: 1, maximum: 5, description: 'Urgency level (1-5)' },
                            important: { type: 'integer', minimum: 1, maximum: 5, description: 'Importance level (1-5)' },
                            firstStep: { type: 'string', description: 'Suggested first step' },
                            completionCriteria: { type: 'string', description: 'Completion criteria' },
                            icon: { type: 'string', description: 'Emoji icon for the task' }
                        },
                        required: ['name']
                    }
                },
                {
                    name: 'refineDecomposition',
                    description: 'Refine a task decomposition based on user answers to clarifying questions',
                    parameters: {
                        type: 'object',
                        properties: {
                            originalDecomposition: { type: 'object', description: 'The original decomposition object' },
                            userAnswers: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        question: { type: 'string', description: 'The question that was asked' },
                                        response: { type: 'string', description: 'The user\'s answer' }
                                    }
                                },
                                description: 'Array of question-answer pairs'
                            }
                        },
                        required: ['originalDecomposition', 'userAnswers']
                    }
                },
                {
                    name: 'finalizeDecomposition',
                    description: 'Finalize a task decomposition and prepare it for database insertion',
                    parameters: {
                        type: 'object',
                        properties: {
                            decomposition: { type: 'object', description: 'The refined decomposition to finalize' }
                        },
                        required: ['decomposition']
                    }
                }
            ];
            requestBody.function_call = 'auto';
        }

        console.log('Calling OpenAI API...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                const text = await response.text();
                console.error('OpenAI API error (non-JSON):', text.substring(0, 500));
                return res.status(response.status).json({
                    error: `OpenAI API error: ${response.status} ${response.statusText}`
                });
            }
            console.error('OpenAI API error:', errorData);
            return res.status(response.status).json({
                error: errorData.error?.message || errorData.error || `OpenAI API error: ${response.status}`
            });
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid response structure from OpenAI:', JSON.stringify(data).substring(0, 500));
            return res.status(500).json({
                error: 'Invalid response structure from OpenAI API'
            });
        }

        const aiMessage = data.choices[0].message;

        // Handle function calls
        if (aiMessage && aiMessage.function_call && enableFunctions) {
            let args;
            try {
                args = JSON.parse(aiMessage.function_call.arguments);
            } catch (parseError) {
                console.error('Failed to parse function call arguments:', parseError);
                return res.status(400).json({
                    error: `Failed to parse function call arguments: ${parseError.message}`,
                    function_call: aiMessage.function_call
                });
            }

            let functionResult;

            try {
                switch (aiMessage.function_call.name) {
                    case 'createTask':
                        functionResult = createTask(args);
                        break;
                    case 'splitTask':
                        functionResult = splitTask(args.taskId, args.splitDescription);
                        break;
                    case 'updateTask':
                        functionResult = updateTask(args.taskId, args.updates);
                        break;
                    case 'getTasks':
                        functionResult = getTasks(args.filters || {});
                        break;
                    case 'decomposeTask':
                        const decomposition = decomposeTask(args);
                        const review = reviewDecomposition(decomposition);
                        functionResult = {
                            decomposition: decomposition,
                            review: review,
                            needsRefinement: !review.isComplete,
                            message: review.isComplete
                                ? 'Decomposition looks good! Here\'s the breakdown:'
                                : `I have some questions to make this decomposition better: ${review.questions.join(' ')}`
                        };
                        break;
                    case 'refineDecomposition':
                        const refined = refineDecomposition(args.originalDecomposition, args.userAnswers);
                        const refinedReview = reviewDecomposition(refined);
                        functionResult = {
                            decomposition: refined,
                            review: refinedReview,
                            needsRefinement: !refinedReview.isComplete,
                            message: refinedReview.isComplete
                                ? 'Perfect! The decomposition is now ready.'
                                : `A few more questions: ${refinedReview.questions.join(' ')}`
                        };
                        break;
                    case 'finalizeDecomposition':
                        functionResult = finalizeDecomposition(args.decomposition);
                        break;
                    default:
                        throw new Error(`Unknown function: ${aiMessage.function_call.name}`);
                }

                // Return the function call and result for the frontend to handle
                return res.status(200).json({
                    function_call: aiMessage.function_call,
                    function_result: functionResult,
                    original_response: data
                });

            } catch (error) {
                return res.status(400).json({
                    error: `Function execution failed: ${error.message}`,
                    function_call: aiMessage.function_call
                });
            }
        }

        // Return normal response
        return res.status(200).json(data);
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = error.message || 'Internal server error';
        console.error('Error details:', {
            message: errorMessage,
            stack: error.stack,
            name: error.name,
            type: typeof error
        });
        return res.status(500).json({ 
            error: errorMessage,
            message: errorMessage 
        });
    }
};

// Export as default for Vercel compatibility
module.exports.default = module.exports;
