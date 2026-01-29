/**
 * Debugging utilities for TaskOrgApp
 * Provides logging, error tracking, and debugging helpers
 */

class DebugManager {
  constructor() {
    this.enabled = process.env.NODE_ENV === 'development' || localStorage.getItem('debug') === 'true';
    this.logLevel = localStorage.getItem('logLevel') || 'info';
    this.logs = [];
    this.maxLogs = 1000;
    this.errorBoundary = null;

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.init();
  }

  init() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up console overrides for production debugging
    if (this.enabled) {
      this.setupConsoleOverrides();
    }

    // Initialize debug panel if in development
    if (this.isDevelopment()) {
      this.initDebugPanel();
    }
  }

  setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global error caught:', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection:', event.reason, {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Vue/React error boundary equivalent
    this.errorBoundary = {
      captureError: (error, errorInfo) => {
        this.error('Component error boundary:', error, errorInfo);
      }
    };
  }

  setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.warn('Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        this.debug('Performance monitoring not supported');
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.debug('Memory usage:', {
          used: Math.round(memInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }, 30000); // Every 30 seconds
    }
  }

  setupConsoleOverrides() {
    // Store original console methods
    const originalConsole = { ...console };

    // Override console methods to also log to our system
    ['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
      console[level] = (...args) => {
        // Call original method
        originalConsole[level](...args);

        // Also log to our system
        this.log(level, ...args);
      };
    });
  }

  initDebugPanel() {
    // Create debug panel toggle
    const debugToggle = document.createElement('div');
    debugToggle.id = 'debug-toggle';
    debugToggle.innerHTML = '🐛';
    debugToggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #007acc;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      font-size: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    debugToggle.addEventListener('click', () => this.toggleDebugPanel());

    document.body.appendChild(debugToggle);
  }

  toggleDebugPanel() {
    let panel = document.getElementById('debug-panel');

    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
      this.createDebugPanel();
    }
  }

  createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 9998;
      overflow-y: auto;
      display: block;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>TaskOrg Debug Panel</strong>
        <button id="clear-logs" style="float: right; background: #333; color: #00ff00; border: none; padding: 2px 5px;">Clear</button>
      </div>
      <div id="debug-logs" style="height: 400px; overflow-y: auto; white-space: pre-wrap;"></div>
      <div style="margin-top: 10px;">
        <input id="debug-command" type="text" placeholder="Enter debug command..." style="width: 70%; background: #333; color: #00ff00; border: 1px solid #555; padding: 2px;">
        <button id="run-command" style="background: #333; color: #00ff00; border: 1px solid #555; padding: 2px 5px;">Run</button>
      </div>
    `;

    document.body.appendChild(panel);

    // Bind events
    document.getElementById('clear-logs').addEventListener('click', () => {
      this.clearLogs();
      this.updateDebugPanel();
    });

    document.getElementById('run-command').addEventListener('click', () => {
      const command = document.getElementById('debug-command').value;
      this.runDebugCommand(command);
      document.getElementById('debug-command').value = '';
    });

    this.updateDebugPanel();
  }

  updateDebugPanel() {
    const logsContainer = document.getElementById('debug-logs');
    if (logsContainer) {
      logsContainer.textContent = this.logs.slice(-50).map(log =>
        `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
      ).join('\n');
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  // Logging methods
  log(level, ...args) {
    if (!this.shouldLog(level)) return;

    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const logEntry = {
      level,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data: args.length > 1 ? args.slice(1) : null
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update debug panel if visible
    if (document.getElementById('debug-panel') && document.getElementById('debug-panel').style.display !== 'none') {
      this.updateDebugPanel();
    }

    // Send to external logging service in production
    if (!this.isDevelopment()) {
      this.sendToExternalLogger(logEntry);
    }
  }

  error(...args) { this.log('error', ...args); }
  warn(...args) { this.log('warn', ...args); }
  info(...args) { this.log('info', ...args); }
  debug(...args) { this.log('debug', ...args); }
  trace(...args) { this.log('trace', ...args); }

  shouldLog(level) {
    return this.enabled && this.levels[level] <= this.levels[this.logLevel];
  }

  clearLogs() {
    this.logs = [];
  }

  runDebugCommand(command) {
    try {
      const result = eval(command);
      this.info('Debug command result:', result);
    } catch (error) {
      this.error('Debug command error:', error.message);
    }
  }

  sendToExternalLogger(logEntry) {
    // Send to external logging service (e.g., Sentry, LogRocket, etc.)
    // This would be implemented based on your logging service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: logEntry.message,
        fatal: logEntry.level === 'error'
      });
    }
  }

  // Utility methods
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  setLogLevel(level) {
    if (this.levels[level] !== undefined) {
      this.logLevel = level;
      localStorage.setItem('logLevel', level);
      this.info(`Log level set to: ${level}`);
    }
  }

  enableDebug() {
    this.enabled = true;
    localStorage.setItem('debug', 'true');
    this.info('Debug mode enabled');
  }

  disableDebug() {
    this.enabled = false;
    localStorage.removeItem('debug');
    this.info('Debug mode disabled');
  }

  // Performance debugging
  startTimer(name) {
    this.debug(`Timer started: ${name}`);
    console.time(name);
  }

  endTimer(name) {
    console.timeEnd(name);
    this.debug(`Timer ended: ${name}`);
  }

  // Memory debugging
  logMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      this.info('Memory usage:', {
        used: Math.round(memInfo.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memInfo.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) + ' MB'
      });
    }
  }

  // Network debugging
  logNetworkRequest(url, options = {}) {
    this.debug('Network request:', { url, ...options });
  }

  logNetworkResponse(url, response, duration) {
    this.debug('Network response:', { url, status: response.status, duration: `${duration}ms` });
  }

  // Component debugging
  logComponentRender(componentName, props) {
    this.trace(`Component render: ${componentName}`, props);
  }

  logComponentUpdate(componentName, prevProps, nextProps) {
    this.trace(`Component update: ${componentName}`, { prevProps, nextProps });
  }

  // Error tracking
  trackError(error, context = {}) {
    this.error('Tracked error:', error, context);

    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    }
  }

  // User action tracking
  trackUserAction(action, data = {}) {
    this.info('User action:', action, data);

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', action, data);
    }
  }
}

// Create singleton instance
const debug = new DebugManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debug;
}

// Make available globally for debugging
window.debug = debug;

export default debug;