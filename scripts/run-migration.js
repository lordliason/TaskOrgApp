// Migration script for push notifications tables
// Run with: node scripts/run-migration.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xscocgadvdgsqhfjbnbu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY29jZ2FkdmRnc3FoZmpibmJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA3MzgzMCwiZXhwIjoyMDgxNjQ5ODMwfQ.W1G4jUWq8Cf59yUIhBEUA31YKL4FtJh6Rwl49H9hBbM';

async function runMigration() {
  console.log('Running push notifications migration...\n');

  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'schema-notifications.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements (basic split, handles most cases)
  const statements = sql
    .split(/;[\s]*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!response.ok) {
        // Try alternative: direct query endpoint
        const altResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!altResponse.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      console.log(`✓ [${i + 1}/${statements.length}] ${preview}`);
      successCount++;
    } catch (error) {
      console.log(`✗ [${i + 1}/${statements.length}] ${preview}`);
      console.log(`  Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log(`\nMigration complete: ${successCount} succeeded, ${errorCount} failed`);
}

runMigration().catch(console.error);
