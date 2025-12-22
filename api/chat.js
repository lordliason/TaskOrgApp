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
        return res.status(500).json({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable in Vercel.'
        });
    }

    try {
        const { taskContext, message, enableFunctions = false } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Prepare the request body
        const requestBody = {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful task management assistant for TaskOrgApp. You can help users create, split, update, and query tasks. ${taskContext ? `Here is current task context:\n\n${taskContext}` : ''}`
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
                }
            ];
            requestBody.function_call = 'auto';
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: errorData.error?.message || `OpenAI API error: ${response.status}`
            });
        }

        const data = await response.json();
        const message = data.choices[0]?.message;

        // Handle function calls
        if (message.function_call && enableFunctions) {
            const args = JSON.parse(message.function_call.arguments);
            let functionResult;

            try {
                switch (message.function_call.name) {
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
                    default:
                        throw new Error(`Unknown function: ${message.function_call.name}`);
                }

                // Return the function call and result for the frontend to handle
                return res.status(200).json({
                    function_call: message.function_call,
                    function_result: functionResult,
                    original_response: data
                });

            } catch (error) {
                return res.status(400).json({
                    error: `Function execution failed: ${error.message}`,
                    function_call: message.function_call
                });
            }
        }

        // Return normal response
        return res.status(200).json(data);
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
