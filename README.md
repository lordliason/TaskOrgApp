# Task Matrix

A real-time shared task organizer for couples using the Eisenhower Matrix, powered by AI-assisted task decomposition.

## Features

- **Eisenhower Matrix** - Visualize tasks on a 2D priority grid (Urgency × Importance)
- **Real-time sync** - Changes sync instantly across all devices via Supabase
- **AI-powered assistant** - Natural language task management with OpenAI
- **Intelligent task decomposition** - Break down large tasks into manageable subtasks with dependencies
- **Multi-user support** - Organization-based authentication system
- **Gamification** - Score tracking for completed tasks

## Quick Setup Guide

### Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `setup.sql` into the editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this means the tables were created!

### Step 2: Enable Realtime (Important!)

1. In Supabase, go to **Database** → **Replication**
2. Find the `tasks`, `scores`, `organizations`, and `users` tables
3. Make sure the toggle is **ON** for realtime on each table

### Step 3: Set Up OpenAI API Key (Required for AI Chat Features)

**For Vercel Deployment:**

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
   - **Environment**: `Production`, `Preview`, `Development`

**For Local Development:**

1. Edit `config.js` and temporarily add your API key (remove before committing):

   ```javascript
   const OPENAI_API_KEY = 'your-api-key-here';
   ```

2. **⚠️ SECURITY WARNING**: Never commit API keys to version control!

### Step 4: Deploy to Vercel

**Option A: One-Click Deploy (Easiest)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/TaskOrgApp)

**Option B: Manual Deploy**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New Project**
3. Import your GitHub repo (or drag & drop the folder)
4. **Important**: Add the `OPENAI_API_KEY` environment variable in Vercel before deploying
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

## Using the App

1. **Login**: Enter your username and password (default users: `mario` or `maria`)
2. **Add tasks**: Enter name, select assignee, size, and urgency/importance (on a scale of 1-5)
3. **View matrix**: Tasks appear as colored dots positioned according to their priority
4. **Real-time sync**: Changes sync instantly between devices!

## Database Schema

### Tasks Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Task name/title |
| `assignee` | TEXT | `mario`, `maria`, or `both` |
| `size` | TEXT | `xs`, `s`, `m`, `l`, or `xl` |
| `urgent` | INTEGER | 1-5 scale |
| `important` | INTEGER | 1-5 scale |
| `completed` | BOOLEAN | Completion status |
| `completed_by` | TEXT | Who completed the task |
| `icon` | TEXT | Emoji icon for the task |
| `first_step` | TEXT | First action to start the task |
| `completion_criteria` | TEXT | What "done" looks like |
| `deadline` | DATE | Due date |
| `depends_on` | UUID[] | Array of task IDs this depends on |
| `parent_task_id` | UUID | Parent task (for subtasks) |
| `organization_id` | UUID | Organization this task belongs to |

### Organizations & Users

The app supports multiple organizations, each with their own users and tasks:

- **Organizations** - Groups that share tasks (e.g., "Mario Maria Organization")
- **Users** - Members of an organization with their own credentials

### Scores Table

Tracks completed tasks for gamification:

| Field | Type | Description |
|-------|------|-------------|
| `player` | TEXT | `mario` or `maria` |
| `date` | DATE | Score date |
| `points` | INTEGER | Points earned |
| `tasks_completed` | INTEGER | Number of tasks completed |

## AI-Powered Task Management

The app includes AI-powered task management features using OpenAI function calling.

### Basic Functions

The AI can perform these actions for you:

- **Create Tasks**: "Create a task to organize the garage assigned to Mario"
- **Split Tasks**: "Split the 'Write report' task into research and writing parts"
- **Update Tasks**: "Mark the kitchen cleanup task as completed"
- **Query Tasks**: "Show me all urgent tasks assigned to Maria"

### Intelligent Task Decomposition

For large, complex tasks, the AI can intelligently decompose them:

- **Decompose Tasks**: "Break down 'Plan birthday party' into subtasks"
- **Iterative Refinement**: The AI asks clarifying questions to improve the breakdown
- **Dependency Tracking**: Subtasks can depend on each other
- **Deadline Calculation**: Subtasks get deadlines based on the parent task
- **Workload Balancing**: Distributes tasks between assignees
- **Integration Suggestions**: Recommends calendar events, shopping lists, etc.

#### Decomposition Workflow

1. **Initial decomposition** - AI generates subtasks with priorities and dependencies
2. **Review & questions** - AI identifies gaps and asks clarifying questions (deadline, budget, etc.)
3. **Refinement** - Based on your answers, the AI refines the breakdown
4. **Finalization** - Once confident, the AI finalizes and returns the complete plan

