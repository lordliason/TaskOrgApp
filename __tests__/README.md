# Unit Tests

This directory contains unit tests for the TaskOrgApp core functions. These tests are designed to ensure code quality and catch regressions when making changes or adding new features.

## Running Tests

### Install Dependencies

First, install the required testing dependencies:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Watch for file changes and automatically re-run tests:

```bash
npm run test:watch
```

### Generate Coverage Report

Generate a coverage report to see which parts of your code are tested:

```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view a detailed coverage report.

## Test Structure

Tests are organized by functionality:

- **`task-management.test.js`** - Tests for `createTask`, `splitTask`, `updateTask`, `getTasks`
- **`decomposition.test.js`** - Tests for `decomposeTask`, `refineDecomposition`, `finalizeDecomposition`
- **`helpers.test.js`** - Tests for helper functions like `calculateDeadline`, `assignMatrixPositions`, `suggestIntegrations`, etc.

## Writing New Tests

When adding new features or functions, follow these guidelines:

1. **Create tests for new functions** - Every new function should have corresponding unit tests
2. **Test edge cases** - Include tests for boundary conditions, invalid inputs, and error cases
3. **Test happy paths** - Ensure normal usage works as expected
4. **Keep tests isolated** - Each test should be independent and not rely on other tests
5. **Use descriptive names** - Test names should clearly describe what is being tested

### Example Test Structure

```javascript
describe('myNewFunction', () => {
    test('should handle normal case', () => {
        // Arrange
        const input = { /* test data */ };
        
        // Act
        const result = myNewFunction(input);
        
        // Assert
        expect(result).toHaveProperty('expectedProperty');
    });

    test('should throw error for invalid input', () => {
        expect(() => myNewFunction(null)).toThrow('Expected error message');
    });
});
```

## Best Practices

1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive test names** - Names should read like documentation
3. **Arrange-Act-Assert pattern** - Structure tests clearly
4. **Test edge cases** - Include tests for null, undefined, empty arrays, etc.
5. **Mock external dependencies** - Don't make real API calls or database queries in unit tests
6. **Keep tests fast** - Unit tests should run quickly

## Continuous Integration

These tests are designed to be run in CI/CD pipelines. Make sure all tests pass before merging pull requests.

## Coverage Goals

Aim for:
- **80%+ line coverage** - Most code paths should be tested
- **100% critical path coverage** - All important business logic should be tested
- **Edge case coverage** - Error handling and boundary conditions should be tested

