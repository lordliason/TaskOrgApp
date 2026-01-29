# TaskOrgApp Testing Framework

This comprehensive testing framework provides multiple layers of testing to ensure code quality, performance, and reliability of the TaskOrgApp.

## Testing Overview

### Test Types

1. **Unit Tests** - Test individual functions and modules in isolation
2. **Integration Tests** - Test interactions between components and API workflows
3. **End-to-End Tests** - Test complete user workflows in the browser
4. **Database Tests** - Test database operations and integrity
5. **Performance Tests** - Monitor performance and detect regressions
6. **Memory Leak Tests** - Detect memory leaks and usage issues

### Test Organization

```
__tests__/
├── unit/                 # Unit tests for individual functions
├── integration/          # Integration tests for workflows
├── api/                  # API endpoint tests
├── components/           # Frontend component tests
├── utils/                # Utility function tests
├── database/             # Database integration tests
├── performance/          # Performance benchmarks
├── e2e/                  # End-to-end tests (Playwright)
├── helpers/              # Test helper utilities
├── mocks/                # Mock implementations
├── fixtures/             # Test data fixtures
└── setup/                # Test configuration and setup
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api          # API tests only
npm run test:components    # Component tests only
npm run test:e2e          # End-to-end tests
npm run test:performance   # Performance tests

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/unit/task-validation.test.js
```

### Advanced Options

```bash
# Run tests with debug logging
npm run test:debug

# Run tests matching pattern
npm test -- --testNamePattern="should create task"

# Run tests for specific file
npm test -- --testPathPattern=task-management

# Generate HTML coverage report
npm run test:coverage && open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Tests

```javascript
const { someFunction } = require('../path/to/module');

describe('Some Function', () => {
  describe('Basic functionality', () => {
    test('should return expected result', () => {
      const result = someFunction('input');
      expect(result).toBe('expected output');
    });

    test('should handle edge cases', () => {
      expect(() => someFunction(null)).toThrow('Error message');
    });
  });

  describe('Validation', () => {
    test('should validate input parameters', () => {
      // Test validation logic
    });
  });
});
```

### Component Tests

```javascript
const { setupComponentTest, renderComponent, simulateClick } = require('../helpers/componentHelpers');

