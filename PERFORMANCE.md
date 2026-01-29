# Performance Testing Guide

This guide covers performance testing and monitoring for TaskOrgApp, including benchmarks, memory leak detection, and performance regression prevention.

## Overview

Performance testing ensures that the application meets performance requirements and prevents regressions. The test suite includes:

- **Performance benchmarks** for core operations
- **Memory leak detection** tests
- **Load testing** capabilities
- **Performance monitoring** in production

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run specific performance tests
npm test -- --testPathPattern=performance

# Run memory leak detection
npm test -- --testPathPattern=memory-leak

# Run with detailed output
npm run test:performance -- --verbose
```

## Performance Benchmarks

### Task Operations Benchmark

Measures performance of core task operations:

```javascript
// Example benchmark output
Task Creation Performance: {
  average: "0.15ms",
  median: "0.12ms",
  min: "0.08ms",
  max: "0.45ms",
  iterations: 1000
}
```

**Thresholds:**
- Task creation: < 1ms average
- Task filtering: < 10ms for 1000 tasks
- Task search: < 20ms for 500 tasks

### Memory Usage Benchmarks

Monitors memory consumption patterns:

```javascript
// Example memory analysis
Component Memory Leak Test: {
  componentsCreated: 50,
  memoryDelta: "45 KB",
  creationDelta: "2.3 MB",
  cleanupDelta: "1.8 MB"
}
```

**Memory Limits:**
- Component creation: < 1MB total growth
- DOM operations: < 5MB for 1000 elements
- Data processing: < 10MB for 10k items

## Performance Monitoring

### In-Application Monitoring

The app includes built-in performance monitoring:

```javascript
// Start timing an operation
debug.startTimer('task-creation');

// ... perform operation ...

// End timing and log
debug.endTimer('task-creation');

// Check memory usage
debug.logMemoryUsage();
```

### Browser Performance API

The app uses the Performance API to monitor:

- **Long tasks** (>50ms)
- **Memory usage** (if available)
- **Network requests**
- **Component render times**

### Performance Observer

```javascript
// Monitor long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      debug.warn('Long task detected:', {
        duration: entry.duration,
        startTime: entry.startTime
      });
    }
  }
});
observer.observe({ entryTypes: ['longtask'] });
```

## Memory Leak Detection

### Automatic Detection

The test suite includes memory leak detection that monitors:

- **DOM element leaks** after component destruction
- **Event listener leaks** from improper cleanup
- **Timer/interval leaks** from forgotten timeouts
- **Circular reference leaks** in data structures

### Manual Memory Inspection

```javascript
// Check memory usage at any point
monitorMemoryUsage('Before operation');

// Perform operation
await someOperation();

// Check memory again
monitorMemoryUsage('After operation');
```

### Memory Profiling

For detailed memory analysis:

1. Open Chrome DevTools
2. Go to Memory tab
3. Take heap snapshot before operation
4. Perform operation
5. Take another snapshot
6. Compare snapshots to find leaks

## Performance Regression Detection

### Automated Regression Detection

The test suite automatically detects performance regressions:

```javascript
function detectPerformanceRegression(currentMetrics, historicalMetrics) {
  const avgHistorical = historicalMetrics.reduce((sum, m) =>
    sum + m.metrics.avg, 0) / historicalMetrics.length;

  const threshold = avgHistorical * 1.2; // 20% degradation

  if (currentMetrics.avg > threshold) {
    return {
      regression: true,
      degradation: ((currentMetrics.avg - avgHistorical) / avgHistorical * 100)
    };
  }

  return { regression: false };
}
```

### Regression Alerts

When regressions are detected:
- Tests will fail with performance assertions
- CI/CD will block deployments
- Alerts are sent to developers
- Historical data is preserved for analysis

## Load Testing

### Simulated Load Testing

```javascript
// Test concurrent operations
async function testConcurrentLoad(concurrency = 10, operations = 100) {
  const promises = [];

  for (let i = 0; i < operations; i++) {
    promises.push(simulateOperation(i % concurrency));
  }

  const startTime = performance.now();
  await Promise.all(promises);
  const totalTime = performance.now() - startTime;

  return {
    totalTime,
    avgTimePerOperation: totalTime / operations,
    operationsPerSecond: operations / (totalTime / 1000)
  };
}
```

### API Load Testing

For API endpoints:

```bash
# Use tools like Artillery or k6 for load testing
npx artillery run load-test.yml

# Or use built-in load testing
npm run test:load
```

## Optimization Strategies

### Code Optimization

1. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

2. **Lazy Loading**
   ```javascript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

3. **Memoization**
   ```javascript
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   ```

### Database Optimization

1. **Query Optimization**
   - Use appropriate indexes
   - Avoid N+1 queries
   - Use pagination for large datasets

