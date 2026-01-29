/**
 * Error tracking and monitoring utilities
 * Provides comprehensive error handling and reporting
 */

import debug from './debug.js';

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.errorHandlers = new Map();
    this.recoveryStrategies = new Map();

    this.init();
  }

  init() {
    // Set up global error boundaries
    this.setupErrorBoundaries();

    // Set up network error tracking
    this.setupNetworkErrorTracking();

    // Set up periodic error reporting
    this.setupPeriodicReporting();
  }

  setupErrorBoundaries() {
    // React/Vue-style error boundary
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection',
        reason: event.reason,
        promise: event.promise,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupNetworkErrorTracking() {
    // Monkey patch fetch for error tracking
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        debug.logNetworkRequest(args[0], args[1]);
        debug.logNetworkResponse(args[0], response, duration);

        // Track failed requests
        if (!response.ok) {
          this.trackError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            type: 'network_error',
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            duration,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.trackError(error, {
          type: 'network_failure',
          url: args[0],
          method: args[1]?.method || 'GET',
          duration,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  }

  setupPeriodicReporting() {
    // Report errors every 30 seconds if there are any
    setInterval(() => {
      if (this.errors.length > 0) {
        this.reportErrors();
      }
    }, 30000);
  }

  trackError(error, context = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : error,
      context,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      resolved: false
    };

    this.errors.push(errorEntry);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    debug.error('Error tracked:', errorEntry);

    // Call error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(errorEntry);
      } catch (handlerError) {
        debug.error('Error in error handler:', handlerError);
      }
    });

    // Attempt recovery if strategy exists
    this.attemptRecovery(error, context);
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentUserId() {
    // Get from your auth system
    return localStorage.getItem('userId') || 'anonymous';
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  addErrorHandler(name, handler) {
    this.errorHandlers.set(name, handler);
  }

  removeErrorHandler(name) {
    this.errorHandlers.delete(name);
  }

  addRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  attemptRecovery(error, context) {
    const errorType = context.type || 'unknown';

    const strategy = this.recoveryStrategies.get(errorType);
    if (strategy) {
      try {
        debug.info('Attempting error recovery:', errorType);
        strategy(error, context);
      } catch (recoveryError) {
        debug.error('Error recovery failed:', recoveryError);
      }
    }
  }

  reportErrors() {
    const unreportedErrors = this.errors.filter(e => !e.reported);

    if (unreportedErrors.length === 0) return;

    // Group similar errors
    const groupedErrors = this.groupErrors(unreportedErrors);

    // Send to error reporting service
    this.sendErrorReport(groupedErrors);

    // Mark as reported
    unreportedErrors.forEach(error => {
      error.reported = true;
    });
  }

  groupErrors(errors) {
    const groups = new Map();

    errors.forEach(error => {
      const key = `${error.error.name || 'Unknown'}:${error.context.type || 'unknown'}:${error.error.message || ''}`;

      if (!groups.has(key)) {
        groups.set(key, {
          error: error.error,
          context: error.context,
          count: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          instances: []
        });
      }

      const group = groups.get(key);
      group.count++;
      group.lastSeen = error.timestamp;
      group.instances.push(error);
    });

    return Array.from(groups.values());
  }

  sendErrorReport(groupedErrors) {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      errors: groupedErrors
    };

    // Send to your error reporting service
    if (window.Sentry) {
      groupedErrors.forEach(group => {
        window.Sentry.captureException(new Error(group.error.message), {
          extra: {
            count: group.count,
            firstSeen: group.firstSeen,
            lastSeen: group.lastSeen,
            context: group.context
          }
        });
      });
    }

    // Also send via fetch to your backend
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    }).catch(error => {
      debug.error('Failed to send error report:', error);
    });
  }

  // Utility methods for debugging
  getErrors(filter = {}) {
    let filteredErrors = [...this.errors];

    if (filter.type) {
      filteredErrors = filteredErrors.filter(e => e.context.type === filter.type);
    }

    if (filter.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(e => e.resolved === filter.resolved);
    }

    if (filter.since) {
      const since = new Date(filter.since).getTime();
      filteredErrors = filteredErrors.filter(e => new Date(e.timestamp).getTime() >= since);
    }

    return filteredErrors;
  }

  resolveError(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      debug.info('Error resolved:', errorId);
    }
  }

  clearErrors() {
    this.errors = [];
    debug.info('Error history cleared');
  }

  // Performance error tracking
  trackPerformanceIssue(metric, value, threshold) {
    if (value > threshold) {
      this.trackError(new Error(`Performance issue: ${metric} exceeded threshold`), {
        type: 'performance_issue',
        metric,
        value,
        threshold,
        timestamp: new Date().toISOString()
      });
    }
  }

  // User experience error tracking
  trackUXError(action, error, context = {}) {
    this.trackError(error, {
      type: 'ux_error',
      action,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

// Recovery strategies
const recoveryStrategies = {
  network_error: (error, context) => {
    // Retry logic for network errors
    if (context.status === 429) {
      debug.info('Rate limited, implementing backoff');
      // Implement exponential backoff
    } else if (context.status >= 500) {
      debug.info('Server error, could retry or show offline message');
    }
  },

  javascript_error: (error, context) => {
    // Try to recover from JavaScript errors
    if (context.filename?.includes('component')) {
      debug.info('Component error, could re-render component');
      // Trigger component re-render
    }
  }
};

// Create singleton instance
const errorTracker = new ErrorTracker();

// Add default recovery strategies
Object.entries(recoveryStrategies).forEach(([type, strategy]) => {
  errorTracker.addRecoveryStrategy(type, strategy);
});

// Export for use in other modules
export default errorTracker;

// Make available globally for debugging
window.errorTracker = errorTracker;