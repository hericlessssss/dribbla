import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Users, ArrowLeft, Plus, User, Calendar, Trophy, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { usePlayerStore } from '../store/playerStore';
import { useMatchStore } from '../store/matchStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from './Notification';

interface Team {
  id: string;
  name: string;
  coach_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  championship: {
    id: string;
    name: string;
    category: string;
  };
}

interface Player {
  id: string;
  name: string;
  position: string;
  birth_date: string;
  jersey_number: number;
  photo_url: string | null;
  stats: {
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    minutes_played: number;
  };
}

interface Match {
  id: string;
  home_team: { name: string; logo_url: string | null };
  away_team: { name: string; logo_url: string | null };
  venue: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: string;
  phase: string;
  home_team_id: string;
  away_team_id: string;
}

interface TeamStats {
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
}

interface MatchResult {
  result: 'V' | 'E' | 'D';
  score: string;
  opponent: string;
  date: string;
  matchId: string;
  venue: string;
}

export function TeamDetails() {
  const { teamId, championshipId } = useParams();
  const navigate = useNavigate();
  const { getTeamById, deleteTeam } = useTeamStore();
  const { players, fetchPlayers } = usePlayerStore();
  const { matches, fetchMatches } = useMatchStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        if (!teamId) {
          navigate('/dashboard/teams');
          return;
        }
        
        setLoading(true);
        const teamData = await getTeamById(teamId);
        if (!teamData) {
          throw new Error('Time não encontrado');
        }
        
        setTeam(teamData);
        await fetchPlayers(teamId);
        await fetchMatches();
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do time');
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [teamId, getTeamById, fetchPlayers, fetchMatches, navigate]);

  const handleBack = () => {
    if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/teams`);
    } else {
      navigate('/dashboard/teams');
    }
  };

  const handleDelete = async () => {
    if (!teamId) return;
    
    setDeleting(true);
    try {
      await deleteTeam(teamId);
      setNotification({
        type: 'success',
        message: 'Time excluído com sucesso!'
      });
      setTimeout(() => {
        handleBack();
      }, 1500);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Erro ao excluir time'
      });
      setShowDeleteConfirmation(false);
    } finally {
      setDeleting(false);
    }
  };

  const processMatches = (): { recentMatches: MatchResult[], upcomingMatches: Match[] } => {
    const now = new Date();
    const teamMatches = matches.filter(match => 
      match.home_team_id === teamId || match.away_team_id === teamId
    );

    // Process recent matches (completed matches)
    const recentMatches = teamMatches
      .filter(match => match.status === 'Encerrado')
      .map(match => {
        const isHomeTeam = match.home_team_id === teamId;
        const ownScore = isHomeTeam ? match.home_score : match.away_score;
        const opponentScore = isHomeTeam ? match.away_score : match.home_score;
        const opponent = isHomeTeam ? match.away_team?.name : match.home_team?.name;

        let result: 'V' | 'E' | 'D';
        if (ownScore > opponentScore) result = 'V';
        else if (ownScore < opponentScore) result = 'D';
        else result = 'E';

        return {
          result,
          score: `${ownScore} x ${opponentScore}`,
          opponent: opponent || 'Time não definido',
          date: match.match_date,
          matchId: match.id,
          venue: match.venue
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Process upcoming matches
    const upcomingMatches = teamMatches
      .filter(match => 
        new Date(match.match_date) > now || 
        ['Em Andamento', 'Intervalo', 'Segundo Tempo'].includes(match.status)
      )
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
      .slice(0, 3);

    return { recentMatches, upcomingMatches };
  };

  const getResultBadgeStyle = (result: 'V' | 'E' | 'D') => {
    switch (result) {
      case 'V':
        return 'bg-green-900/50 text-green-300';
      case 'E':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'D':
        return 'bg-red-900/50 text-red-300';
    }
  };

  const { recentMatches, upcomingMatches } = processMatches();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="flex items-center text-green-500 hover:text-green-400 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="flex items-center text-green-500 hover:text-green-400 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">{error || 'Time não encontrado'}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <button
        onClick={handleBack}
        className="flex items-center text-green-500 hover:text-green-400 mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </button>

      {/* Team Header */}
      <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
        <div 
          className="h-48 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})`
          }}
        >
          {team.logo_url ? (
            <img
              src={team.logo_url}
              alt={team.name}
              className="h-32 w-32 object-contain"
            />
          ) : (
            <Shield className="h-32 w-32 text-white/50" />
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
              <p className="text-gray-400">Técnico: {team.coach_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/dashboard/teams/${teamId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Squad Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Elenco</h2>
          </div>

          <div className="space-y-4">
            {players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {player.name}
                        </span>
                        <span className="text-sm text-gray-400">
                          #{player.jersey_number}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {player.position}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(player.birth_date), "dd/MM/yyyy")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum jogador cadastrado</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Link
              to={championshipId 
                ? `/dashboard/championships/${championshipId}/teams/${teamId}/players/new`
                : `/dashboard/teams/${teamId}/players/new`
              }
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Jogador
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {/* Recent Results */}
          {recentMatches.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-white">Últimos Resultados</h2>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {recentMatches.map((match, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${getResultBadgeStyle(match.result)}`}
                    title={`${match.opponent} - ${match.score}`}
                  >
                    {match.result}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {recentMatches.map((match, index) => (
                  <Link
                    key={index}
                    to={`/dashboard/matches/${match.matchId}`}
                    className="block p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {format(new Date(match.date), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <span className={`px-2 py-1 text-sm rounded-full ${getResultBadgeStyle(match.result)}`}>
                        {match.result}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">{match.opponent}</span>
                      <span className="text-xl font-bold text-white">{match.score}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      {match.venue}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-white">Próximas Partidas</h2>
            </div>

            <div className="space-y-4">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/dashboard/matches/${match.id}`}
                    className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {format(new Date(match.match_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {match.status !== 'Agendado' && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          match.status === 'Em Andamento' || match.status === 'Segundo Tempo'
                            ? 'bg-green-900/50 text-green-300'
                            : match.status === 'Intervalo'
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {match.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">{match.opponent}</span>
                      {match.status !== 'Agendado' && (
                        <span className="text-xl font-bold text-white">{match.score}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      {match.venue}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma partida agendada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Excluir Time</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita e removerá:
            </p>
            
            <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
              <li>Todos os jogadores do time</li>
              <li>Estatísticas e histórico de partidas</li>
              <li>Posição na classificação do campeonato</li>
            </ul>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}