import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Trophy, Users, Calendar, MapPin, TrendingUp, Share2, Star, Shield, AlertTriangle, Scroll, Loader2, Megaphone, ExternalLink, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MatchPredictionCard } from '../MatchPredictionCard';

interface Championship {
  id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  rules: string;
  logo_url: string | null;
}

interface Match {
  id: string;
  home_team: { name: string; logo_url: string | null };
  away_team: { name: string; logo_url: string | null };
  home_team_id: string;
  away_team_id: string;
  venue: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: string;
  phase: string;
}

interface Standing {
  team: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  position: number;
}

interface PlayerStat {
  player: {
    name: string;
    jersey_number: number;
    position: string;
  };
  team: {
    name: string;
    logo_url: string | null;
  };
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

interface Group {
  id: string;
  name: string;
  standings: Standing[];
}

const AdBanner = ({ position }: { position: 'top' | 'sidebar' }) => (
  <div className={`bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden ${
    position === 'top' ? 'h-32 md:h-40' : 'h-64'
  } animate-fade-in`}>
    <div className="h-full p-6 flex flex-col items-center justify-center text-center">
      <Megaphone className="w-8 h-8 text-green-500 mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">
        Espaço Publicitário
      </h3>
      <p className="text-sm text-gray-400 mb-3">
        Anuncie sua marca para milhares de torcedores
      </p>
      <a
        href="mailto:anuncie@dribbla.com"
        className="inline-flex items-center gap-2 text-sm text-green-500 hover:text-green-400 transition-colors"
      >
        <span>Saiba mais</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  </div>
);

const renderMatchCard = (match: Match) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
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

    <Link to={`/matches/${match.id}`} className="block">
      <div className="p-4">
        {/* Home Team */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/teams/${match.home_team_id}`}
            className="flex items-center gap-3 flex-1 hover:text-green-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {match.home_team.logo_url ? (
              <img
                src={match.home_team.logo_url}
                alt={match.home_team.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Shield className="w-8 h-8 text-gray-600" />
            )}
            <span className="text-white font-medium">{match.home_team.name}</span>
          </Link>
          <span className="text-xl font-bold text-white tabular-nums w-8 text-right">
            {match.home_score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <Link
            to={`/teams/${match.away_team_id}`}
            className="flex items-center gap-3 flex-1 hover:text-green-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {match.away_team.logo_url ? (
              <img
                src={match.away_team.logo_url}
                alt={match.away_team.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <Shield className="w-8 h-8 text-gray-600" />
            )}
            <span className="text-white font-medium">{match.away_team.name}</span>
          </Link>
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

    {/* Prediction Odds */}
    {match.status !== 'Encerrado' && (
      <MatchPredictionCard
        matchId={match.id}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        status={match.status}
        className="border-t border-gray-700/50"
      />
    )}
  </div>
);

export function PublicChampionship() {
  const { championshipId } = useParams();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'standings' | 'stats'>('overview');
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [expandedRules, setExpandedRules] = useState(false);

  useEffect(() => {
    const fetchChampionshipData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch championship details
        const { data: championshipData, error: championshipError } = await supabase
          .from('championships')
          .select('*')
          .eq('id', championshipId)
          .single();

        if (championshipError) throw championshipError;
        if (!championshipData) throw new Error('Championship not found');

        setChampionship(championshipData);

        // Fetch matches with team IDs
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            home_team_id,
            away_team_id,
            home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
            away_team:teams!matches_away_team_id_fkey(id, name, logo_url),
            venue,
            match_date,
            home_score,
            away_score,
            status,
            phase
          `)
          .eq('championship_id', championshipId)
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        setMatches(matchesData);

        // Fetch standings
        const { data: standingsData, error: standingsError } = await supabase
          .from('championship_standings')
          .select(`
            team:teams(id, name, logo_url),
            points,
            matches_played,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            goal_difference,
            position
          `)
          .eq('championship_id', championshipId)
          .order('points', { ascending: false });

        if (standingsError) throw standingsError;
        setStandings(standingsData);

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('tournament_groups')
          .select(`
            id,
            name,
            standings:group_teams(
              team:teams(id, name, logo_url),
              points,
              matches_played,
              wins,
              draws,
              losses,
              goals_for,
              goals_against,
              goal_difference,
              position
            )
          `)
          .eq('championship_id', championshipId);

        if (groupsError) throw groupsError;
        setGroups(groupsData);

