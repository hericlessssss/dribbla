import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Trophy, LogOut, User, Menu, Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

export function DashboardLayout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-gray-800 border-b border-gray-700 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Dribbla</h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 border-b border-gray-700">
          <div className="p-4 space-y-4">
            <NavLink
              to="/dashboard/championships"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                )
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <Trophy className="w-5 h-5" />
              Campeonatos
            </NavLink>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              Ver Site
            </a>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-white">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-400">
                    {user?.role === 'organizer' ? 'Organizador' : 'Torcedor'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 w-full"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-16 bg-gray-800 py-6 gap-6">
        <NavLink
          to="/dashboard/championships"
          className={({ isActive }) =>
            clsx(
              'p-2 rounded-lg transition-colors mx-auto',
              isActive
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            )
          }
          title="Campeonatos"
        >
          <Trophy className="w-6 h-6" />
        </NavLink>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mx-auto"
          title="Ver Site"
        >
          <Home className="w-6 h-6" />
        </a>

        <button
          onClick={handleSignOut}
          className="mt-auto p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors mx-auto"
          title="Sair"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-gray-800 items-center justify-between px-6 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">Dribbla</h1>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-white">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400">
                {user?.role === 'organizer' ? 'Organizador' : 'Torcedor'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}