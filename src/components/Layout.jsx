import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Settings, LogOut, CheckSquare } from 'lucide-react';

function Layout() {
  const { profile, organization, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <CheckSquare className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">
                {organization?.name || 'TaskOrgApp'}
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: profile?.color || '#3B82F6' }}
                >
                  {profile?.displayName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile?.displayName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
