import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield, Users, Calendar, Trophy, TrendingUp, Star, AlertTriangle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function PublicTeam() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches' | 'stats'>('squad');

  useEffect(() => {
    async function fetchTeamData() {
      if (!teamId) {
        setError('ID do time não fornecido');
        setLoading(false);
        return;
      }

      try {
        // Fetch team details with championship info
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            championship:championships(
              id,
              name,
              category
            )
          `)
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;
        if (!teamData) throw new Error('Time não encontrado');

        setTeam(teamData);

        // Fetch players with stats
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            *,
            stats:player_stats(
              goals,
              assists,
              yellow_cards,
              red_cards,
              minutes_played
            )
          `)
          .eq('team_id', teamId)
          .order('jersey_number');

        if (playersError) throw playersError;
        setPlayers(playersData?.map(player => ({
          ...player,
          stats: player.stats[0] || {
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            minutes_played: 0
          }
        })) || []);

        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            venue,
            match_date,
            home_score,
            away_score,
            status,
            phase,
            home_team:teams!matches_home_team_id_fkey(name, logo_url),
            away_team:teams!matches_away_team_id_fkey(name, logo_url)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order('match_date', { ascending: false });

        if (matchesError) throw matchesError;
        setMatches(matchesData || []);

        // Fetch team stats
        const { data: statsData, error: statsError } = await supabase
          .from('championship_standings')
          .select('*')
          .eq('team_id', teamId)
          .single();

        if (statsError && statsError.code !== 'PGRST116') throw statsError;
        if (statsData) setStats(statsData);

      } catch (error) {
        console.error('Error fetching team data:', error);
        setError('Erro ao carregar dados do time');
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-white">{error || 'Time não encontrado'}</h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Team Header */}
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
                <p className="text-gray-400">Técnico: {team.coach_name}</p>
              </div>
              <Link
                to={`/championships/${team.championship.id}`}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                {team.championship.name}
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 border-b border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'squad'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Elenco
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'matches'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Partidas
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'stats'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Estatísticas
              </button>
            </div>

            {/* Content */}
            {activeTab === 'squad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-700/30 rounded-lg p-4 flex items-center gap-4"
                  >
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{player.name}</span>
                        <span className="text-gray-400">#{player.jersey_number}</span>
                      </div>
                      <span className="text-sm text-gray-400">{player.position}</span>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-400">
                          {format(new Date(player.birth_date), "dd/MM/yyyy")}
                        </span>
                        {player.stats.goals > 0 && (
                          <span className="text-green-400">{player.stats.goals} gols</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="block bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {format(new Date(match.match_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        match.status === 'Em Andamento'
                          ? 'bg-green-900/50 text-green-300'
                          : match.status === 'Encerrado'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {match.home_team.logo_url ? (
                          <img
                            src={match.home_team.logo_url}
                            alt={match.home_team.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Shield className="w-8 h-8 text-gray-600" />
                        )}
                        <span className="text-white">{match.home_team.name}</span>
                      </div>
                      <span className="text-xl font-bold text-white px-4">
                        {match.home_score} - {match.away_score}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-white">{match.away_team.name}</span>
                        {match.away_team.logo_url ? (
                          <img
                            src={match.away_team.logo_url}
                            alt={match.away_team.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Shield className="w-8 h-8 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      {match.venue}
                    </div>
                  </Link>
                ))}

                {matches.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Nenhuma partida encontrada</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{stats.matches_played}</div>
                  <div className="text-gray-400">Jogos</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-500">{stats.wins}</div>
                  <div className="text-gray-400">Vitórias</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-500">{stats.draws}</div>
                  <div className="text-gray-400">Empates</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-red-500">{stats.losses}</div>
                  <div className="text-gray-400">Derrotas</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-white">{stats.goals_for}</div>
                  <div className="text-gray-400">Gols Marcados</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-white">{stats.goals_against}</div>
                  <div className="text-gray-400">Gols Sofridos</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}