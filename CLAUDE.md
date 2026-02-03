# CLAUDE.md - AI Assistant Guide for TaskOrgApp

## Project Overview

TaskOrgApp is a real-time shared task organizer using the Eisenhower Matrix. It's a PWA (Progressive Web App) built for small teams (up to 3 members) to manage and prioritize tasks together.

**Key Features:**
- Eisenhower Matrix: 4-quadrant priority visualization (Do First, Schedule, Delegate, Eliminate)
- Daily Planner: AI-powered task scheduling using OpenAI
- Gamification: Points, streaks, combos, badges, and leaderboards
- Real-time Sync: Instant updates via Supabase Realtime
- Push Notifications: Web push for task reminders
- PWA Support: Installable on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| State Management | Zustand |
| Testing | Vitest, React Testing Library |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core |
| Deployment | Vercel |

## Project Structure

```
TaskOrgApp/
├── src/
│   ├── components/       # Reusable UI components (Layout, Modal, Toast, etc.)
│   ├── features/         # Feature modules organized by domain
│   │   ├── auth/         # Login, Signup, ProtectedRoute
│   │   ├── tasks/        # Dashboard, TaskMatrix, DailyPlanner, TaskCard, TaskForm
│   │   ├── organization/ # Settings, user management
│   │   ├── gamification/ # Leaderboard, badges, streaks, challenges
│   │   ├── notifications/# NotificationSettings
│   │   ├── onboarding/   # OnboardingFlow, Celebration
│   │   └── pwa/          # InstallPWA
│   ├── hooks/            # Custom React hooks (usePWAInstall, useNotifications)
│   ├── lib/              # Utilities and Supabase client
│   │   ├── supabase.js   # Supabase client initialization
│   │   ├── utils.js      # Utility functions
│   │   └── constants.js  # App constants (effort sizes, urgency levels, etc.)
│   ├── store/            # Zustand stores
│   │   ├── authStore.js  # Authentication state
│   │   ├── taskStore.js  # Tasks and task operations
│   │   ├── organizationStore.js # Organization/team state
│   │   └── notificationStore.js # Notification state
│   ├── test/             # Test setup
│   ├── App.jsx           # Main app with routing
│   └── main.jsx          # Entry point
├── api/                  # Vercel serverless functions
│   ├── plan-day.js       # AI day planning (OpenAI gpt-4o-mini)
│   ├── plan-day-advanced.js
│   └── autofill.js       # AI task autofill
├── supabase/
│   └── functions/        # Supabase Edge Functions
│       ├── daily-summary/
│       └── send-notifications/
├── public/               # Static assets and PWA icons
├── scripts/              # Build and migration scripts
├── schema.sql            # Main database schema
├── schema-notifications.sql # Notifications schema extension
├── schema-gamification.sql  # Gamification schema extension
└── docs/                 # Documentation
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required - Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - Push notifications (VAPID keys)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here

# Server-side only (Vercel/Supabase secrets)
OPENAI_API_KEY=your-openai-key       # For AI planning features
VAPID_PRIVATE_KEY=your-private-key   # For push notifications
```

**Important:** Never commit `.env` files or credentials to the repository.

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Team/organization data (max 3 members) |
| `profiles` | User profiles linked to Supabase Auth |
| `tasks` | Task data with urgency/importance (1-5 scale) |
| `scores` | Daily points for gamification |

### Task Properties

- `status`: 'todo' | 'in_progress' | 'done'
- `effort`: 'xs' | 's' | 'm' | 'l' | 'xl' (time estimates)
- `urgent`: 1-5 (1=Whenever, 5=ASAP)
- `important`: 1-5 (1=Optional, 5=Critical)
- Quadrant determined by: urgent >= 3 AND important >= 3 = Q1, etc.

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access data within their organization via the `get_my_organization_id()` helper function.

## Code Conventions

### React Components

- Use functional components with hooks
- Feature-based organization under `src/features/`
- Props are not validated with PropTypes (`'react/prop-types': 'off'`)
- No need for `import React` (`'react/react-in-jsx-scope': 'off'`)

