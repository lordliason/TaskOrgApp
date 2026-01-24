/**
 * Unit tests for custom error classes and formatErrorResponse.
 * Tests: ValidationError, NotFoundError, AuthenticationError, AuthorizationError,
 *        ExternalServiceError, ConfigurationError, formatErrorResponse
 */

const {
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    ExternalServiceError,
    ConfigurationError,
    formatErrorResponse
} = require('../api/lib/errors');

describe('Custom Error Classes', () => {
    describe('ValidationError', () => {
        test('should create error with message only', () => {
            const error = new ValidationError('Invalid input');

            expect(error.message).toBe('Invalid input');
            expect(error.name).toBe('ValidationError');
            expect(error.type).toBe('VALIDATION_ERROR');
            expect(error.field).toBeNull();
            expect(error.statusCode).toBe(400);
            expect(error instanceof Error).toBe(true);
        });

        test('should create error with message and field', () => {
            const error = new ValidationError('Email is invalid', 'email');

            expect(error.message).toBe('Email is invalid');
            expect(error.field).toBe('email');
            expect(error.statusCode).toBe(400);
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new ValidationError('Test error');
            }).toThrow(ValidationError);
        });
    });

    describe('NotFoundError', () => {
        test('should create error with resource only', () => {
            const error = new NotFoundError('Task');

            expect(error.message).toBe('Task not found');
            expect(error.name).toBe('NotFoundError');
            expect(error.type).toBe('NOT_FOUND');
            expect(error.resource).toBe('Task');
            expect(error.id).toBeNull();
            expect(error.statusCode).toBe(404);
        });

        test('should create error with resource and id', () => {
            const error = new NotFoundError('User', '123-abc');

            expect(error.message).toBe('User not found: 123-abc');
            expect(error.resource).toBe('User');
            expect(error.id).toBe('123-abc');
            expect(error.statusCode).toBe(404);
        });

        test('should handle empty string id as truthy', () => {
            const error = new NotFoundError('Item', '');
            expect(error.message).toBe('Item not found');
            expect(error.id).toBe('');
        });
    });

    describe('AuthenticationError', () => {
        test('should create error with default message', () => {
            const error = new AuthenticationError();

            expect(error.message).toBe('Authentication required');
            expect(error.name).toBe('AuthenticationError');
            expect(error.type).toBe('AUTHENTICATION_ERROR');
            expect(error.statusCode).toBe(401);
        });

        test('should create error with custom message', () => {
            const error = new AuthenticationError('Token expired');

            expect(error.message).toBe('Token expired');
            expect(error.statusCode).toBe(401);
        });
    });

    describe('AuthorizationError', () => {
        test('should create error with default message', () => {
            const error = new AuthorizationError();

            expect(error.message).toBe('Insufficient permissions');
            expect(error.name).toBe('AuthorizationError');
            expect(error.type).toBe('AUTHORIZATION_ERROR');
            expect(error.statusCode).toBe(403);
        });

        test('should create error with custom message', () => {
            const error = new AuthorizationError('Admin access required');

            expect(error.message).toBe('Admin access required');
            expect(error.statusCode).toBe(403);
        });
    });

    describe('ExternalServiceError', () => {
        test('should create error with service and message', () => {
            const error = new ExternalServiceError('OpenAI', 'Rate limit exceeded');

            expect(error.message).toBe('External service error (OpenAI): Rate limit exceeded');
            expect(error.name).toBe('ExternalServiceError');
            expect(error.type).toBe('EXTERNAL_SERVICE_ERROR');
            expect(error.service).toBe('OpenAI');
            expect(error.originalError).toBeNull();
            expect(error.statusCode).toBe(502);
        });

        test('should store original error when provided', () => {
            const originalError = new Error('Connection timeout');
            const error = new ExternalServiceError('SMS', 'Failed to send', originalError);

            expect(error.originalError).toBe(originalError);
            expect(error.originalError.message).toBe('Connection timeout');
        });

        test('should handle various service names', () => {
            const services = ['OpenAI', 'Textbelt', 'Supabase', 'Stripe'];
            services.forEach(service => {
                const error = new ExternalServiceError(service, 'Error');
                expect(error.service).toBe(service);
                expect(error.message).toContain(service);
            });
        });
    });

    describe('ConfigurationError', () => {
        test('should create error with message', () => {
            const error = new ConfigurationError('Missing OPENAI_API_KEY');

            expect(error.message).toBe('Configuration error: Missing OPENAI_API_KEY');
            expect(error.name).toBe('ConfigurationError');
            expect(error.type).toBe('CONFIGURATION_ERROR');
            expect(error.statusCode).toBe(500);
        });

        test('should handle various configuration error messages', () => {
            const messages = [
                'Missing environment variable',
                'Invalid database URL',
                'API key not set'
            ];
            messages.forEach(msg => {
                const error = new ConfigurationError(msg);
                expect(error.message).toBe(`Configuration error: ${msg}`);
            });
        });
    });
});

