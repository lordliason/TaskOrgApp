# TaskOrgApp

A real-time shared task organizer using the Eisenhower Matrix. Built for small teams (up to 2 members) to manage and prioritize tasks together.

## Features

- **Eisenhower Matrix**: Visualize tasks in a 4-quadrant priority matrix
  - Quadrant 1: Do First (Urgent & Important)
  - Quadrant 2: Schedule (Important, Not Urgent)
  - Quadrant 3: Delegate (Urgent, Not Important)
  - Quadrant 4: Eliminate (Neither Urgent Nor Important)

- **Daily Planner**: Focus on today's tasks with automatic filtering

- **Gamification**: Track points and compete on the leaderboard

- **Real-time Sync**: Changes sync instantly across all devices

- **Organization Management**: 
  - Admin creates organization and invites 1 team member
  - Customizable user colors
  - Role-based access (Admin/Member)

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Zustand
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd TaskOrgApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the contents of `schema.sql`
   - Copy your project URL and anon key from Settings > API

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (no watch mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── features/         # Feature modules
│   ├── auth/        # Login, Signup, Protected routes
│   ├── tasks/       # Task Matrix, Planner, Forms
│   ├── organization/# Settings, User management
│   └── gamification/# Leaderboard
├── hooks/           # Custom React hooks
├── lib/             # Utilities, Supabase client
├── store/           # Zustand stores
└── test/            # Test setup
```

## Database Schema

### Tables

- **organizations**: Team/organization data
- **profiles**: User profiles linked to Supabase Auth
- **tasks**: Task data with urgency/importance ratings
- **scores**: Daily points for gamification

### Key Constraints

- Maximum 2 members per organization
- Tasks belong to an organization
- Scores track daily completion points

## License

MIT
