/**
 * Global teardown for Playwright E2E tests
 * Cleans up test environment after all tests complete
 */

module.exports = async (config) => {
  console.log('Cleaning up E2E test environment...');

  // Clean up test data, stop services, etc.
  // For example:
  // - Clean test database
  // - Remove uploaded files
  // - Reset mock services

  try {
    // Example cleanup operations
    // await cleanupTestDatabase();
    // await cleanupTestFiles();

    console.log('E2E test environment cleanup complete');
  } catch (error) {
    console.error('Failed to clean up E2E test environment:', error);
    // Don't throw here as it might prevent test results from being reported
  }
};