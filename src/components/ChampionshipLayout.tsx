import React from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export function ChampionshipLayout() {
  const { championshipId } = useParams();
  const location = useLocation();

  const tabs = [
    {
      name: 'Visão Geral',
      path: `/dashboard/championships/${championshipId}`,
      icon: Trophy,
      exact: true
    },
    {
      name: 'Times',
      path: `/dashboard/championships/${championshipId}/teams`,
      icon: Users
    },
    {
      name: 'Partidas',
      path: `/dashboard/championships/${championshipId}/matches`,
      icon: Calendar
    },
    {
      name: 'Estatísticas',
      path: `/dashboard/championships/${championshipId}/stats`,
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Championship Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="max-w-7xl mx-auto px-4" aria-label="Tabs">
          <div className="flex space-x-4 md:space-x-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = tab.exact 
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path);

              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={clsx(
                    'flex items-center gap-2 py-4 px-1 border-b-2 font-medium whitespace-nowrap transition-colors',
                    'text-sm md:text-base min-w-fit',
                    isActive
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden md:inline">{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}