import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Settings, LogOut, Users } from 'lucide-react';
import InstallBanner from './InstallBanner';

function Layout() {
  const { profile, organization, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-main">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        {/* Logo - clickable to go home */}
        <Link to="/" className="logo-gradient text-2xl mr-4 hover:opacity-80 transition-opacity">
          {organization?.name || 'Task Matrix'}
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info and actions */}
        <div className="flex items-center gap-3">
          {/* User display */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: profile?.color || '#4a9eff' }}
            >
              {profile?.displayName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-text-secondary hidden sm:block">
              {profile?.displayName?.split(' ')[0]}
            </span>
          </div>

          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:bg-dark-hover hover:text-text-primary'
              }`
            }
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-text-muted hover:bg-dark-hover hover:text-text-primary transition-all duration-200"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Install Banner - offset for fixed header with safe area */}
      <div className="pt-16" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
        <InstallBanner />
      </div>

      {/* Main content - offset for fixed header with safe area */}
      <main className="min-h-screen" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
