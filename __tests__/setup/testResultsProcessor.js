/**
 * Test results processor for Jest
 * Processes and enhances test results for better reporting
 */

const fs = require('fs');
const path = require('path');

function createTestResultsProcessor(globalConfig, options = {}) {
  return {
    onTestResult(test, testResult, aggregatedResult) {
      // Process individual test results
      processTestResult(test, testResult);
      // Track test metrics
      trackTestMetrics(testResult);
    },

    onRunComplete(contexts, results) {
      // Generate custom reports
      generateCustomReport(results);
      // Log test summary
      logTestSummary(results);
    }
  };
}

function processTestResult(test, testResult) {
  // Add custom metadata to test results
  testResult.testEnvData = {
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    testFile: test.path
  };

  // Track slow tests
  const slowTests = testResult.testResults.filter(result =>
    result.duration > 1000 // Tests taking more than 1 second
  );

  if (slowTests.length > 0) {
    console.warn(`⚠️  Slow tests in ${path.basename(test.path)}:`);
    slowTests.forEach(test => {
      console.warn(`   ${test.title} (${test.duration}ms)`);
    });
  }
}

function trackTestMetrics(testResult) {
  // Track test metrics for analysis
  const metrics = {
    file: path.basename(testResult.testFilePath),
    totalTests: testResult.numPassingTests + testResult.numFailingTests,
    passing: testResult.numPassingTests,
    failing: testResult.numFailingTests,
    pending: testResult.numPendingTests,
    duration: testResult.perfStats.runtime,
    coverage: null // Would be populated if coverage data is available
  };

  // Store metrics for later analysis
  storeMetrics(metrics);
}

function generateCustomReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTestSuites: results.numTotalTestSuites,
      passedTestSuites: results.numPassedTestSuites,
      failedTestSuites: results.numFailedTestSuites,
      totalTests: results.numTotalTests,
      passedTests: results.numPassedTests,
      failedTests: results.numFailedTests,
      pendingTests: results.numPendingTests,
      runtime: results.startTime ? Date.now() - results.startTime : 0
    },
    testResults: results.testResults.map(result => ({
      file: path.basename(result.testFilePath),
      status: result.numFailingTests > 0 ? 'failed' : 'passed',
      tests: result.numPassingTests + result.numFailingTests,
      failures: result.numFailingTests,
      duration: result.perfStats.runtime
    }))
  };

  // Write custom report
  const reportPath = path.join(process.cwd(), 'test-results', 'custom-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

function logTestSummary(results) {
  const { numPassedTests, numFailedTests, numTotalTests } = results;

  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${numTotalTests}`);
  console.log(`✅ Passed: ${numPassedTests}`);
  console.log(`❌ Failed: ${numFailedTests}`);
  console.log(`⏱️  Runtime: ${results.startTime ? (Date.now() - results.startTime) + 'ms' : 'N/A'}`);

  if (numFailedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.testResults.forEach(result => {
      if (result.numFailingTests > 0) {
        console.log(`  ${path.basename(result.testFilePath)}`);
        result.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`    ❌ ${test.title}`);
          }
        });
      }
    });
  }

  console.log('='.repeat(50) + '\n');
}

function storeMetrics(metrics) {
  // Store metrics in a file for trend analysis
  const metricsDir = path.join(process.cwd(), 'test-results', 'metrics');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }

  const metricsFile = path.join(metricsDir, `${Date.now()}.json`);
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
}

module.exports = createTestResultsProcessor;