Example conversation:

```
You: "Break down planning our vacation to Italy"

AI: I've created an initial breakdown with 5 subtasks. A few questions:
    1. What's the overall deadline for booking?
    2. What's your budget for this trip?

You: "End of February, budget is $5000"

AI: Perfect! I've refined the plan. Here's your finalized breakdown:
    - Research destinations (Maria, due Feb 1)
    - Book flights (Mario, due Feb 10, depends on research)
    - Book hotels (Maria, due Feb 15, depends on flights)
    ...
```

### API Integration

To enable function calling in your chat API calls:

```javascript
const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "Break down planning our vacation",
        taskContext: "Current tasks: ...",
        enableFunctions: true,
        conversationHistory: [...], // Previous messages for context
        pendingDecomposition: null, // Previous decomposition if refining
        organizationId: "uuid"      // Organization context
    })
});
```

When functions are called, the API returns:

- `function_call`: The AI's function call request
- `function_result`: The executed function result
- `original_response`: The full OpenAI response

### Available Functions

| Function | Description |
|----------|-------------|
| `createTask` | Creates new tasks with validation |
| `splitTask` | Splits a task into two parts |
| `updateTask` | Modifies existing task properties |
| `getTasks` | Queries tasks with filters |
| `decomposeTask` | Breaks a large task into subtasks with dependencies |
| `refineDecomposition` | Refines a decomposition based on user answers |
| `finalizeDecomposition` | Finalizes and prepares tasks for database insertion |

### Testing Function Calling

Run the test script to verify AI function calling works:

```bash
node test-openai.js
```

This will test both basic connectivity and the task management function calling features.

## Color Legend

- 🔵 **Blue** - Mario
- 🩷 **Pink** - Maria
- 🟣 **Purple** - Both

## Eisenhower Matrix Quadrants

The app uses a 1-5 scale for Urgency and Importance, positioning tasks continuously on the matrix.

| Quadrant | Urgency | Importance | Action |
|----------|---------|------------|--------|
| Do First | High (4-5) | High (4-5) | Handle immediately |
| Schedule | Low (1-2) | High (4-5) | Plan time for it |
| Delegate | High (4-5) | Low (1-2) | Consider delegating |
| Eliminate | Low (1-2) | Low (1-2) | Consider dropping |

## Testing

The project includes comprehensive unit tests to ensure code quality and catch regressions.

### Running Tests

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Run all tests**:

   ```bash
   npm test
   ```

3. **Run tests in watch mode** (for development):

   ```bash
   npm run test:watch
   ```

4. **Generate coverage report**:

   ```bash
   npm run test:coverage
   ```

### Test Structure

Tests are located in the `__tests__/` directory:

- `task-management.test.js` - Tests for task CRUD operations
- `decomposition.test.js` - Tests for task decomposition features
- `helpers.test.js` - Tests for utility functions

See `__tests__/README.md` for more details on writing and running tests.

## Project Structure

```
TaskOrgApp/
├── index.html          # Main frontend (single-page app)
├── config.js           # Configuration (API keys for local dev)
├── api/
│   └── chat.js         # Vercel serverless function for OpenAI
├── setup.sql           # Database schema and migrations
├── __tests__/          # Unit tests
├── vercel.json         # Vercel deployment config
└── package.json        # Dependencies and scripts
```

## Troubleshooting

**Chatbot keeps loading forever after clicking Enter?**

- **Most common cause**: Missing OpenAI API key in Vercel environment variables
- **Solution**: Add `OPENAI_API_KEY` environment variable in Vercel dashboard (see Step 3 above)
- **Alternative**: For local testing, temporarily add your API key to `config.js` (remove before committing)

**Tasks not syncing?**

- Check that Realtime is enabled for the `tasks` table in Supabase
- Refresh the page and check the connection status indicator

**Can't add tasks?**

- Make sure you ran the `setup.sql` script in Supabase
- Check browser console for errors (F12 → Console)

**API key errors in chat?**

- OpenAI API key not configured properly
- Check that the key is valid and has credits remaining
- For production: Ensure `OPENAI_API_KEY` is set in Vercel environment variables
- For local development: Check that `config.js` contains a valid key (never commit this!)

**Login issues?**

- Default users are `mario` and `maria` in the "Mario Maria Organization"
- Check that the `users` and `organizations` tables were created in Supabase
- Clear localStorage and try again

**Tests failing?**

- Make sure all dependencies are installed: `npm install`
- Check that you're using Node.js version 14 or higher
- Run `npm test` to see detailed error messages
