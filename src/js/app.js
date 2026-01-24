/**
 * Main application entry point.
 * Initializes the TaskOrgApp.
 */

// Import configuration
import './config.js';

// Import API modules
import './api/supabase.js';
import './api/tasks.js';
import './api/auth.js';
import './api/scores.js';

// Import components
import './components/taskMatrix.js';
import './components/taskForm.js';
import './components/chatPanel.js';
import './components/leaderboard.js';
import './components/dailyPlanner.js';

// Import utilities
import './utils/dateHelpers.js';
import './utils/validation.js';
import './utils/eventBus.js';

// Import state management
import './state/store.js';

// TODO: Initialize app when index.html is fully migrated
// For now, this is a placeholder structure
console.log('TaskOrgApp modules loaded (structure ready for migration)');
