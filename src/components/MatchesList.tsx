import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Calendar, Search, Shield, MapPin, Loader2 } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from './Notification';
import { MatchDraw } from './MatchDraw';
import { MatchDelete } from './MatchDelete';
import { BackButton } from './BackButton';

export function MatchesList() {
  const { championshipId } = useParams();
  const { matches, loading, error, fetchMatches } = useMatchStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (championshipId) {
      fetchMatches(championshipId);
    } else {
      fetchMatches();
    }
  }, [championshipId, fetchMatches]);

  const filteredMatches = matches.filter(match =>
    match.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <BackButton />
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Partidas</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to={championshipId ? `/dashboard/championships/${championshipId}/matches/new` : "/dashboard/matches/new"}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Partida
          </Link>
          <MatchDraw />
          <MatchDelete />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar partidas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMatches.map(match => (
          <Link
            key={match.id}
            to={`/dashboard/matches/${match.id}`}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
          >
            {/* Match Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
              <span className="text-sm text-gray-400">{match.phase}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                match.status === 'Em Andamento' || match.status === 'Segundo Tempo'
                  ? 'bg-green-900/50 text-green-300 animate-pulse'
                  : match.status === 'Encerrado'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-yellow-900/50 text-yellow-300'
              }`}>
                {match.status}
              </span>
            </div>

            <div className="p-4">
              {/* Home Team */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {match.home_team?.logo_url ? (
                    <img
                      src={match.home_team.logo_url}
                      alt={match.home_team.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Shield className="w-8 h-8 text-gray-600" />
                  )}
                  <span className="text-white font-medium">{match.home_team?.name}</span>
                </div>
                <span className="text-xl font-bold text-white tabular-nums w-8 text-right">
                  {match.home_score}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {match.away_team?.logo_url ? (
                    <img
                      src={match.away_team.logo_url}
                      alt={match.away_team.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Shield className="w-8 h-8 text-gray-600" />
                  )}
                  <span className="text-white font-medium">{match.away_team?.name}</span>
                </div>
                <span className="text-xl font-bold text-white tabular-nums w-8 text-right">
                  {match.away_score}
                </span>
              </div>

              {/* Match Info */}
              <div className="flex items-center justify-between text-sm text-gray-400 mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(match.match_date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{match.venue}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhuma partida encontrada</h3>
          <p className="text-gray-400">
            {searchTerm ? 'Tente outros termos de busca' : 'Comece criando sua primeira partida!'}
          </p>
        </div>
      )}
    </div>
  );
}