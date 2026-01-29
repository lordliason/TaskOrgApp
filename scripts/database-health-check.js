#!/usr/bin/env node

/**
 * Database Health Check Script
 * Performs routine health checks on the production database
 */

const { createClient } = require('@supabase/supabase-js');

async function runHealthCheck() {
  console.log('🔍 Starting database health check...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    overall: 'healthy'
  };

  try {
    // Check 1: Database connectivity
    console.log('📡 Testing database connectivity...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('tasks')
      .select('count', { count: 'exact', head: true });

    results.checks.connectivity = {
      status: connectionError ? 'failed' : 'passed',
      error: connectionError?.message,
      responseTime: Date.now()
    };

    // Check 2: Table existence and structure
    console.log('📋 Checking table structures...');
    const tables = ['tasks', 'organizations', 'users'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        results.checks[`table_${table}`] = {
          status: error ? 'failed' : 'passed',
          error: error?.message,
          hasData: data && data.length > 0
        };
      } catch (error) {
        results.checks[`table_${table}`] = {
          status: 'failed',
          error: error.message
        };
      }
    }

    // Check 3: Data integrity
    console.log('🔍 Checking data integrity...');

    // Check for orphaned tasks
    const { data: orphanedTasks, error: orphanedError } = await supabase
      .from('tasks')
      .select('id, parent_task_id')
      .not('parent_task_id', 'is', null);

    if (!orphanedError && orphanedTasks) {
      const parentIds = orphanedTasks.map(t => t.parent_task_id);
      const { data: existingParents, error: parentError } = await supabase
        .from('tasks')
        .select('id')
        .in('id', parentIds);

      const existingParentIds = new Set((existingParents || []).map(p => p.id));
      const orphanedCount = parentIds.filter(id => !existingParentIds.has(id)).length;

      results.checks.data_integrity = {
        status: orphanedCount > 0 ? 'warning' : 'passed',
        orphanedTasks: orphanedCount,
        totalTasks: orphanedTasks.length
      };
    }

    // Check 4: Performance metrics
    console.log('⚡ Checking performance metrics...');

    const startTime = Date.now();
    const { data: performanceData, error: performanceError } = await supabase
      .from('tasks')
      .select('*')
      .limit(100);

    const queryTime = Date.now() - startTime;

    results.checks.performance = {
      status: queryTime > 5000 ? 'warning' : 'passed', // Warn if query takes > 5 seconds
      queryTime,
      recordCount: performanceData?.length || 0,
      error: performanceError?.message
    };

    // Check 5: Recent activity
    console.log('📊 Checking recent activity...');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTasks, error: recentError } = await supabase
      .from('tasks')
      .select('id, created_at, updated_at')
      .gte('updated_at', oneDayAgo);

    results.checks.recent_activity = {
      status: recentError ? 'failed' : 'passed',
      recentTasksCount: recentTasks?.length || 0,
      error: recentError?.message
    };

    // Determine overall health
    const failedChecks = Object.values(results.checks).filter(check => check.status === 'failed').length;
    const warningChecks = Object.values(results.checks).filter(check => check.status === 'warning').length;

    if (failedChecks > 0) {
      results.overall = 'unhealthy';
    } else if (warningChecks > 0) {
      results.overall = 'warning';
    }

    // Output results
    console.log('\n🏥 Health Check Results:');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${results.overall.toUpperCase()}`);
    console.log(`Timestamp: ${results.timestamp}`);
    console.log('='.repeat(50));

    Object.entries(results.checks).forEach(([check, result]) => {
      const status = result.status.toUpperCase();
      const emoji = status === 'PASSED' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${emoji} ${check}: ${status}`);

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      // Additional details
      if (check === 'data_integrity' && result.orphanedTasks) {
        console.log(`   Orphaned tasks: ${result.orphanedTasks}/${result.totalTasks}`);
      } else if (check === 'performance') {
        console.log(`   Query time: ${result.queryTime}ms, Records: ${result.recordCount}`);
      } else if (check === 'recent_activity') {
        console.log(`   Recent tasks: ${result.recentTasksCount}`);
      }
    });

    // Exit with appropriate code
    if (results.overall === 'unhealthy') {
      console.log('\n❌ Database health check FAILED');
      process.exit(1);
    } else if (results.overall === 'warning') {
      console.log('\n⚠️  Database health check PASSED with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Database health check PASSED');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Health check failed with error:', error);
    results.overall = 'error';
    results.error = error.message;

    console.log('\n❌ Database health check FAILED');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('Unexpected error during health check:', error);
  process.exit(1);
});