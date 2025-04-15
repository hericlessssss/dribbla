import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { DashboardLayout } from './components/DashboardLayout';
import { ChampionshipLayout } from './components/ChampionshipLayout';
import { ChampionshipsList } from './components/ChampionshipsList';
import { ChampionshipForm } from './components/ChampionshipForm';
import { ChampionshipDetails } from './components/ChampionshipDetails';
import { TeamForm } from './components/TeamForm';
import { TeamDetails } from './components/TeamDetails';
import { TeamsList } from './components/TeamsList';
import { PlayerForm } from './components/PlayerForm';
import { PlayerImport } from './components/PlayerImport';
import { MatchesList } from './components/MatchesList';
import { MatchDetails } from './components/MatchDetails';
import { MatchEventForm } from './components/MatchEventForm';
import { MatchForm } from './components/MatchForm';
import { StatsPage } from './components/StatsPage';
import { useAuthStore } from './store/authStore';

// Public Site Components
import { PublicLayout } from './components/public/PublicLayout';
import { PublicHome } from './components/public/PublicHome';
import { PublicChampionship } from './components/public/PublicChampionship';
import { PublicTeam } from './components/public/PublicTeam';
import { PublicPlayer } from './components/public/PublicPlayer';
import { PublicMatch } from './components/public/PublicMatch';
import { PublicAllMatches } from './components/public/PublicAllMatches';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="championships/:championshipId" element={<PublicChampionship />} />
          <Route path="championships/:championshipId/matches" element={<PublicAllMatches />} />
          <Route path="teams/:teamId" element={<PublicTeam />} />
          <Route path="players/:playerId" element={<PublicPlayer />} />
          <Route path="matches/:matchId" element={<PublicMatch />} />
        </Route>

        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="login" />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="register" />} 
        />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="championships" replace />} />
          <Route path="championships" element={<ChampionshipsList />} />
          <Route path="championships/new" element={<ChampionshipForm />} />
          
          {/* Championship Module */}
          <Route path="championships/:championshipId" element={<ChampionshipLayout />}>
            <Route index element={<ChampionshipDetails />} />
            <Route path="edit" element={<ChampionshipForm />} />
            <Route path="teams" element={<TeamsList />} />
            <Route path="teams/new" element={<TeamForm />} />
            <Route path="teams/import" element={<PlayerImport />} />
            <Route path="teams/:teamId" element={<TeamDetails />} />
            <Route path="teams/:teamId/edit" element={<TeamForm />} />
            <Route path="teams/:teamId/players/new" element={<PlayerForm />} />
            <Route path="matches" element={<MatchesList />} />
            <Route path="matches/new" element={<MatchForm />} />
            <Route path="matches/:matchId" element={<MatchDetails />} />
            <Route path="matches/:matchId/edit" element={<MatchForm />} />
            <Route path="matches/:matchId/events/new" element={<MatchEventForm />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>

          {/* Global Routes */}
          <Route path="teams" element={<TeamsList />} />
          <Route path="teams/new" element={<TeamForm />} />
          <Route path="teams/import" element={<PlayerImport />} />
          <Route path="teams/:teamId" element={<TeamDetails />} />
          <Route path="teams/:teamId/edit" element={<TeamForm />} />
          <Route path="teams/:teamId/players/new" element={<PlayerForm />} />
          <Route path="matches" element={<MatchesList />} />
          <Route path="matches/new" element={<MatchForm />} />
          <Route path="matches/:matchId" element={<MatchDetails />} />
          <Route path="matches/:matchId/edit" element={<MatchForm />} />
          <Route path="matches/:matchId/events/new" element={<MatchEventForm />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;