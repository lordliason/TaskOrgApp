// Vercel Serverless Function for OpenAI Chat with Function Calling
// Thin handler: business logic lives in api/lib/

// Import from api/lib/appConfig.js (from api/ root, go into lib/ subdirectory)
const config = require('./lib/appConfig');
const {
    createTask,
    splitTask,
    updateTask,
    getTasks,
    decomposeTask,
    refineDecomposition,
    finalizeDecomposition,
    autofillDailyPlan
} = require('./lib/tasks');

const { reviewDecomposition } = require('./lib/utils/decomposeHelpers');
const { calculateDeadline, parseDeadline } = require('./lib/utils/dateCalc');
const { assignMatrixPositions, suggestIntegrations } = require('./lib/utils/matrixPositions');
const {
    checkCircularDependencies,
    calculateConfidence,
    generateSuggestions
} = require('./lib/utils/decomposeHelpers');

const VALID_MODELS = config.openai.validModels;

const FUNCTION_DEFINITIONS = [
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
        description: 'Refine a task decomposition based on user answers to clarifying questions. Call this IMMEDIATELY when user responds after you asked questions. Extract question-answer pairs from the conversation: match the user\'s response to your previous questions. Even if user gives short answers (yes/no/one word), create pairs for each question you asked. After refining, if confidence is high/medium OR refinementCount >= 2, call finalizeDecomposition() instead of asking more questions.',
        parameters: {
            type: 'object',
            properties: {
                originalDecomposition: { type: 'object', description: 'The original decomposition object from previous decomposeTask or refineDecomposition call' },
                userAnswers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            question: { type: 'string', description: 'The question that was asked' },
                            response: { type: 'string', description: 'The user\'s answer' }
                        }
                    },
                    description: 'Array of question-answer pairs matching the questions you asked'
                },
                refinementCount: { type: 'integer', description: 'How many times you\'ve refined (0 = first refinement, 1 = second, etc.). Use this to track iterations.' }
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
    },
    {
        name: 'autofillDailyPlan',
        description: 'Intelligently auto-fill the daily planner for Mario and Maria based on pending tasks, current time, priorities, locations, and scheduling constraints',
        parameters: {
            type: 'object',
            properties: {
                tasks: {
                    type: 'array',
                    description: 'Array of pending task objects with id, name, assignee, size, urgent, important, location, deadline, depends_on',
                    items: { type: 'object' }
                },
                currentHour: { type: 'integer', description: 'Current hour (0-23)' },
                currentMinutes: { type: 'integer', description: 'Current minutes (0-59)' }
            },
            required: ['tasks', 'currentHour', 'currentMinutes']
        }
    }
];

function getApiKey() {
    return config.openai.getApiKey();
}

