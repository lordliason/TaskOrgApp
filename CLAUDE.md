# CLAUDE.md

This file provides guidance for AI assistants working with the TaskOrgApp codebase.

## Project Overview

**TaskOrgApp** is a real-time collaborative task management application using the Eisenhower Matrix prioritization system. It's designed for small teams (2-3 members) and includes gamification features like streaks, badges, and team challenges.

**Key Capabilities:**
- Eisenhower Matrix task organization (4 quadrants based on urgency/importance)
- Real-time sync across devices via Supabase
- Gamification with points, streaks, badges, and weekly challenges
- PWA with offline support and push notifications
- AI-powered task autofill and day planning

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 7 |
| Styling | TailwindCSS 3.4 |
| State | Zustand 5 |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Build | Vite 6 |
| Testing | Vitest, React Testing Library |
| PWA | vite-plugin-pwa, Workbox |
| Drag & Drop | @dnd-kit |
| Icons | lucide-react |
| AI | OpenAI API (via serverless functions) |

## Codebase Structure

```
src/
├── components/          # Shared UI components
│   ├── Layout.jsx       # Main layout with navigation
│   ├── Modal.jsx        # Generic modal wrapper
│   ├── Toast.jsx        # Toast notification system
│   └── ...
├── features/            # Feature modules (domain-organized)
│   ├── auth/            # Login, Signup, ProtectedRoute
│   ├── tasks/           # Dashboard, TaskMatrix, TaskList, TaskCard, TaskForm
│   ├── gamification/    # GamificationHub, Streaks, Badges, Leaderboard
│   ├── organization/    # Settings, team management
│   ├── notifications/   # NotificationSettings
│   ├── onboarding/      # OnboardingFlow, Celebration
│   └── pwa/             # PWA install prompts
├── hooks/               # Custom React hooks
│   ├── useNotifications.js
│   └── usePWAInstall.js
├── store/               # Zustand state stores
│   ├── authStore.js     # User authentication & profile
│   ├── taskStore.js     # Tasks CRUD & realtime sync
│   ├── gamificationStore.js  # Streaks, badges, combos
│   ├── organizationStore.js  # Team members & scores
│   ├── notificationStore.js
│   └── onboardingStore.js
├── lib/                 # Utilities and configuration
│   ├── supabase.js      # Supabase client init
│   ├── constants.js     # App constants (effort sizes, colors, etc.)
│   └── utils.js         # Helper functions
├── test/                # Test setup
│   └── setup.js
├── App.jsx              # Route definitions
├── main.jsx             # React entry point
└── index.css            # Global styles with Tailwind

api/                     # Vercel serverless functions
├── autofill.js          # AI task autofill (OpenAI)
└── plan-day.js          # AI day planning

public/
├── sw-push.js           # Service worker push handler
└── [PWA icons]

schema.sql               # Main database schema
schema-gamification.sql  # Gamification tables
schema-notifications.sql # Notification tables
```

## Development Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build to /dist
npm run preview      # Preview production build
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
```

## Code Conventions

### React Components

- **Functional components** only (no class components)
- Components use `.jsx` extension
- Feature components in `/src/features/{feature-name}/`
- Shared components in `/src/components/`
- No PropTypes validation (prop-types rule disabled)

### State Management (Zustand)

Stores follow this pattern:
```javascript
import { create } from 'zustand';

export const useExampleStore = create((set, get) => ({
  // State
  items: [],
  isLoading: false,
  error: null,

  // Actions
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.fetch();
      set({ items: data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Computed getters use get()
  getFilteredItems: () => get().items.filter(/* ... */),
}));
```

### Supabase Patterns

**Fetching with relations:**
```javascript
const { data, error } = await supabase
  .from('tasks')
  .select('*, assignee:profiles!assignee_id(id, display_name, color)')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false });
```

**Real-time subscriptions:**
```javascript
const subscription = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `organization_id=eq.${orgId}`,
  }, handleChange)
  .subscribe();
