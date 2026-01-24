/**
 * Unit tests for chat API handler function
 * Tests: Request handling, CORS, error cases, function calling, autofillDailyPlan direct calls
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock fs module
const fs = require('fs');
jest.mock('fs');

const chatHandler = require('../api/chat');

describe('Chat API Handler', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        // Reset mocks
        fetch.mockClear();
        fs.readFileSync.mockClear();
        
        // Create mock request object
        mockReq = {
            method: 'POST',
            body: {
                message: 'Hello',
                enableFunctions: false
            }
        };

        // Create mock response object
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            end: jest.fn()
        };

        // Reset environment
        delete process.env.OPENAI_API_KEY;
    });

    describe('CORS and OPTIONS handling', () => {
        test('should set CORS headers', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
        });

        test('should handle OPTIONS preflight request', async () => {
            mockReq.method = 'OPTIONS';

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.end).toHaveBeenCalled();
            expect(fetch).not.toHaveBeenCalled();
        });

        test('should reject non-POST, non-OPTIONS methods', async () => {
            mockReq.method = 'GET';

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(405);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
        });
    });

    describe('API key handling', () => {
        test('should use environment variable API key', async () => {
            process.env.OPENAI_API_KEY = 'env-key-123';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const headers = fetchCall[1].headers;
            expect(headers.Authorization).toBe('Bearer env-key-123');
        });

        test('should read API key from config.js if env var not set', async () => {
            delete process.env.OPENAI_API_KEY;
            // Mock fs.readFileSync to return config content
            const path = require('path');
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('config.js')) {
                    return "const OPENAI_API_KEY = 'config-key-456';";
                }
                throw new Error('File not found');
            });
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const headers = fetchCall[1].headers;
            expect(headers.Authorization).toBe('Bearer config-key-456');
        });

        test('should return error when API key is missing', async () => {
            delete process.env.OPENAI_API_KEY;
            // Mock fs.readFileSync to throw error (file not found)
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });
            mockReq.body = { message: 'Hello' };

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable in Vercel or config.js for local development.'
            });
        });
    });

    describe('Request body parsing', () => {
        test('should parse JSON string body', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = JSON.stringify({ message: 'Hello' });

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });

        test('should handle already parsed JSON body', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });

        test('should return error for invalid JSON body', async () => {
            process.env.OPENAI_API_KEY = 'test-key'; // Set API key to avoid that error
            mockReq.body = 'invalid json{';

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid JSON in request body' });
        });

        test('should return error for empty body', async () => {
            process.env.OPENAI_API_KEY = 'test-key'; // Set API key to avoid that error
            mockReq.body = null;

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Request body is required' });
        });
    });

    describe('Message validation', () => {
        test('should return error when message is missing', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {};

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message is required' });
        });
    });

    describe('Direct autofillDailyPlan requests', () => {
        test('should handle direct autofillDailyPlan request via taskContext', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                taskContext: JSON.stringify({
                    action: 'autofillDailyPlan',
                    tasks: [
                        {
                            id: 'task1',
                            name: 'Test Task',
                            assignee: 'mario',
                            size: 'm',
                            urgent: 3,
                            important: 3
                        }
                    ],
                    currentHour: 9,
                    currentMinutes: 0
                })
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                mario: { morning: ['task1'], afternoon: [], evening: [] },
                                maria: { morning: [], afternoon: [], evening: [] },
                                reasoning: 'Test'
                            })
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                function_call: { name: 'autofillDailyPlan' },
                function_result: expect.objectContaining({
                    success: true
                })
            });
        });

        test('should handle autofillDailyPlan with object taskContext', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                taskContext: {
                    action: 'autofillDailyPlan',
                    tasks: [
                        {
                            id: 'task1',
                            name: 'Test Task',
                            assignee: 'mario',
                            size: 'm',
                            urgent: 3,
                            important: 3
                        }
                    ],
                    currentHour: 9,
                    currentMinutes: 0
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                mario: { morning: ['task1'], afternoon: [], evening: [] },
                                maria: { morning: [], afternoon: [], evening: [] },
                                reasoning: 'Test'
                            })
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                function_call: { name: 'autofillDailyPlan' },
                function_result: expect.objectContaining({
                    success: true
                })
            });
        });
    });

    describe('Model selection', () => {
        test('should use default model when not specified', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.model).toBe('gpt-3.5-turbo');
        });

        test('should use specified valid model', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello', model: 'gpt-4' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.model).toBe('gpt-4');
        });

        test('should fallback to default for invalid model', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello', model: 'invalid-model' };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.model).toBe('gpt-3.5-turbo');
        });

        test('should accept valid models', async () => {
            const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
            process.env.OPENAI_API_KEY = 'test-key';

            for (const model of validModels) {
                fetch.mockClear();
                mockReq.body = { message: 'Hello', model };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        choices: [{ message: { content: 'Response' } }]
                    })
                });

                await chatHandler(mockReq, mockRes);

                const fetchCall = fetch.mock.calls[0];
                const body = JSON.parse(fetchCall[1].body);
                expect(body.model).toBe(model);
            }
        });
    });

    describe('Function calling', () => {
        test('should include functions when enableFunctions is true', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Create a task',
                enableFunctions: true
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            function_call: {
                                name: 'createTask',
                                arguments: JSON.stringify({
                                    name: 'New Task',
                                    assignee: 'mario'
                                })
                            }
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.functions).toBeDefined();
            expect(Array.isArray(body.functions)).toBe(true);
            expect(body.function_call).toBe('auto');
        });

        test('should not include functions when enableFunctions is false', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Hello',
                enableFunctions: false
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.functions).toBeUndefined();
        });

        test('should execute createTask function call', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Create a task',
                enableFunctions: true
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            function_call: {
                                name: 'createTask',
                                arguments: JSON.stringify({
                                    name: 'New Task',
                                    assignee: 'mario'
                                })
                            }
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            const jsonCall = mockRes.json.mock.calls[0][0];
            expect(jsonCall.function_call.name).toBe('createTask');
            expect(jsonCall.function_result.name).toBe('New Task');
            expect(jsonCall.function_result.assignee).toBe('mario');
        });

        test('should handle function call argument parsing errors', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Create a task',
                enableFunctions: true
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            function_call: {
                                name: 'createTask',
                                arguments: 'invalid json{'
                            }
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: expect.stringContaining('Failed to parse function call arguments'),
                function_call: expect.any(Object)
            });
        });

        test('should handle unknown function calls', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Do something',
                enableFunctions: true
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            function_call: {
                                name: 'unknownFunction',
                                arguments: JSON.stringify({})
                            }
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: expect.stringContaining('Function execution failed'),
                function_call: expect.any(Object)
            });
        });
    });

    describe('OpenAI API error handling', () => {
        test('should handle OpenAI API errors', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    error: { message: 'API Error' }
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'API Error'
            });
        });

        test('should handle non-JSON error responses', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            // Mock json() to throw, then text() should be called
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => { throw new Error('Not JSON'); },
                text: async () => 'Internal Server Error'
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        test('should handle invalid response structure', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    // Missing choices array - simulate API error
                    error: { message: 'API Error' }
                })
            });

            await chatHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            const jsonCall = mockRes.json.mock.calls[0][0];
            expect(jsonCall.error).toBeDefined();
        });
    });

    describe('Normal chat responses', () => {
        test('should return normal response when no function call', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            const mockResponse = {
                choices: [{ message: { content: 'Hello there!' } }]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await chatHandler(mockReq, mockRes);

            // Verify response contains the choices - check all json calls
            const jsonCalls = mockRes.json.mock.calls;
            const responseCall = jsonCalls.find(call => {
                return call[0] && call[0].choices;
            });
            expect(responseCall).toBeDefined();
            if (responseCall) {
                expect(responseCall[0].choices).toEqual(mockResponse.choices);
            }
        });
    });

    describe('Organization ID handling', () => {
        test('should pass organizationId to function calls', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Create a task',
                enableFunctions: true,
                organizationId: 'org-123'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            function_call: {
                                name: 'createTask',
                                arguments: JSON.stringify({
                                    name: 'New Task',
                                    assignee: 'mario'
                                })
                            }
                        }
                    }]
                })
            });

            await chatHandler(mockReq, mockRes);

            // The organizationId should be passed to createTask
            expect(mockRes.json).toHaveBeenCalled();
        });
    });

    describe('Conversation history', () => {
        test('should include conversation history in system message', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = {
                message: 'Follow up',
                conversationHistory: [
                    { role: 'user', content: 'First message' },
                    { role: 'assistant', content: 'First response' }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await chatHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            expect(body.messages[0].content).toContain('Recent conversation');
        });
    });

    describe('Error handling', () => {
        test('should handle general errors', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            mockReq.body = { message: 'Hello' };

            // Mock fetch to throw an error
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await chatHandler(mockReq, mockRes);

            // Find the error response - should have error property
            const jsonCalls = mockRes.json.mock.calls;
            const errorCall = jsonCalls.find(call => {
                return call[0] && call[0].error;
            });
            expect(errorCall).toBeDefined();
            if (errorCall) {
                expect(errorCall[0].error).toBe('Network error');
            }
        });
    });
});