        // Fetch top scorers
        const { data: scorersData, error: scorersError } = await supabase
          .from('player_stats')
          .select(`
            player:players(name, jersey_number, position),
            team:teams(name, logo_url),
            goals,
            assists,
            yellow_cards,
            red_cards
          `)
          .eq('championship_id', championshipId)
          .order('goals', { ascending: false })
          .limit(5);

        if (scorersError) throw scorersError;
        setTopScorers(scorersData);

        // Fetch top assists
        const { data: assistsData, error: assistsError } = await supabase
          .from('player_stats')
          .select(`
            player:players(name, jersey_number, position),
            team:teams(name, logo_url),
            goals,
            assists,
            yellow_cards,
            red_cards
          `)
          .eq('championship_id', championshipId)
          .order('assists', { ascending: false })
          .limit(5);

        if (assistsError) throw assistsError;
        setTopAssists(assistsData);

      } catch (err) {
        console.error('Error fetching championship data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChampionshipData();
  }, [championshipId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-semibold text-white text-center">
          {error || 'Championship not found'}
        </h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const recentMatches = matches
    .filter(match => isSameDay(new Date(match.match_date), new Date()) || 
                    new Date(match.match_date) < new Date())
    .slice(0, 3);

  const upcomingMatches = matches
    .filter(match => new Date(match.match_date) > new Date())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Championship Header */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            {/* Championship Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700/50">
              {championship.logo_url ? (
                <img
                  src={championship.logo_url}
                  alt={championship.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-gray-600" />
              )}
            </div>

            {/* Championship Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {championship.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{championship.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {format(new Date(championship.start_date), "dd 'de' MMMM", { locale: ptBR })} - {format(new Date(championship.end_date), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Show notification (implement this based on your notification system)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-8 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'overview'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'matches'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'standings'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'stats'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Stats
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Ad Banner */}
            <AdBanner position="top" />

            {activeTab === 'overview' && (
              <>
                {/* Recent Matches */}
                {recentMatches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Recent Matches</h2>
                      <Link
                        to={`/championships/${championshipId}/matches`}
                        className="text-sm text-green-500 hover:text-green-400 transition-colors inline-flex items-center gap-1"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="grid gap-4">
                      {recentMatches.map(match => renderMatchCard(match))}
                    </div>
                  </div>
                )}

                {/* Upcoming Matches */}
                {upcomingMatches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
                      <Link
                        to={`/championships/${championshipId}/matches`}
                        className="text-sm text-green-500 hover:text-green-400 transition-colors inline-flex items-center gap-1"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="grid gap-4">
                      {upcomingMatches.map(match => renderMatchCard(match))}
                    </div>
                  </div>
                )}

                {/* Championship Rules */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Scroll className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-semibold text-white">Regulamento</h2>
                  </div>
                  <div className="prose max-w-none">
                    <div className={`text-gray-300 whitespace-pre-wrap ${!expandedRules && 'line-clamp-6'}`}>
                      {championship.rules}
                    </div>
                    <button
                      onClick={() => setExpandedRules(!expandedRules)}
                      className="mt-4 flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
                    >
                      {expandedRules ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span>Mostrar menos</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Ler mais</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-4">
                {matches.map(match => renderMatchCard(match))}
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="space-y-8">
                {groups.length > 0 ? (
                  // Group Stage Standings
                  groups.map(group => (
                    <div key={group.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                      <div className="p-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-700/50">
                              <th className="p-4 text-sm font-medium text-gray-400">Pos</th>
                              <th className="p-4 text-sm font-medium text-gray-400">Team</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">P</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">W</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">D</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">L</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">GF</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">GA</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">GD</th>
                              <th className="p-4 text-sm font-medium text-gray-400 text-center">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.standings
                              .sort((a, b) => b.points - a.points)
                              .map((standing, index) => (
                                <tr
                                  key={standing.team.id}
                                  className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/20"
                                >
                                  <td className="p-4 text-gray-300">{index + 1}</td>
                                  <td className="p-4">
                                    <Link
                                      to={`/teams/${standing.team.id}`}
                                      className="flex items-center gap-3 hover:text-green-400 transition-colors"
                                    >
                                      {standing.team.logo_url ? (
                                        <img
                                          src={standing.team.logo_url}
                                          alt={standing.team.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                      ) : (
                                        <Shield className="w-6 h-6 text-gray-600" />
                                      )}
                                      <span className="font-medium text-white">
                                        {standing.team.name}
                                      </span>
                                    </Link>
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.matches_played}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.wins}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.draws}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.losses}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.goals_for}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.goals_against}
                                  </td>
                                  <td className="p-4 text-center text-gray-300">
                                    {standing.goal_difference}
                                  </td>
                                  <td className="p-4 text-center font-semibold text-white">
                                    {standing.points}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  // Regular Standings
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-700/50">
                            <th className="p-4 text-sm font-medium text-gray-400">Pos</th>
                            <th className="p-4 text-sm font-medium text-gray-400">Team</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">P</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">W</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">D</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">L</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">GF</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">GA</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">GD</th>
                            <th className="p-4 text-sm font-medium text-gray-400 text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((standing, index) => (
                            <tr
                              key={standing.team.id}
                              className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/20"
                            >
                              <td className="p-4 text-gray-300">{index + 1}</td>
                              <td className="p-4">
                                <Link
                                  to={`/teams/${standing.team.id}`}
                                  className="flex items-center gap-3 hover:text-green-400 transition-colors"
                                >
                                  {standing.team.logo_url ? (
                                    <img
                                      src={standing.team.logo_url}
                                      alt={standing.team.name}
                                      className="w-6 h-6 object-contain"
                                    />
                                  ) : (
                                    <Shield className="w-6 h-6 text-gray-600" />
                                  )}
                                  <span className="font-medium text-white">
                                    {standing.team.name}
                                  </span>
                                </Link>
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.matches_played}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.wins}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.draws}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.losses}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.goals_for}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.goals_against}
                              </td>
                              <td className="p-4 text-center text-gray-300">
                                {standing.goal_difference}
                              </td>
                              <td className="p-4 text-center font-semibold text-white">
                                {standing.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Top Scorers */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                  <div className="p-4 border-b border-gray-700/50">
                    
                    <h3 className="text-lg font-semibold text-white">Top Scorers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="p-4 text-sm font-medium text-gray-400">Player</th>
                          <th className="p-4 text-sm font-medium text-gray-400">Team</th>
                          <th className="p-4 text-sm font-medium text-gray-400 text-center">Goals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topScorers.map((scorer) => (
                          <tr
                            key={scorer.player.name}
                            className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/20"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-white">
                                    {scorer.player.name}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {scorer.player.position}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {scorer.team.logo_url ? (
                                  <img
                                    src={scorer.team.logo_url}
                                    alt={scorer.team.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <Shield className="w-6 h-6 text-gray-600" />
                                )}
                                <span className="text-gray-300">{scorer.team.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-semibold text-white">
                              {scorer.goals}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Assists */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                  <div className="p-4 border-b border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white">Top Assists</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="p-4 text-sm font-medium text-gray-400">Player</th>
                          <th className="p-4 text-sm font-medium text-gray-400">Team</th>
                          <th className="p-4 text-sm font-medium text-gray-400 text-center">
                            Assists
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topAssists.map((player) => (
                          <tr
                            key={player.player.name}
                            className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/20"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-white">
                                    {player.player.name}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {player.player.position}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {player.team.logo_url ? (
                                  <img
                                    src={player.team.logo_url}
                                    alt={player.team.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <Shield className="w-6 h-6 text-gray-600" />
                                )}
                                <span className="text-gray-300">{player.team.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-semibold text-white">
                              {player.assists}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Sidebar Ad Banner */}
            <AdBanner position="sidebar" />

            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
              <div className="p-4 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Matches</span>
                  <span className="text-white font-medium">{matches.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Teams</span>
                  <span className="text-white font-medium">{standings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Goals Scored</span>
                  <span className="text-white font-medium">
                    {matches.reduce(
                      (total, match) => total + match.home_score + match.away_score,
                      0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Scorer Widget */}
            {topScorers.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                <div className="p-4 border-b border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white">Top Scorer</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {topScorers[0].player.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{topScorers[0].team.name}</span>
                        <span>•</span>
                        <span>{topScorers[0].goals} goals</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Form */}
            {standings.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
                <div className="p-4 border-b border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white">Recent Form</h3>
                </div>
                <div className="p-4 space-y-4">
                  {standings.slice(0, 5).map((standing) => (
                    <div key={standing.team.id} className="flex items-center gap-3">
                      <div className="w-8 h-8">
                        {standing.team.logo_url ? (
                          <img
                            src={standing.team.logo_url}
                            alt={standing.team.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Shield className="w-full h-full text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {standing.team.name}
                          </span>
                          <span className="text-sm text-gray-400">
                            {standing.points} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-1 rounded-full bg-green-500" />
                          <div className="w-4 h-1 rounded-full bg-green-500" />
                          <div className="w-4 h-1 rounded-full bg-gray-600" />
                          <div className="w-4 h-1 rounded-full bg-red-500" />
                          <div className="w-4 h-1 rounded-full bg-green-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}