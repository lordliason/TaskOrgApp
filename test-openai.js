#!/usr/bin/env node

/**
 * Simple Node.js script to test OpenAI API connection
 * Run with: node test-openai.js
 */

// Read config
const fs = require('fs');
let OPENAI_API_KEY;

try {
    const configContent = fs.readFileSync('./config.js', 'utf8');
    // Try to extract the API key using regex
    const match = configContent.match(/OPENAI_API_KEY\s*=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
        OPENAI_API_KEY = match[1];
    } else {
        console.error('❌ Could not find OPENAI_API_KEY in config.js');
        console.error('Config file content:', configContent.substring(0, 200));
        process.exit(1);
    }
} catch (e) {
    console.error('❌ Error reading config.js:', e.message);
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in config.js');
    process.exit(1);
}

// Test functions that the AI can call for TaskOrgApp
function createTask(taskData) {
    console.log(`🔧 Function called: createTask(${JSON.stringify(taskData, null, 2)})`);

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
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: taskData.name,
        assignee: taskData.assignee,
        size: taskData.size || 'm',
        urgent: Math.max(1, Math.min(5, taskData.urgent || 3)),
        important: Math.max(1, Math.min(5, taskData.important || 3)),
        completed: false,
        icon: taskData.icon || null,
        first_step: taskData.first_step || null,
        completion_criteria: taskData.completion_criteria || null,
        created_at: new Date().toISOString()
    };

    console.log(`📊 Task created successfully: ${JSON.stringify(task, null, 2)}\n`);
    return task;
}

function splitTask(taskId, splitDescription) {
    console.log(`🔧 Function called: splitTask(${taskId}, ${JSON.stringify(splitDescription, null, 2)})`);

    if (!taskId) {
        throw new Error('Task ID is required');
    }

    if (!splitDescription || !splitDescription.part1 || !splitDescription.part2) {
        throw new Error('Split description must include both part1 and part2 task names');
    }

    // Mock existing task lookup (in real app this would query database)
    const mockOriginalTask = {
        id: taskId,
        name: 'Original Task',
        assignee: 'mario',
        size: 'm',
        urgent: 3,
        important: 3,
        icon: '📋'
    };

    const task1 = {
        id: `task_${Date.now()}_1`,
        name: splitDescription.part1,
        assignee: mockOriginalTask.assignee,
        size: splitDescription.size1 || mockOriginalTask.size,
        urgent: mockOriginalTask.urgent,
        important: mockOriginalTask.important,
        completed: false,
        icon: mockOriginalTask.icon,
        first_step: splitDescription.firstStep1 || null,
        completion_criteria: splitDescription.completionCriteria1 || null,
        created_at: new Date().toISOString()
    };

    const task2 = {
        id: `task_${Date.now()}_2`,
        name: splitDescription.part2,
        assignee: mockOriginalTask.assignee,
        size: splitDescription.size2 || mockOriginalTask.size,
        urgent: mockOriginalTask.urgent,
        important: mockOriginalTask.important,
        completed: false,
        icon: mockOriginalTask.icon,
        first_step: splitDescription.firstStep2 || null,
        completion_criteria: splitDescription.completionCriteria2 || null,
        created_at: new Date().toISOString()
    };

    const result = {
        originalTaskId: taskId,
        newTasks: [task1, task2],
        message: `Task "${mockOriginalTask.name}" has been split into two tasks.`
    };

    console.log(`📊 Tasks split successfully: ${JSON.stringify(result, null, 2)}\n`);
    return result;
}

function updateTask(taskId, updates) {
    console.log(`🔧 Function called: updateTask(${taskId}, ${JSON.stringify(updates, null, 2)})`);

    if (!taskId) {
        throw new Error('Task ID is required');
    }

    // Mock existing task
    const mockTask = {
        id: taskId,
        name: 'Existing Task',
        assignee: 'mario',
        size: 'm',
        urgent: 3,
        important: 3,
        completed: false,
        icon: '📋',
        first_step: null,
        completion_criteria: null
    };

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

    const updatedTask = { ...mockTask, ...validUpdates, updated_at: new Date().toISOString() };

    console.log(`📊 Task updated successfully: ${JSON.stringify(updatedTask, null, 2)}\n`);
    return updatedTask;
}

