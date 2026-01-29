# TaskOrgApp Test Suite

This directory contains the comprehensive test suite for TaskOrgApp, providing multiple layers of testing to ensure code quality, performance, and reliability.

## Directory Structure

```
__tests__/
├── unit/                 # Unit tests for individual functions
│   ├── task-validation.test.js
│   ├── date-helpers.test.js
│   └── ...
├── integration/          # Integration tests for workflows
│   ├── task-creation-flow.test.js
│   ├── task-decomposition-flow.test.js
│   └── ...
├── api/                  # API endpoint tests
│   ├── chat-api.test.js
│   ├── task-api.test.js
│   └── ...
├── components/           # Frontend component tests
│   ├── taskForm.test.js
│   ├── taskMatrix.test.js
│   ├── chatPanel.test.js
│   └── ...
├── utils/                # Utility function tests
│   ├── validation.test.js
│   ├── eventBus.test.js
│   └── ...
├── database/             # Database integration tests
│   ├── setup.js
│   ├── task-crud.test.js
│   └── ...
├── performance/          # Performance benchmarks
│   ├── task-operations.bench.js
│   ├── memory-leak-detection.test.js
│   └── ...
├── e2e/                  # End-to-end tests (Playwright)
│   ├── task-management.spec.js
│   ├── chat-decomposition.spec.js
│   ├── global-setup.js
│   ├── global-teardown.js
│   └── ...
├── helpers/              # Test helper utilities
│   ├── componentHelpers.js
│   └── ...
├── mocks/                # Mock implementations
│   ├── supabase.js
│   ├── openai.js
│   └── ...
├── fixtures/             # Test data fixtures
│   ├── tasks.js
│   ├── api.js
│   └── ...
├── setup/                # Test configuration and setup
│   ├── customMatchers.js
│   ├── testUtils.js
│   ├── globalSetup.js
│   ├── testResultsProcessor.js
│   └── ...
└── README.md            # This file
```

## Test Categories

### Unit Tests (`unit/`)
Test individual functions and modules in isolation. These tests focus on:
- Function input/output validation
- Error handling
- Edge cases
- Pure logic without external dependencies

### Integration Tests (`integration/`)
Test interactions between multiple components and complete workflows. These tests verify:
- Component communication
- API workflows
- Data flow between layers
- End-to-end business logic

### API Tests (`api/`)
Test API endpoints and serverless functions. These tests cover:
- Request/response handling
- Authentication and authorization
- Error responses
- API integration with external services

### Component Tests (`components/`)
Test frontend components using jsdom. These tests verify:
- Component rendering
- User interactions
- DOM manipulation
- Component lifecycle

### Database Tests (`database/`)
Test database operations and integrity. These tests include:
- CRUD operations
- Data relationships
- Constraints and triggers
- Performance under load

### Performance Tests (`performance/`)
Monitor performance and detect regressions. These tests measure:
- Function execution time
- Memory usage patterns
- Large dataset handling
- Memory leak detection

### E2E Tests (`e2e/`)
Test complete user workflows in real browsers using Playwright. These tests verify:
- User interface functionality
- Cross-browser compatibility
- Real user scenarios
- Integration with all layers

## Running Tests

### All Tests
```bash
npm test
```

### Specific Categories
```bash
npm run test:unit
npm run test:integration
npm run test:api
npm run test:components
npm run test:e2e
npm run test:performance
npm run test:database
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Debug Mode
```bash
npm run test:debug
```

## Test Configuration

### Jest Configuration
The test suite uses a customized Jest configuration (`jest.config.js`) with:
- Multiple test environments (node, jsdom)
- Custom matchers and utilities
- Coverage thresholds
- Performance monitoring
- CI/CD integration

### Playwright Configuration
E2E tests use Playwright with:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile device emulation
- Screenshot and video capture
- Parallel test execution

## Test Utilities

### Custom Matchers
```javascript
expect(task).toBeValidTask();
expect(task).toBeInMatrixQuadrant('do');
expect(deadline).toBeValidDeadline();
expect(task).toHaveValidDependencies();
```

### Test Helpers
```javascript
const { setupComponentTest, renderComponent, simulateClick } = require('./helpers/componentHelpers');
const { mockSupabase, mockOpenAI } = require('./mocks');
const { taskFixtures, createValidTask } = require('./fixtures/tasks');
```

### Performance Monitoring
```javascript
const { measurePerformance } = require('./setup/testUtils');

// Measure function performance
const result = measurePerformance(() => {
  // Code to measure
}, 100);
```

## Test Data

### Fixtures
Predefined test data for consistent testing:
- Valid tasks in different states
- API request/response examples
- Error scenarios
- Edge cases

### Factories
Dynamic test data generation:
```javascript
const task = createValidTask({
  name: 'Custom Test Task',
  urgent: 5,
  important: 4
});
```

## Mocks and Stubs

### External Services
- **Supabase**: Database operations
- **OpenAI**: AI API calls
- **Browser APIs**: localStorage, fetch, etc.

### Component Dependencies
- Event bus communication
- State management
- API clients

## Debugging

### Debug Panel
Access the debug panel in the app by clicking the 🐛 icon (bottom-right corner).

### Console Commands
```javascript
// Enable debug logging
debug.enableDebug();

// Check memory usage
debug.logMemoryUsage();

// Track user actions
debug.trackUserAction('button_click', { button: 'submit' });

// Access error tracker
window.errorTracker.getErrors();
```

### Test Debugging
```bash
# Run specific test with debug
npm test -- --testNamePattern="should create task" --verbose

# Run with inspector
npm run test:debug -- __tests__/unit/task-validation.test.js
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled nightly runs

### Coverage Reporting
- Coverage reports uploaded to Codecov
- Minimum coverage thresholds enforced
- Coverage badges in README

### Test Results
- JUnit XML reports for CI systems
- HTML reports for manual review
- Performance regression alerts

## Best Practices

### Writing Tests
1. Use descriptive test names that explain behavior
2. Follow Arrange-Act-Assert pattern
3. Test both happy paths and error cases
4. Keep tests independent and isolated
5. Use appropriate mocking for external dependencies

### Test Organization
1. Group related tests in describe blocks
2. Use beforeEach/afterEach for setup/cleanup
3. Create reusable test utilities
4. Document complex test scenarios

### Performance Considerations
1. Mock external APIs in unit tests
2. Use realistic data sizes for performance tests
3. Monitor test execution time
4. Clean up resources properly

## Contributing

### Adding New Tests
1. Choose the appropriate test category
2. Follow existing naming conventions
3. Include proper setup and cleanup
4. Add documentation for complex tests
5. Update coverage expectations if needed

### Test Maintenance
1. Keep tests synchronized with code changes
2. Remove obsolete tests
3. Update fixtures as the app evolves
4. Review and optimize slow tests

## Troubleshooting

### Common Issues
- **Intermittent failures**: Check for race conditions and async issues
- **Memory leaks**: Ensure proper cleanup in component tests
- **Database connection issues**: Verify test database configuration
- **E2E test failures**: Check for DOM element selectors and timing

### Getting Help
1. Check existing tests for similar patterns
2. Review the main TESTING.md documentation
3. Check GitHub Issues for known problems
4. Run tests with `--verbose` flag for more details

## Performance Benchmarks

The test suite includes performance benchmarks that:
- Measure function execution times
- Detect memory leaks
- Monitor large dataset handling
- Track performance regressions over time

Run performance tests with:
```bash
npm run test:performance
```

Results are stored in `test-results/` and can be analyzed for trends.