describe('formatErrorResponse', () => {
    test('should format ValidationError correctly', () => {
        const error = new ValidationError('Invalid email', 'email');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Invalid email',
            type: 'VALIDATION_ERROR',
            field: 'email',
            statusCode: 400
        });
    });

    test('should format ValidationError without field', () => {
        const error = new ValidationError('Invalid input');
        const response = formatErrorResponse(error);

        expect(response.field).toBeNull();
        expect(response.statusCode).toBe(400);
    });

    test('should format NotFoundError correctly', () => {
        const error = new NotFoundError('Task', 'task-123');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Task not found: task-123',
            type: 'NOT_FOUND',
            resource: 'Task',
            id: 'task-123',
            statusCode: 404
        });
    });

    test('should format NotFoundError without id', () => {
        const error = new NotFoundError('User');
        const response = formatErrorResponse(error);

        expect(response.resource).toBe('User');
        expect(response.id).toBeNull();
    });

    test('should format AuthenticationError correctly', () => {
        const error = new AuthenticationError('Session expired');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Session expired',
            type: 'AUTHENTICATION_ERROR',
            statusCode: 401
        });
    });

    test('should format AuthorizationError correctly', () => {
        const error = new AuthorizationError('Not allowed');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Not allowed',
            type: 'AUTHORIZATION_ERROR',
            statusCode: 403
        });
    });

    test('should format ExternalServiceError correctly', () => {
        const error = new ExternalServiceError('OpenAI', 'API down');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'External service error (OpenAI): API down',
            type: 'EXTERNAL_SERVICE_ERROR',
            service: 'OpenAI',
            statusCode: 502
        });
    });

    test('should format ConfigurationError correctly', () => {
        const error = new ConfigurationError('Missing API key');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Configuration error: Missing API key',
            type: 'CONFIGURATION_ERROR',
            statusCode: 500
        });
    });

    test('should format generic Error with default values', () => {
        const error = new Error('Something went wrong');
        const response = formatErrorResponse(error);

        expect(response).toEqual({
            error: 'Something went wrong',
            type: 'INTERNAL_ERROR',
            statusCode: 500
        });
    });

    test('should handle error without message', () => {
        const error = new Error();
        const response = formatErrorResponse(error);

        expect(response.error).toBe('Internal server error');
        expect(response.type).toBe('INTERNAL_ERROR');
        expect(response.statusCode).toBe(500);
    });

    test('should handle null-ish error message', () => {
        const error = { message: null };
        const response = formatErrorResponse(error);

        expect(response.error).toBe('Internal server error');
    });

    test('should preserve custom error properties in formatted response', () => {
        const error = new ValidationError('Bad data', 'username');
        const response = formatErrorResponse(error);

        expect(response.field).toBe('username');
        expect(response.type).toBe('VALIDATION_ERROR');
    });
});

describe('Error inheritance', () => {
    test('all custom errors should be instances of Error', () => {
        const errors = [
            new ValidationError('test'),
            new NotFoundError('test'),
            new AuthenticationError(),
            new AuthorizationError(),
            new ExternalServiceError('test', 'test'),
            new ConfigurationError('test')
        ];

        errors.forEach(error => {
            expect(error instanceof Error).toBe(true);
        });
    });

    test('custom errors should have correct prototype chain', () => {
        const validationError = new ValidationError('test');
        expect(validationError instanceof ValidationError).toBe(true);
        expect(validationError instanceof Error).toBe(true);

        const notFoundError = new NotFoundError('test');
        expect(notFoundError instanceof NotFoundError).toBe(true);
        expect(notFoundError instanceof ValidationError).toBe(false);
    });

    test('errors should have stack traces', () => {
        const error = new ValidationError('test');
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
    });
});