function getTasks(filters = {}) {
    console.log(`🔧 Function called: getTasks(${JSON.stringify(filters, null, 2)})`);

    // Mock task data
    const mockTasks = [
        {
            id: 'task_001',
            name: 'Write project proposal',
            assignee: 'mario',
            size: 'l',
            urgent: 4,
            important: 5,
            completed: false,
            icon: '📝',
            first_step: 'Research competitors',
            completion_criteria: 'Proposal approved by team',
            created_at: '2024-12-20T10:00:00Z'
        },
        {
            id: 'task_002',
            name: 'Review code changes',
            assignee: 'maria',
            size: 'm',
            urgent: 3,
            important: 4,
            completed: true,
            icon: '💻',
            first_step: 'Pull latest changes',
            completion_criteria: 'All critical issues resolved',
            created_at: '2024-12-19T14:30:00Z'
        },
        {
            id: 'task_003',
            name: 'Plan team meeting',
            assignee: 'both',
            size: 's',
            urgent: 2,
            important: 3,
            completed: false,
            icon: '👥',
            first_step: 'Check calendar availability',
            completion_criteria: 'Meeting scheduled and agenda sent',
            created_at: '2024-12-21T09:15:00Z'
        }
    ];

    let filteredTasks = mockTasks;

    // Apply filters
    if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => task.assignee === filters.assignee);
    }
    if (filters.completed !== undefined) {
        filteredTasks = filteredTasks.filter(task => task.completed === filters.completed);
    }
    if (filters.urgent) {
        filteredTasks = filteredTasks.filter(task => task.urgent >= filters.urgent);
    }
    if (filters.important) {
        filteredTasks = filteredTasks.filter(task => task.important >= filters.important);
    }

    const result = {
        tasks: filteredTasks,
        count: filteredTasks.length,
        filters: filters
    };

    console.log(`📊 Found ${filteredTasks.length} tasks matching filters\n`);
    return result;
}

async function testConnection() {
    console.log('🔍 Testing OpenAI API connection...\n');
    console.log(`API Key: ${OPENAI_API_KEY.substring(0, 20)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}\n`);

    try {
        console.log('📡 Testing basic chat completion...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Connection successful!" if you can read this.'
                    }
                ],
                max_tokens: 20
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Success!
        console.log('✅ Basic Connection Successful!\n');
        console.log(`Model: ${data.model}`);
        console.log(`Response: ${data.choices[0]?.message?.content || 'No content'}\n`);

    } catch (error) {
        console.error('❌ Basic Connection Failed!\n');
        console.error(`Error: ${error.message}\n`);
        console.error('Please check:');
        console.error('1. Your API key is correct');
        console.error('2. You have internet connection');
        console.error('3. Your OpenAI account has credits');
        process.exit(1);
    }

    // Test function calling
    await testFunctionCalling();
}