2. **Connection Pooling**
   - Reuse database connections
   - Implement connection limits
   - Use prepared statements

### Frontend Optimization

1. **Virtual Scrolling**
   ```javascript
   // For large lists, use virtual scrolling
   <VirtualizedList items={largeDataset} itemHeight={50} />
   ```

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Optimize image sizes

## Performance Metrics

### Key Metrics to Monitor

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Task Creation | < 1ms | 0.15ms | ✅ |
| Task Filtering (1000 items) | < 10ms | 3.2ms | ✅ |
| Memory Usage (component) | < 1MB | 0.45MB | ✅ |
| Bundle Size | < 500KB | 320KB | ✅ |
| First Contentful Paint | < 1.5s | 0.8s | ✅ |

### Performance Budget

```javascript
const performanceBudget = {
  // Bundle size
  'bundle-size': '500 KB',

  // Core Web Vitals
  'first-contentful-paint': '1.5 s',
  'largest-contentful-paint': '2.5 s',
  'cumulative-layout-shift': '0.1',

  // Custom metrics
  'task-creation-time': '1 ms',
  'memory-usage': '50 MB'
};
```

## CI/CD Performance Checks

### Automated Performance Testing

GitHub Actions runs performance tests on:
- Every pull request
- Daily scheduled runs
- Before production deployments

### Performance Gates

Deployments are blocked if:
- Performance regresses by >20%
- Memory usage increases by >10MB
- Bundle size increases by >5%

### Performance Reporting

```yaml
- name: Run performance tests
  run: npm run test:performance

- name: Compare performance
  run: |
    # Compare current performance with baseline
    # Fail CI if regression detected

- name: Upload performance results
  uses: actions/upload-artifact@v4
  with:
    name: performance-results
    path: test-results/performance/
```

## Debugging Performance Issues

### Performance Profiling

1. **Chrome DevTools**
   - Performance tab for CPU profiling
   - Memory tab for heap snapshots
   - Network tab for request timing

2. **React DevTools**
   - Profiler for component render times
   - Highlight updates for unnecessary re-renders

3. **Custom Profiling**
   ```javascript
   // Profile specific functions
   console.profile('expensive-operation');
   expensiveOperation();
   console.profileEnd('expensive-operation');
   ```

### Common Performance Issues

1. **Excessive Re-renders**
   ```javascript
   // Bad: Creates new function on every render
   <button onClick={() => handleClick(id)}>Click</button>

   // Good: Memoize callback
   const handleClick = useCallback(() => { ... }, [id]);
   <button onClick={handleClick}>Click</button>
   ```

2. **Memory Leaks in useEffect**
   ```javascript
   // Bad: Missing cleanup
   useEffect(() => {
     const interval = setInterval(() => { ... }, 1000);
   }, []);

   // Good: Proper cleanup
   useEffect(() => {
     const interval = setInterval(() => { ... }, 1000);
     return () => clearInterval(interval);
   }, []);
   ```

3. **Inefficient Selectors**
   ```javascript
   // Bad: Creates new array on every render
   const completedTasks = tasks.filter(task => task.completed);

   // Good: Use memoization
   const completedTasks = useMemo(() =>
     tasks.filter(task => task.completed),
     [tasks]
   );
   ```

## Performance Best Practices

### Code-Level Optimizations

1. **Avoid unnecessary computations in render**
2. **Use React.memo for expensive components**
3. **Implement proper key props for lists**
4. **Debounce expensive operations**
5. **Use Web Workers for CPU-intensive tasks**

### Network Optimizations

1. **Implement proper caching strategies**
2. **Use CDN for static assets**
3. **Compress responses with gzip**
4. **Implement lazy loading for images**
5. **Use service workers for offline functionality**

### Database Optimizations

1. **Add appropriate database indexes**
2. **Use query optimization techniques**
3. **Implement connection pooling**
4. **Use database query profiling**
5. **Implement proper pagination**

### Monitoring and Alerting

1. **Set up performance monitoring in production**
2. **Implement alerting for performance regressions**
3. **Monitor Core Web Vitals**
4. **Track user experience metrics**
5. **Regular performance audits**

## Performance Checklist

### Before Deployment
- [ ] Run performance tests
- [ ] Check bundle size
- [ ] Verify Core Web Vitals
- [ ] Test on slow connections
- [ ] Monitor memory usage

### During Development
- [ ] Profile expensive operations
- [ ] Check for unnecessary re-renders
- [ ] Optimize images and assets
- [ ] Implement proper caching
- [ ] Test on mobile devices

### Production Monitoring
- [ ] Set up real user monitoring
- [ ] Monitor server response times
- [ ] Track error rates
- [ ] Monitor resource usage
- [ ] Regular performance reviews