### State Management (Zustand)

```javascript
// Store pattern example
export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,

  // Actions
  fetchTasks: async () => { /* ... */ },

  // Selectors (computed values)
  getTasksByQuadrant: (quadrant) => { /* ... */ },
}));
```

### Styling (TailwindCSS)

Custom theme colors defined in `tailwind.config.js`:

```javascript
// Dark theme colors
dark: { main, card, hover, border }
text: { primary, secondary, muted }
accent: { blue, pink, purple }
quadrant: { do, schedule, delegate, eliminate }
```

### Testing

- Test files: `*.test.js` or `*.test.jsx` alongside source files
- Mock Supabase in tests to avoid API calls
- Use `vi.mock()` for module mocking
- Access Zustand store state: `useStore.getState()`
- Set store state in tests: `useStore.setState({ ... })`

Example test pattern:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from './taskStore';

vi.mock('../lib/supabase', () => ({ /* mock */ }));

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [...] });
  });

  it('should filter tasks correctly', () => {
    const tasks = useTaskStore.getState().getTasksByQuadrant(1);
    expect(tasks).toHaveLength(1);
  });
});
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. Runs on push/PR to `main`
2. Uses Node.js 20
3. Runs `npm run test:coverage`
4. Runs `npm run build`

## Key Patterns

### Eisenhower Matrix Quadrants

```
                    URGENT
           High (>=3)    Low (<3)
         ┌─────────────┬─────────────┐
  High   │ Q1: Do      │ Q2: Schedule│
IMPORTANT│ First       │             │
  (>=3)  ├─────────────┼─────────────┤
  Low    │ Q3: Delegate│ Q4: Eliminate│
  (<3)   │             │             │
         └─────────────┴─────────────┘
```

### Effort Sizes

| Code | Label | Time Estimate |
|------|-------|---------------|
| xs | Extra Small | 5-10 minutes |
| s | Small | 10-30 minutes |
| m | Medium | 30-60 minutes |
| l | Large | 1-2 hours |
| xl | Extra Large | 2+ hours |

### Supabase Client Check

Always check if Supabase is configured before making API calls:
```javascript
import { supabase, isSupabaseConfigured } from '../lib/supabase';

if (!isSupabaseConfigured || !supabase) {
  // Handle missing configuration
  return;
}
```

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main routing and app structure |
| `src/store/authStore.js` | Authentication logic |
| `src/store/taskStore.js` | Task CRUD and filtering |
| `src/lib/supabase.js` | Supabase client setup |
| `src/lib/constants.js` | App-wide constants |
| `schema.sql` | Database schema (run in Supabase SQL Editor) |
| `vite.config.js` | Vite + PWA + test configuration |
| `tailwind.config.js` | Custom theme colors |
| `api/plan-day.js` | AI planning serverless function |

## Common Tasks for AI Assistants

### Adding a New Feature

1. Create feature folder under `src/features/`
2. Add components, hooks, and tests
3. Update routing in `App.jsx` if needed
4. Add to Layout navigation if it's a main section
5. Run `npm run test:run` to verify tests pass
6. Run `npm run lint` to check code style

### Modifying Database Schema

1. Update `schema.sql` (or create extension like `schema-*.sql`)
2. Document changes with comments
3. Consider RLS policies for new tables
4. Add migration notes at the bottom of schema file

### Adding Tests

1. Create `*.test.jsx` file next to the component
2. Mock Supabase to avoid real API calls
3. Use React Testing Library for component tests
4. Use Zustand's `setState` to set up test data

### Working with Tasks

- Task filtering logic is in `taskStore.js`
- Quadrant assignment: `getTasksByQuadrant(quadrant)`
- Today's tasks: `getTodaysTasks()` (urgent >= 3 OR due today)
- Task completion updates scores for gamification

## Notes

- The app uses a dark theme by default
- Maximum 3 members per organization (enforced by database trigger)
- Real-time subscriptions are set up for tasks, profiles, and scores
- PWA service worker handles offline caching and push notifications