function buildSystemContent(taskContext, conversationHistory) {
    return `You are an intelligent task decomposition agent for TaskOrgApp. You help break down large tasks into manageable subtasks with proper assignees, deadlines, and dependencies.

CORE BEHAVIOR:
- When users ask to decompose/break down large tasks, immediately call decomposeTask()
- Be collaborative: ask clarifying questions instead of assuming details
- Be iterative: refine plans based on user answers until confident
- Consider workload balance among team members in the organization
- Suggest calendar/shopping integrations when relevant
- Use Eisenhower matrix for prioritization (urgent+important=DO, etc.)
- Always assign tasks to valid organization members

DECOMPOSITION PROCESS:
1. Generate initial draft with decomposeTask()
2. Self-review and ask 2-4 clarifying questions if needed
3. CRITICAL: When user responds after you asked questions, they are ANSWERING your questions
4. IMMEDIATELY call refineDecomposition() with question-answer pairs extracted from their response
5. After refining, if still needs work, ask MAX 2 more questions
6. After 2 refinement rounds, call finalizeDecomposition() even if not perfect
7. NEVER ask more than 6 total questions - finalize after 2 rounds of refinement

DETECTING USER ANSWERS:
- If your last message asked questions AND user sends a new message, they are answering
- Extract answers: match user response to your questions (even if partial/yes/no)
- Example: You asked "What's the deadline?" User says "next week" → answer: {question: "What's the deadline?", response: "next week"}
- Example: You asked 2 questions, user says "yes" → answer both with "yes" or infer from context
- ALWAYS call refineDecomposition() when you detect an answer, NEVER ask new questions first

IMPORTANT RULES:
- If user responds after questions → call refineDecomposition() immediately
- Do NOT ask new questions without refining first
- After refineDecomposition(), if confidence is high/medium OR refinementCount >= 2, call finalizeDecomposition()
- Track refinementCount: start at 0, increment each refineDecomposition() call

${taskContext ? `Here is current task context:\n\n${taskContext}` : ''}
${conversationHistory.length > 0 ? `\nRecent conversation:\n${conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}`;
}

async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('OPENAI_API_KEY is missing (env or config.js)');
        return res.status(500).json({
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable in Vercel or config.js for local development.'
        });
    }

    try {
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
            return res.status(400).json({ error: 'Request body is required' });
        }

        const {
            taskContext,
            message,
            enableFunctions = false,
            conversationHistory = [],
            organizationId = null,
            model = 'gpt-3.5-turbo'
        } = body;

        const selectedModel = VALID_MODELS.includes(model) ? model : 'gpt-3.5-turbo';

        console.log('Received request:', {
            hasMessage: !!message,
            hasTaskContext: !!taskContext,
            enableFunctions,
            model: selectedModel
        });

        if (taskContext) {
            try {
                const contextData = typeof taskContext === 'string' ? JSON.parse(taskContext) : taskContext;
                if (contextData.action === 'autofillDailyPlan') {
                    const result = await autofillDailyPlan(
                        {
                            tasks: contextData.tasks,
                            currentHour: contextData.currentHour,
                            currentMinutes: contextData.currentMinutes
                        },
                        apiKey,
                        selectedModel
                    );
                    return res.status(200).json({
                        function_call: { name: 'autofillDailyPlan' },
                        function_result: result
                    });
                }
            } catch (parseErr) {
                // continue normal flow
            }
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const requestBody = {
            model: selectedModel,
            messages: [
                { role: 'system', content: buildSystemContent(taskContext, conversationHistory) },
                { role: 'user', content: message }
            ],
            max_tokens: 500,
            temperature: 0.7
        };

        if (enableFunctions) {
            requestBody.functions = FUNCTION_DEFINITIONS;
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
        if (!data.choices?.[0]?.message) {
            console.error('Invalid response structure from OpenAI:', JSON.stringify(data).substring(0, 500));
            return res.status(500).json({ error: 'Invalid response structure from OpenAI API' });
        }

        const aiMessage = data.choices[0].message;

        if (aiMessage?.function_call && enableFunctions) {
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

            try {
                let functionResult;
                switch (aiMessage.function_call.name) {
                    case 'createTask':
                        functionResult = createTask(args, organizationId);
                        break;
                    case 'splitTask':
                        functionResult = splitTask(args.taskId, args.splitDescription, organizationId);
                        break;
                    case 'updateTask':
                        functionResult = updateTask(args.taskId, args.updates, organizationId);
                        break;
                    case 'getTasks':
                        functionResult = getTasks(args.filters || {}, organizationId);
                        break;
                    case 'decomposeTask': {
                        const decomposition = decomposeTask(args, organizationId);
                        const review = reviewDecomposition(decomposition, false);
                        functionResult = {
                            decomposition,
                            review,
                            needsRefinement: !review.isComplete && review.questions.length > 0,
                            refinementCount: 0,
                            message: review.isComplete
                                ? "Decomposition looks good! Here's the breakdown:"
                                : `I've created an initial breakdown, but I have some questions to make it better:\n${review.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nLet me know so I can refine this plan!`
                        };
                        break;
                    }
                    case 'refineDecomposition': {
                        const refined = refineDecomposition(args.originalDecomposition, args.userAnswers);
                        const refinedReview = reviewDecomposition(refined, true);
                        const refinementCount = args.refinementCount ?? 1;
                        const shouldFinalize =
                            refinementCount >= 2 ||
                            refinedReview.confidence === 'high' ||
                            (refinementCount >= 1 && refinedReview.confidence === 'medium') ||
                            refinedReview.isComplete;

                        if (shouldFinalize) {
                            functionResult = finalizeDecomposition(refined);
                        } else {
                            const remainingQuestions = refinedReview.questions.slice(0, 2);
                            const needsMore = refinedReview.confidence === 'low' && refinementCount < 2 && remainingQuestions.length > 0;
                            functionResult = {
                                decomposition: refined,
                                review: refinedReview,
                                needsRefinement: needsMore,
                                refinementCount: refinementCount + 1,
                                message: needsMore
                                    ? `I've refined the plan. A couple more questions:\n${remainingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nLet me know so I can finalize this!`
                                    : 'Perfect! The decomposition is now ready.'
                            };
                        }
                        break;
                    }
                    case 'finalizeDecomposition':
                        functionResult = finalizeDecomposition(args.decomposition);
                        break;
                    case 'autofillDailyPlan':
                        functionResult = await autofillDailyPlan(args, apiKey, selectedModel);
                        break;
                    default:
                        throw new Error(`Unknown function: ${aiMessage.function_call.name}`);
                }

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

        return res.status(200).json(data);
    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = error.message || 'Internal server error';
        return res.status(500).json({ error: errorMessage, message: errorMessage });
    }
}

module.exports = handler;
module.exports.createTask = createTask;
module.exports.splitTask = splitTask;
module.exports.updateTask = updateTask;
module.exports.getTasks = getTasks;
module.exports.decomposeTask = decomposeTask;
module.exports.refineDecomposition = refineDecomposition;
module.exports.finalizeDecomposition = finalizeDecomposition;
module.exports.calculateDeadline = calculateDeadline;
module.exports.assignMatrixPositions = assignMatrixPositions;
module.exports.suggestIntegrations = suggestIntegrations;
module.exports.reviewDecomposition = reviewDecomposition;
module.exports.checkCircularDependencies = checkCircularDependencies;
module.exports.calculateConfidence = calculateConfidence;
module.exports.generateSuggestions = generateSuggestions;
module.exports.parseDeadline = parseDeadline;
module.exports.autofillDailyPlan = autofillDailyPlan;
module.exports.default = module.exports;