describe('TaskForm Component', () => {
  let component, container;

  beforeEach(() => {
    const dom = setupComponentTest();
    ({ component, container } = renderComponent(TaskForm, { onSubmit: jest.fn() }));
  });

  afterEach(() => {
    cleanupComponentTest();
  });

  test('should render form elements', () => {
    expect(container.querySelector('[data-testid="task-name-input"]')).toBeVisible();
    expect(container.querySelector('[data-testid="submit-button"]')).toBeVisible();
  });

  test('should handle form submission', () => {
    const mockSubmit = jest.fn();
    component.onSubmit = mockSubmit;

    // Fill form and submit
    simulateInput(container.querySelector('[data-testid="task-name-input"]'), 'Test Task');
    simulateClick(container.querySelector('[data-testid="submit-button"]'));

    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

### Integration Tests

```javascript
const { mockSupabase } = require('../mocks/supabase');

describe('Task Creation Workflow', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = mockSupabase();
  });

  test('should create task and update UI', async () => {
    // Mock API responses
    mockClient.from('tasks').insert.mockResolvedValue({
      data: { id: 'task_123', name: 'Test Task' },
      error: null
    });

    // Test complete workflow from form to database
    // ... test implementation
  });
});
```

### E2E Tests

```javascript
import { test, expect } from '@playwright/test';

test('should create task through UI', async ({ page }) => {
  await page.goto('/');

  // Interact with the application
  await page.fill('[data-testid="task-name-input"]', 'E2E Test Task');
  await page.click('[data-testid="submit-button"]');

  // Verify results
  await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'E2E Test Task' })).toBeVisible();
});
```

## Test Utilities

### Custom Matchers

```javascript
expect(task).toBeValidTask();
expect(task).toBeInMatrixQuadrant('do');
expect(deadline).toBeValidDeadline();
expect(task).toHaveValidDependencies();
```

### Test Fixtures

```javascript
const { taskFixtures, createValidTask } = require('../fixtures/tasks');

// Use predefined fixtures
const task = taskFixtures.simple;

// Create dynamic fixtures
const customTask = createValidTask({
  name: 'Custom Task',
  urgent: 5,
  important: 4
});
```

### Mock Helpers

```javascript
const { mockSupabase, mockOpenAI } = require('../mocks');

// Mock external dependencies
const mockDb = mockSupabase();
const mockAI = mockOpenAI();
```

## Debugging and Troubleshooting

### Debug Panel

The app includes a debug panel accessible by clicking the 🐛 icon in the bottom-right corner. It provides:

- Real-time logs
- Memory usage statistics
- Component render tracking
- Network request monitoring

### Console Commands

```javascript
// Enable debug mode
debug.enableDebug();

// Log memory usage
debug.logMemoryUsage();

// Track user actions
debug.trackUserAction('task_created', { taskId: '123' });

// Run debug commands
debug.runDebugCommand('console.log(window.location)');
```

### Performance Monitoring

```javascript
// Start performance timer
debug.startTimer('task-creation');

// ... code to measure ...

// End timer and log
debug.endTimer('task-creation');
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Daily schedule (nightly tests)

### Test Results

- Test reports available in GitHub Actions
- Coverage reports uploaded to Codecov
- Failed tests trigger notifications

### Environment Variables

```bash
# Required for CI
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...

# Optional
TEST_SUPABASE_URL=...          # For database tests
SKIP_DB_TESTS=true            # Skip database tests
CI=true                       # Enable CI mode
```

## Best Practices

### Test Structure

1. **Arrange-Act-Assert** pattern
2. **One assertion per test** when possible
3. **Descriptive test names** that explain what and why
4. **Proper setup and teardown** to avoid test interference

### Test Coverage

- Aim for 80%+ code coverage
- Focus on critical business logic
- Include error paths and edge cases
- Test both happy path and failure scenarios

### Performance Testing

- Include performance assertions in tests
- Monitor for performance regressions
- Test with realistic data sizes
- Profile memory usage in component tests

### Database Testing

- Use test database for integration tests
- Clean up test data between tests
- Test database constraints and triggers
- Verify data integrity and relationships

### Component Testing

- Test component rendering and interactions
- Verify accessibility features
- Test responsive behavior
- Include visual regression tests when possible

## Common Issues and Solutions

### Tests Failing Intermittently

1. **Race conditions**: Use `await` properly, avoid setTimeout
2. **Shared state**: Clean up between tests
3. **Network issues**: Mock external APIs
4. **Timing issues**: Use proper waits and retries

### Memory Leaks in Tests

1. **DOM elements**: Clean up after component tests
2. **Event listeners**: Remove listeners in cleanup
3. **Timers**: Clear intervals and timeouts
4. **Global state**: Reset global variables

### Database Connection Issues

1. **Test database**: Use separate test database
2. **Connection pooling**: Ensure proper cleanup
3. **Migrations**: Run migrations before tests
4. **Transaction rollback**: Use transactions for test isolation

## Contributing

### Adding New Tests

1. Follow the existing file structure
2. Use descriptive test names
3. Include proper setup and cleanup
4. Add test documentation
5. Update coverage requirements if needed

### Test Maintenance

1. Keep tests up to date with code changes
2. Remove obsolete tests
3. Refactor tests when code is refactored
4. Review test performance regularly

## Quick Reference

### Test Commands
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
npm run test:e2e           # E2E tests only
npm run test:performance   # Performance tests
```

### Debug Commands
```javascript
debug.enableDebug()         # Enable debug mode
debug.logMemoryUsage()      # Check memory
debug.clearLogs()           # Clear debug logs
window.errorTracker         # Access error tracker
```

### Coverage Goals
- Statements: 80%
- Branches: 75%
- Functions: 85%
- Lines: 80%

---

## Legacy Testing (Original Documentation)

### Manual Testing Script

Run the standalone test:
```bash
node test-decomposition.js
```

This tests all the decomposition functions without needing the full app.

### Quick Manual Test

1. **Open your app** (locally or deployed)
2. **Open the AI Assistant chat** (the chat interface in your app)
3. **Try these commands:**

#### Basic Decomposition
```
Can you help me decompose "hang wall curtains"?
```

#### With More Details
```
Can you decompose "Plan family vacation to Europe" with deadline August 15th?
```

#### Complex Task
```
Break down "Redesign company website" into subtasks for Mario and Maria
```

### Expected Behavior

1. **Initial Response**: The AI should create an initial breakdown with 3-6 subtasks
2. **If Questions Needed**: The AI will ask 2-4 clarifying questions
3. **After You Answer**: The AI refines the plan and may ask more questions or finalize
4. **Final Result**: Parent task and subtasks created with proper assignments

### Troubleshooting

#### If AI responds with "Found X tasks" instead of decomposing:

1. **Check the system prompt** - Make sure the API is using the updated prompt
2. **Check function availability** - Verify `decomposeTask` is in the functions list
3. **Try rephrasing** - Use words like "decompose", "break down", "split into subtasks"

#### If tasks aren't being created:

1. **Check browser console** - Look for errors in the developer tools
2. **Check database** - Verify Supabase connection is working
3. **Check API logs** - If deployed on Vercel, check function logs

### Database Setup

Make sure you've run the updated `setup.sql` to add:
- `deadline` column
- `depends_on` column
- `parent_task_id` column

Run in Supabase SQL Editor if you haven't already.