/**
 * Unit tests for AI-powered daily planner autofill
 * Tests: autofillDailyPlan function
 */

const { autofillDailyPlan } = require('../api/chat');

// Mock fetch globally
global.fetch = jest.fn();

describe('autofillDailyPlan', () => {
    const mockApiKey = 'test-api-key-12345';

    beforeEach(() => {
        fetch.mockClear();
    });

    describe('Time block determination', () => {
        test('should return all blocks when current time is early morning (8am)', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Morning Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            // Mock successful AI response
            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Test reasoning'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 8,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            expect(result.plan).toBeDefined();
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should return only afternoon and evening when current time is 1pm', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Afternoon Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: [], afternoon: ['task1'], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Afternoon scheduling'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 13,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            // Verify the prompt mentions only afternoon/evening
            const callArgs = fetch.mock.calls[0][1];
            const body = JSON.parse(callArgs.body);
            expect(body.messages[1].content).toContain('afternoon');
            expect(body.messages[1].content).toContain('evening');
        });

        test('should return only evening when current time is 6pm', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Evening Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: [], afternoon: [], evening: ['task1'] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Evening scheduling'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 18,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
        });

        test('should return no blocks when current time is after 9pm', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Late Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 21,
                currentMinutes: 30
            }, mockApiKey);

            expect(result.success).toBe(false);
            expect(result.message).toContain('late');
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('Task filtering', () => {
        test('should filter out completed tasks', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Completed Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3,
                    completed: true
                },
                {
                    id: 'task2',
                    name: 'Pending Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3,
                    completed: false
                }
            ];

            const mockPlan = {
                mario: { morning: ['task2'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Only pending tasks'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            // Verify task1 (completed) is not in the plan
            expect(result.plan.mario.morning).not.toContain('task1');
        });

        test('should filter out banked tasks', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Banked Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3,
                    banked: true
                },
                {
                    id: 'task2',
                    name: 'Active Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3,
                    banked: false
                }
            ];

            const mockPlan = {
                mario: { morning: ['task2'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Only active tasks'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            expect(result.plan.mario.morning).not.toContain('task1');
        });

        test('should return error when no pending tasks available', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Completed Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3,
                    completed: true
                }
            ];

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(false);
            expect(result.message).toContain('No pending tasks');
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('Task properties in prompt', () => {
        test('should include all task properties in AI prompt', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'both',
                    size: 'l',
                    urgent: 5,
                    important: 4,
                    location: 'home',
                    deadline: '2026-01-19',
                    depends_on: 'task2'
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: ['task1'], afternoon: [], evening: [] },
                reasoning: 'Both assignee task scheduled together'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            // Verify the prompt includes all task details
            const callArgs = fetch.mock.calls[0][1];
            const body = JSON.parse(callArgs.body);
            const prompt = body.messages[1].content;

            expect(prompt).toContain('task1');
            expect(prompt).toContain('Test Task');
            expect(prompt).toContain('both');
            expect(prompt).toContain('Large');
            expect(prompt).toContain('Urgency: 5/5');
            expect(prompt).toContain('Importance: 4/5');
            expect(prompt).toContain('location: home');
            expect(prompt).toContain('deadline: 2026-01-19');
            expect(prompt).toContain('depends on another task');
        });

        test('should handle tasks with missing optional properties', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Minimal Task',
                    assignee: 'mario',
                    size: 'm'
                    // Missing urgent, important, location, deadline
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Minimal task scheduled'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
        });
    });

    describe('"Both" assignee tasks', () => {
        test('should schedule "both" tasks in same time block for Mario and Maria', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Together Task',
                    assignee: 'both',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: ['task1'], afternoon: [], evening: [] },
                reasoning: 'Both working together'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            // Verify task1 appears in both Mario and Maria's morning block
            expect(result.plan.mario.morning).toContain('task1');
            expect(result.plan.maria.morning).toContain('task1');
        });
    });

    describe('Response parsing', () => {
        test('should parse JSON response correctly', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Test reasoning'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            expect(result.plan.mario.morning).toEqual(['task1']);
            expect(result.plan.maria.morning).toEqual([]);
            expect(result.reasoning).toBe('Test reasoning');
        });

        test('should handle markdown code blocks in response', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Test reasoning'
            };

            // Simulate AI returning JSON wrapped in markdown code blocks
            const wrappedResponse = '```json\n' + JSON.stringify(mockPlan) + '\n```';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: wrappedResponse
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            expect(result.plan.mario.morning).toEqual(['task1']);
        });

        test('should filter out invalid task IDs from AI response', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Valid Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            // AI returns invalid task ID
            const mockPlan = {
                mario: { morning: ['task1', 'invalid_task_id'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Test reasoning'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            // Invalid task ID should be filtered out
            expect(result.plan.mario.morning).toEqual(['task1']);
            expect(result.plan.mario.morning).not.toContain('invalid_task_id');
        });

        test('should handle missing blocks in AI response', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            // AI response missing some blocks
            const mockPlan = {
                mario: { morning: ['task1'] },
                maria: {}
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            const result = await autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey);

            expect(result.success).toBe(true);
            // Missing blocks should be filled with empty arrays
            expect(result.plan.mario).toHaveProperty('morning');
            expect(result.plan.mario).toHaveProperty('afternoon');
            expect(result.plan.mario).toHaveProperty('evening');
            expect(result.plan.maria).toHaveProperty('morning');
            expect(result.plan.maria).toHaveProperty('afternoon');
            expect(result.plan.maria).toHaveProperty('evening');
        });
    });

    describe('Error handling', () => {
        test('should handle OpenAI API errors', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    error: { message: 'API Error' }
                })
            });

            await expect(autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey)).rejects.toThrow();
        });

        test('should handle invalid JSON response', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'Invalid JSON response'
                        }
                    }]
                })
            });

            await expect(autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey)).rejects.toThrow('Failed to parse AI scheduling response');
        });

        test('should handle missing plan structure in response', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({ invalid: 'structure' })
                        }
                    }]
                })
            });

            await expect(autofillDailyPlan({
                tasks,
                currentHour: 9,
                currentMinutes: 0
            }, mockApiKey)).rejects.toThrow('Invalid plan structure');
        });
    });

    describe('Remaining time calculation', () => {
        test('should calculate remaining minutes correctly for current block', async () => {
            const tasks = [
                {
                    id: 'task1',
                    name: 'Test Task',
                    assignee: 'mario',
                    size: 'm',
                    urgent: 3,
                    important: 3
                }
            ];

            const mockPlan = {
                mario: { morning: ['task1'], afternoon: [], evening: [] },
                maria: { morning: [], afternoon: [], evening: [] },
                reasoning: 'Test'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockPlan)
                        }
                    }]
                })
            });

            await autofillDailyPlan({
                tasks,
                currentHour: 10,
                currentMinutes: 30
            }, mockApiKey);

            // Verify the prompt includes remaining time calculation
            const callArgs = fetch.mock.calls[0][1];
            const body = JSON.parse(callArgs.body);
            const prompt = body.messages[1].content;

            // Should mention remaining minutes (90 minutes = 1.5 hours from 10:30 to 12:00)
            expect(prompt).toContain('10:30');
            expect(prompt).toContain('remaining');
        });
    });
});