async function testFunctionCalling() {
    console.log('🔧 Testing OpenAI Function Calling...\n');

    // First test: Task splitting (the main feature you requested)
    console.log('🎯 Testing Task Splitting Feature...\n');

    try {
        const splitTestResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'I have a large task "Redesign company website" (task_001) that needs to be split into two smaller tasks. Please split it into "Design new homepage layout" and "Implement responsive navigation".'
                    }
                ],
                functions: [
                    {
                        name: 'splitTask',
                        description: 'Split an existing task into two smaller subtasks',
                        parameters: {
                            type: 'object',
                            properties: {
                                taskId: {
                                    type: 'string',
                                    description: 'The ID of the task to split'
                                },
                                splitDescription: {
                                    type: 'object',
                                    properties: {
                                        part1: {
                                            type: 'string',
                                            description: 'Name of the first part of the split task'
                                        },
                                        part2: {
                                            type: 'string',
                                            description: 'Name of the second part of the split task'
                                        }
                                    },
                                    required: ['part1', 'part2']
                                }
                            },
                            required: ['taskId', 'splitDescription']
                        }
                    }
                ],
                function_call: { name: 'splitTask' } // Force the AI to call splitTask
            })
        });

        const splitTestData = await splitTestResponse.json();

        if (!splitTestResponse.ok) {
            throw new Error(splitTestData.error?.message || `HTTP ${splitTestResponse.status}: ${splitTestResponse.statusText}`);
        }

        const splitMessage = splitTestData.choices[0]?.message;
        if (splitMessage.function_call) {
            console.log('🤖 AI wants to call splitTask function:');
            console.log('📝 With arguments:', splitMessage.function_call.arguments);

            const args = JSON.parse(splitMessage.function_call.arguments);
            const functionResult = splitTask(args.taskId, args.splitDescription);

            console.log('✅ Task splitting test completed!\n');
        }

    } catch (error) {
        console.error('❌ Task splitting test failed:', error.message);
    }

    // Main comprehensive test
    console.log('🔧 Running comprehensive task management test...\n');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'Please create a new task called "Build mobile app feature" assigned to Mario with high urgency and importance. Then split the task "task_001" into "Research user requirements" and "Implement core functionality". Finally, show me all incomplete tasks assigned to Mario.'
                    }
                ],
                functions: [
                    {
                        name: 'createTask',
                        description: 'Create a new task in the TaskOrgApp system',
                        parameters: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'The name/title of the task'
                                },
                                assignee: {
                                    type: 'string',
                                    enum: ['mario', 'maria', 'both'],
                                    description: 'Who the task is assigned to'
                                },
                                size: {
                                    type: 'string',
                                    enum: ['xs', 's', 'm', 'l', 'xl'],
                                    description: 'The estimated size/complexity of the task'
                                },
                                urgent: {
                                    type: 'integer',
                                    minimum: 1,
                                    maximum: 5,
                                    description: 'Urgency level (1-5, where 5 is most urgent)'
                                },
                                important: {
                                    type: 'integer',
                                    minimum: 1,
                                    maximum: 5,
                                    description: 'Importance level (1-5, where 5 is most important)'
                                },
                                icon: {
                                    type: 'string',
                                    description: 'Emoji icon for the task'
                                },
                                first_step: {
                                    type: 'string',
                                    description: 'The first step to start working on this task'
                                },
                                completion_criteria: {
                                    type: 'string',
                                    description: 'What needs to be true for this task to be considered complete'
                                }
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
                                taskId: {
                                    type: 'string',
                                    description: 'The ID of the task to split'
                                },
                                splitDescription: {
                                    type: 'object',
                                    properties: {
                                        part1: {
                                            type: 'string',
                                            description: 'Name of the first part of the split task'
                                        },
                                        part2: {
                                            type: 'string',
                                            description: 'Name of the second part of the split task'
                                        },
                                        size1: {
                                            type: 'string',
                                            enum: ['xs', 's', 'm', 'l', 'xl'],
                                            description: 'Size for the first part'
                                        },
                                        size2: {
                                            type: 'string',
                                            enum: ['xs', 's', 'm', 'l', 'xl'],
                                            description: 'Size for the second part'
                                        },
                                        firstStep1: {
                                            type: 'string',
                                            description: 'First step for the first part'
                                        },
                                        firstStep2: {
                                            type: 'string',
                                            description: 'First step for the second part'
                                        },
                                        completionCriteria1: {
                                            type: 'string',
                                            description: 'Completion criteria for the first part'
                                        },
                                        completionCriteria2: {
                                            type: 'string',
                                            description: 'Completion criteria for the second part'
                                        }
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
                                taskId: {
                                    type: 'string',
                                    description: 'The ID of the task to update'
                                },
                                updates: {
                                    type: 'object',
                                    properties: {
                                        name: {
                                            type: 'string',
                                            description: 'New name for the task'
                                        },
                                        assignee: {
                                            type: 'string',
                                            enum: ['mario', 'maria', 'both'],
                                            description: 'New assignee'
                                        },
                                        size: {
                                            type: 'string',
                                            enum: ['xs', 's', 'm', 'l', 'xl'],
                                            description: 'New size'
                                        },
                                        urgent: {
                                            type: 'integer',
                                            minimum: 1,
                                            maximum: 5,
                                            description: 'New urgency level'
                                        },
                                        important: {
                                            type: 'integer',
                                            minimum: 1,
                                            maximum: 5,
                                            description: 'New importance level'
                                        },
                                        completed: {
                                            type: 'boolean',
                                            description: 'Mark task as completed or not'
                                        },
                                        icon: {
                                            type: 'string',
                                            description: 'New emoji icon'
                                        },
                                        first_step: {
                                            type: 'string',
                                            description: 'New first step'
                                        },
                                        completion_criteria: {
                                            type: 'string',
                                            description: 'New completion criteria'
                                        }
                                    }
                                }
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
                                filters: {
                                    type: 'object',
                                    properties: {
                                        assignee: {
                                            type: 'string',
                                            enum: ['mario', 'maria', 'both'],
                                            description: 'Filter by assignee'
                                        },
                                        completed: {
                                            type: 'boolean',
                                            description: 'Filter by completion status'
                                        },
                                        urgent: {
                                            type: 'integer',
                                            minimum: 1,
                                            maximum: 5,
                                            description: 'Minimum urgency level'
                                        },
                                        important: {
                                            type: 'integer',
                                            minimum: 1,
                                            maximum: 5,
                                            description: 'Minimum importance level'
                                        }
                                    }
                                }
                            }
                        }
                    }
                ],
                function_call: 'auto'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Function Calling Test Successful!\n');
        console.log(`Model: ${data.model}`);

        const message = data.choices[0]?.message;
        if (message.function_call) {
            console.log('🤖 AI wants to call function:', message.function_call.name);
            console.log('📝 With arguments:', message.function_call.arguments);

            // Parse the function call arguments
            const args = JSON.parse(message.function_call.arguments);

            // Call the appropriate function
            let functionResult;
            if (message.function_call.name === 'createTask') {
                functionResult = createTask(args);
            } else if (message.function_call.name === 'splitTask') {
                functionResult = splitTask(args.taskId, args.splitDescription);
            } else if (message.function_call.name === 'updateTask') {
                functionResult = updateTask(args.taskId, args.updates);
            } else if (message.function_call.name === 'getTasks') {
                functionResult = getTasks(args.filters || {});
            }

            // Make a second API call with the function result
            console.log('🔄 Making follow-up API call with function result...\n');

            const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: 'I need to organize my work. Can you help me create a task to "Plan Q1 marketing campaign" assigned to Maria, and then split it into two smaller tasks? Also, show me all my urgent tasks.'
                        },
                        message, // The AI's function call message
                        {
                            role: 'function',
                            name: message.function_call.name,
                            content: JSON.stringify(functionResult)
                        }
                    ]
                })
            });

            const followUpData = await followUpResponse.json();

            if (!followUpResponse.ok) {
                throw new Error(followUpData.error?.message || `HTTP ${followUpResponse.status}: ${followUpResponse.statusText}`);
            }

            console.log('🎯 Final AI Response:');
            console.log(followUpData.choices[0]?.message?.content || 'No content');
            console.log('\n📋 Full Response:');
            console.log(JSON.stringify(followUpData, null, 2));

        } else {
            console.log('💬 AI Response (no function called):');
            console.log(message.content || 'No content');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Function Calling Test Failed!\n');
        console.error(`Error: ${error.message}\n`);
        console.error('Function calling may not be supported by your OpenAI plan or model.');
        process.exit(1);
    }
}

testConnection();

