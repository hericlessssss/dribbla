import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Timer, ArrowLeft, Edit } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MatchTimer } from './MatchTimer';
import { MatchControls } from './MatchControls';
import { MatchEventButton } from './MatchEventButton';
import { MatchEvents } from './MatchEvents';

export function MatchDetails() {
  const { matchId, championshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    matches,
    matchEvents,
    loading,
    error,
    fetchMatches,
    fetchMatchEvents
  } = useMatchStore();

  useEffect(() => {
    if (matchId) {
      fetchMatches();
      fetchMatchEvents(matchId);
    }
  }, [matchId, fetchMatches, fetchMatchEvents]);

  const match = matches.find(m => m.id === matchId);
  const isOrganizer = user?.id === match?.championship?.organizer_id;
  const isMatchActive = ['Em Andamento', 'Segundo Tempo'].includes(match?.status || '');
  const canEdit = isOrganizer && match?.status === 'Agendado';

  const handleBack = () => {
    if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/matches`);
    } else {
      navigate('/dashboard/matches');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || 'Partida não encontrada'}</p>
        <button
          onClick={handleBack}
          className="flex items-center text-green-500 hover:text-green-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="flex items-center text-green-500 hover:text-green-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </button>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <span className="text-sm text-gray-400">{match.phase}</span>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                {match.home_team?.name} vs {match.away_team?.name}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {isMatchActive && <MatchTimer matchId={match.id} status={match.status} />}
              <span className={`px-3 py-1 rounded-full text-sm ${
                isMatchActive
                  ? 'bg-green-900/50 text-green-300'
                  : match.status === 'Encerrado'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-yellow-900/50 text-yellow-300'
              }`}>
                {match.status}
              </span>
              {canEdit && (
                <Link
                  to={`/dashboard/matches/${match.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 items-center mb-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                {match.home_team?.logo_url ? (
                  <img
                    src={match.home_team.logo_url}
                    alt={match.home_team.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-full" />
                )}
              </div>
              <h2 className="text-sm md:text-lg font-medium text-white">{match.home_team?.name}</h2>
            </div>

            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-white mb-4">
                {match.home_score} - {match.away_score}
              </div>
              {isOrganizer && (
                <MatchControls
                  matchId={match.id}
                  status={match.status}
                  isOrganizer={isOrganizer}
                />
              )}
            </div>

            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                {match.away_team?.logo_url ? (
                  <img
                    src={match.away_team.logo_url}
                    alt={match.away_team.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-full" />
                )}
              </div>
              <h2 className="text-sm md:text-lg font-medium text-white">{match.away_team?.name}</h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-400 mb-8 gap-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span>
                {format(new Date(match.match_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            <span>{match.venue}</span>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Eventos da Partida</h3>
              <MatchEventButton
                matchId={match.id}
                isActive={isMatchActive}
                isOrganizer={isOrganizer}
              />
            </div>

            <MatchEvents 
              events={matchEvents} 
              homeTeamId={match.home_team_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}