```

**Optimistic updates:** Always update local state before server call, then revert on error.

### Styling

- **TailwindCSS** for all styling
- Dark theme by default (configured in `tailwind.config.js`)
- Custom colors defined for quadrants:
  - Quadrant 1 (Do First): Green tones
  - Quadrant 2 (Schedule): Yellow tones
  - Quadrant 3 (Delegate): Orange tones
  - Quadrant 4 (Eliminate): Red tones
- Font: DM Sans (body), DM Serif Display (headings)

### File Naming

- React components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Stores: `camelCaseStore.js`
- Tests: `ComponentName.test.jsx` (co-located with source)
- Constants/utils: `camelCase.js`

### ESLint Configuration

- React hooks rules enforced
- Unused variables with `_` prefix are allowed
- `react-in-jsx-scope` disabled (React 17+ JSX transform)

## Key Domain Concepts

### Eisenhower Matrix Quadrants

Tasks are categorized by urgency (1-5) and importance (1-5):

| Quadrant | Name | Criteria | Color |
|----------|------|----------|-------|
| Q1 | Do First | urgent >= 3 AND important >= 3 | Green |
| Q2 | Schedule | urgent < 3 AND important >= 3 | Yellow |
| Q3 | Delegate | urgent >= 3 AND important < 3 | Orange |
| Q4 | Eliminate | urgent < 3 AND important < 3 | Red |

### Effort Sizes

| Size | Label | Duration | Points |
|------|-------|----------|--------|
| xs | XS | 5-10 min | 5 |
| s | S | 10-30 min | 10 |
| m | M | 30-60 min | 20 |
| l | L | 1-2 hours | 35 |
| xl | XL | 2+ hours | 50 |

### Gamification System

- **Streaks**: Daily completion chains with freeze tokens
- **Badges**: 20+ achievements across categories (streak, matrix, effort, team, special)
- **Combos**: Bonus multiplier when team members complete tasks within 30 minutes
- **Weekly Challenges**: Team-wide goals with reward points

## Testing Guidelines

**Framework:** Vitest + React Testing Library + jsdom

**Test file location:** Co-located with source files as `*.test.jsx`

**Running tests:**
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

**Coverage thresholds:**
- Lines: 17%
- Functions: 25%
- Branches: 65%
- Statements: 17%

**Test patterns:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key  # For push notifications
```

## Database Schema

**Core tables:**
- `organizations` - Team/workspace data
- `profiles` - User profiles (linked to Supabase Auth)
- `tasks` - Task records with urgency/importance/effort
- `scores` - Daily points tracking

**Gamification tables:**
- `user_streaks` - Streak tracking
- `badges` - Badge definitions
- `user_badges` - Earned badges
- `team_challenges` - Weekly challenges
- `combo_events` - Combo history
- `user_stats` - Aggregated stats

**Constraints:**
- Maximum 3 members per organization (trigger-enforced)
- Row-Level Security (RLS) on all tables

## Common Tasks

### Adding a New Feature

1. Create feature directory: `src/features/{feature-name}/`
2. Add components with `.jsx` extension
3. If state needed, create store in `src/store/{feature}Store.js`
4. Add route in `src/App.jsx` if page-level
5. Write tests as `*.test.jsx`

### Adding a New Zustand Store

```javascript
// src/store/newStore.js
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useNewStore = create((set, get) => ({
  // State and actions
}));
```

### Adding a New API Endpoint

Create serverless function in `api/` directory:
```javascript
// api/endpoint-name.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Handle request
}
```

### Database Migrations

1. Add SQL to appropriate schema file (`schema.sql`, `schema-gamification.sql`, etc.)
2. Run in Supabase SQL Editor
3. Run migration script: `node scripts/migrate-db.cjs`

## Important Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Route definitions, auth initialization |
| `src/store/taskStore.js` | Core task CRUD logic |
| `src/store/authStore.js` | Authentication state |
| `src/lib/constants.js` | App-wide constants and configurations |
| `src/lib/supabase.js` | Supabase client setup |
| `vite.config.js` | Build config, PWA settings, test config |
| `tailwind.config.js` | Theme colors, fonts |
| `schema.sql` | Main database schema |

## Security Considerations

- All database tables use Row-Level Security (RLS)
- API keys stored in environment variables only
- VAPID private keys only in server-side/Edge Functions
- Optimistic updates with proper error rollback
- Input validation on task creation/update

## Deployment

**Platform:** Vercel

**Build output:** Static files in `/dist`

**Configuration:** `vercel.json` handles SPA routing and API rewrites

**PWA:** Auto-registered service worker with push notification support
