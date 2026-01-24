/**
 * Custom error classes for structured error handling.
 */

/**
 * Validation error for invalid input data.
 */
class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.type = 'VALIDATION_ERROR';
        this.field = field;
        this.statusCode = 400;
    }
}

/**
 * Resource not found error.
 */
class NotFoundError extends Error {
    constructor(resource, id = null) {
        const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
        super(message);
        this.name = 'NotFoundError';
        this.type = 'NOT_FOUND';
        this.resource = resource;
        this.id = id;
        this.statusCode = 404;
    }
}

/**
 * Authentication/authorization error.
 */
class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
        this.type = 'AUTHENTICATION_ERROR';
        this.statusCode = 401;
    }
}

/**
 * Authorization/permission error.
 */
class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
        this.type = 'AUTHORIZATION_ERROR';
        this.statusCode = 403;
    }
}

/**
 * External service error (e.g., OpenAI API, SMS service).
 */
class ExternalServiceError extends Error {
    constructor(service, message, originalError = null) {
        super(`External service error (${service}): ${message}`);
        this.name = 'ExternalServiceError';
        this.type = 'EXTERNAL_SERVICE_ERROR';
        this.service = service;
        this.originalError = originalError;
        this.statusCode = 502;
    }
}

/**
 * Configuration error (missing env vars, invalid config).
 */
class ConfigurationError extends Error {
    constructor(message) {
        super(`Configuration error: ${message}`);
        this.name = 'ConfigurationError';
        this.type = 'CONFIGURATION_ERROR';
        this.statusCode = 500;
    }
}

/**
 * Format error for consistent API error responses.
 * @param {Error} error
 * @returns {{ error: string, type?: string, field?: string, statusCode: number }}
 */
function formatErrorResponse(error) {
    if (error instanceof ValidationError) {
        return {
            error: error.message,
            type: error.type,
            field: error.field,
            statusCode: error.statusCode
        };
    }
    if (error instanceof NotFoundError) {
        return {
            error: error.message,
            type: error.type,
            resource: error.resource,
            id: error.id,
            statusCode: error.statusCode
        };
    }
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return {
            error: error.message,
            type: error.type,
            statusCode: error.statusCode
        };
    }
    if (error instanceof ExternalServiceError) {
        return {
            error: error.message,
            type: error.type,
            service: error.service,
            statusCode: error.statusCode
        };
    }
    if (error instanceof ConfigurationError) {
        return {
            error: error.message,
            type: error.type,
            statusCode: error.statusCode
        };
    }
    return {
        error: error.message || 'Internal server error',
        type: 'INTERNAL_ERROR',
        statusCode: 500
    };
}

module.exports = {
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    ExternalServiceError,
    ConfigurationError,
    formatErrorResponse
};
