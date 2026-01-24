/**
 * Unit tests for remind API handler
 * Tests: SMS reminder functionality, error handling, validation
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock the handler function
const remindHandler = require('../api/remind');

describe('Remind API Handler', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        // Reset mocks
        fetch.mockClear();
        
        // Create mock request object
        mockReq = {
            method: 'POST',
            body: {
                recipient: 'mario',
                taskName: 'Test Task'
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
        delete process.env.TEXTBELT_API_KEY;
    });

    describe('CORS and OPTIONS handling', () => {
        test('should set CORS headers', async () => {
            mockReq.method = 'POST';
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
        });

        test('should handle OPTIONS preflight request', async () => {
            mockReq.method = 'OPTIONS';

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.end).toHaveBeenCalled();
            expect(fetch).not.toHaveBeenCalled();
        });

        test('should reject non-POST, non-OPTIONS methods', async () => {
            mockReq.method = 'GET';

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(405);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
        });
    });

    describe('Request body parsing', () => {
        test('should parse JSON string body', async () => {
            mockReq.body = JSON.stringify({
                recipient: 'mario',
                taskName: 'Test Task'
            });
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });

        test('should handle already parsed JSON body', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });

        test('should return error for invalid JSON body', async () => {
            mockReq.body = 'invalid json{';

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid JSON in request body' });
        });

        test('should return error for empty body', async () => {
            mockReq.body = null;

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Request body is required' });
        });
    });

    describe('Input validation', () => {
        test('should return error when recipient is missing', async () => {
            mockReq.body = {
                taskName: 'Test Task'
            };

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recipient and task name are required' });
        });

        test('should return error when taskName is missing', async () => {
            mockReq.body = {
                recipient: 'mario'
            };

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Recipient and task name are required' });
        });

        test('should return error for invalid recipient', async () => {
            mockReq.body = {
                recipient: 'invalid',
                taskName: 'Test Task'
            };

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid recipient. Must be "mario" or "maria"' });
        });

        test('should accept valid recipients (case insensitive)', async () => {
            const recipients = ['mario', 'MARIO', 'Mario', 'maria', 'MARIA', 'Maria'];
            process.env.TEXTBELT_API_KEY = 'test-key';

            for (const recipient of recipients) {
                fetch.mockClear();
                mockReq.body = {
                    recipient,
                    taskName: 'Test Task'
                };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify({ success: true })
                });

                await remindHandler(mockReq, mockRes);

                expect(fetch).toHaveBeenCalled();
            }
        });
    });

    describe('SMS message formatting', () => {
        test('should format new task message', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Buy groceries',
                isNewTask: true
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            // Form data is URL-encoded, so decode it for checking
            const decoded = decodeURIComponent(formData);
            expect(decoded).toContain('Buy groceries');
            expect(decoded).toContain('New task assigned');
        });

        test('should format completion message', async () => {
            mockReq.body = {
                recipient: 'maria',
                taskName: 'Clean kitchen',
                isCompletion: true,
                completedBy: 'mario'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            // Form data is URL-encoded, so decode it for checking
            const decoded = decodeURIComponent(formData);
            expect(decoded).toContain('Clean kitchen');
            expect(decoded).toContain('Task completed by Mario');
        });

        test('should format default reminder message', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Call dentist'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            // Form data is URL-encoded, so decode it for checking
            const decoded = decodeURIComponent(formData);
            expect(decoded).toContain('Call dentist');
            expect(decoded).toContain('Task Reminder');
        });
    });

    describe('Textbelt API integration', () => {
        test('should call Textbelt API with correct parameters', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-api-key-123';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true, textId: '12345' })
            });

            await remindHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalledWith(
                'https://textbelt.com/text',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            );

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            expect(formData).toContain('phone=8458289353'); // Mario's phone
            expect(formData).toContain('key=test-api-key-123');
        });

        test('should use correct phone number for mario', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            expect(formData).toContain('phone=8458289353');
        });

        test('should use correct phone number for maria', async () => {
            mockReq.body = {
                recipient: 'maria',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            const fetchCall = fetch.mock.calls[0];
            const formData = fetchCall[1].body;
            expect(formData).toContain('phone=5186185155');
        });

        test('should return success response when SMS is sent', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({
                    success: true,
                    textId: '12345',
                    quotaRemaining: 100
                })
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Reminder sent to Mario!',
                textId: '12345',
                quotaRemaining: 100
            });
        });

        test('should handle Textbelt API errors gracefully', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({
                    success: false,
                    error: 'Quota exceeded'
                })
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                fallback: true,
                message: 'Quota exceeded',
                errorDetails: expect.objectContaining({
                    success: false,
                    error: 'Quota exceeded'
                })
            });
        });

        test('should handle HTTP errors from Textbelt', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                fallback: true,
                message: 'SMS service unavailable. Please try again later.',
                error: 'Internal Server Error'
            });
        });

        test('should handle invalid JSON response from Textbelt', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => 'Invalid JSON response'
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid response from SMS service',
                rawResponse: 'Invalid JSON response'
            });
        });
    });

    describe('Missing API key handling', () => {
        test('should return fallback response when API key is missing', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            // No API key set

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                fallback: true,
                message: 'SMS service not configured. Please set TEXTBELT_API_KEY environment variable.'
            });
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('should handle fetch errors', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockRejectedValueOnce(new Error('Network error'));

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Network error'
            });
        });

        test('should handle errors reading response text', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => {
                    throw new Error('Failed to read');
                }
            });

            await remindHandler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to read response from SMS service'
            });
        });
    });

    describe('Optional parameters', () => {
        test('should handle taskDetails parameter', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task',
                taskDetails: 'Some details'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });

        test('should handle appUrl parameter', async () => {
            mockReq.body = {
                recipient: 'mario',
                taskName: 'Test Task',
                appUrl: 'https://example.com'
            };
            process.env.TEXTBELT_API_KEY = 'test-key';

            fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ success: true })
            });

            await remindHandler(mockReq, mockRes);

            expect(fetch).toHaveBeenCalled();
        });
    });
});
