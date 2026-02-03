import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { isSupabaseConfigured } from './lib/supabase';

// Auth pages
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';

// Protected pages
import Dashboard from './features/tasks/Dashboard';
import Settings from './features/organization/Settings';

// PWA pages
import InstallPWA from './features/pwa/InstallPWA';

// Components
import ProtectedRoute from './features/auth/ProtectedRoute';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';

function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    if (isSupabaseConfigured) {
      initialize();
    }
  }, [initialize]);

  // Show configuration error if Supabase is not set up
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-main">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Configuration Required</h1>
          <p className="text-text-secondary mb-4">
            Supabase environment variables are missing. Please set up your <code className="bg-dark-hover px-1 rounded">.env</code> file.
          </p>
          <div className="bg-dark-hover rounded-xl p-4 text-left text-sm">
            <p className="font-medium text-text-secondary mb-2">Required variables:</p>
            <code className="block text-text-muted">VITE_SUPABASE_URL=your-url</code>
            <code className="block text-text-muted">VITE_SUPABASE_ANON_KEY=your-key</code>
          </div>
          <p className="text-text-muted text-sm mt-4">
            Copy <code className="bg-dark-hover px-1 rounded">.env.example</code> to <code className="bg-dark-hover px-1 rounded">.env</code> and add your Supabase credentials.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/install" element={<InstallPWA />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
