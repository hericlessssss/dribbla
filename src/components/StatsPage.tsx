import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Medal, Star, Award, TrendingUp, Users, AlertTriangle, Goal, Clock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BackButton } from './BackButton';

interface Standing {
  team: {
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
  group_name?: string;
}

interface PlayerStat {
  player: {
    name: string;
    photo_url: string | null;
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
  minutes_played: number;
  group_name?: string;
}

interface TeamStat {
  team: {
    name: string;
    logo_url: string | null;
  };
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  group_name?: string;
}

interface Group {
  id: string;
  name: string;
  standings: Standing[];
}

export function StatsPage() {
  const { championshipId } = useParams();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerStat[]>([]);
  const [disciplinaryStats, setDisciplinaryStats] = useState<PlayerStat[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<'points' | 'groups' | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, fetch the tournament format
        const { data: formatData, error: formatError } = await supabase
          .from('tournament_formats')
          .select('format_type')
          .eq('championship_id', championshipId)
          .single();

        if (formatError) throw formatError;
        setFormatType(formatData?.format_type as 'points' | 'groups');

        if (formatData?.format_type === 'groups') {
          // Fetch groups and their standings
          const { data: groupsData, error: groupsError } = await supabase
            .from('tournament_groups')
            .select(`
              id,
              name,
              group_teams (
                position,
                points,
                matches_played,
                wins,
                draws,
                losses,
                goals_for,
                goals_against,
                goal_difference,
                team:teams (
                  name,
                  logo_url
                )
              )
            `)
            .eq('championship_id', championshipId)
            .order('name');

          if (groupsError) throw groupsError;

          const processedGroups = groupsData?.map(group => ({
            id: group.id,
            name: group.name,
            standings: group.group_teams
              .map((teamStats: any) => ({
                team: teamStats.team,
                points: teamStats.points,
                matches_played: teamStats.matches_played,
                wins: teamStats.wins,
                draws: teamStats.draws,
                losses: teamStats.losses,
                goals_for: teamStats.goals_for,
                goals_against: teamStats.goals_against,
                goal_difference: teamStats.goal_difference,
                position: teamStats.position,
                group_name: group.name
              }))
              .sort((a: Standing, b: Standing) => b.points - a.points)
          }));

          setGroups(processedGroups || []);
        } else {
          // Fetch regular standings
          const { data: standingsData, error: standingsError } = await supabase
            .from('championship_standings')
            .select(`
              team:teams (
                name,
                logo_url
              ),
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
            .order('position', { ascending: true });

          if (standingsError) throw standingsError;
          setStandings(standingsData || []);
        }

        // Fetch top scorers
        const { data: scorersData, error: scorersError } = await supabase
          .from('player_stats')
          .select(`
            player:players (
              name,
              photo_url,
              jersey_number,
              position
            ),
            team:teams (
              name,
              logo_url
            ),
            goals,
            assists,
            yellow_cards,
            red_cards,
            minutes_played
          `)
          .eq('championship_id', championshipId)
          .order('goals', { ascending: false })
          .limit(10);

        if (scorersError) throw scorersError;
        setTopScorers(scorersData || []);

        // Fetch top assists
        const { data: assistsData, error: assistsError } = await supabase
          .from('player_stats')
          .select(`
            player:players (
              name,
              photo_url,
              jersey_number,
              position
            ),
            team:teams (
              name,
              logo_url
            ),
            goals,
            assists,
            yellow_cards,
            red_cards,
            minutes_played
          `)
          .eq('championship_id', championshipId)
          .order('assists', { ascending: false })
          .limit(10);

        if (assistsError) throw assistsError;
        setTopAssists(assistsData || []);

        // Fetch disciplinary stats
        const { data: disciplinaryData, error: disciplinaryError } = await supabase
          .from('player_stats')
          .select(`
            player:players (
              name,
              photo_url,
              jersey_number,
              position
            ),
            team:teams (
              name,
              logo_url
            ),
            goals,
            assists,
            yellow_cards,
            red_cards,
            minutes_played
          `)
          .eq('championship_id', championshipId)
          .or(`yellow_cards.gt.0,red_cards.gt.0`)
          .order('red_cards', { ascending: false })
          .order('yellow_cards', { ascending: false })
          .limit(10);

        if (disciplinaryError) throw disciplinaryError;
        setDisciplinaryStats(disciplinaryData || []);

        // Fetch team stats
        const { data: teamStatsData, error: teamStatsError } = await supabase
          .from('championship_standings')
          .select(`
            team:teams (
              name,
              logo_url
            ),
            goals_for,
            goals_against
          `)
          .eq('championship_id', championshipId)
          .order('goals_for', { ascending: false });

        if (teamStatsError) throw teamStatsError;
        setTeamStats(teamStatsData || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    if (championshipId) {
      fetchStats();
    }
  }, [championshipId]);

const renderStandingsTable = (standings: Standing[], groupName?: string) => (
  <div className="overflow-x-auto -mx-4 sm:mx-0">
    <div className="inline-block min-w-full align-middle">
      <table className="min-w-full divide-y divide-gray-700">
        <colgroup>
          <col className="w-10" /> {/* Posição */}
          <col className="min-w-[180px]" /> {/* Time */}
          <col className="w-12" /> {/* Pontos */}
          <col className="w-12" /> {/* Jogos */}
          <col className="w-12" /> {/* Vitórias */}
          <col className="w-12" /> {/* Empates */}
          <col className="w-12" /> {/* Derrotas */}
          <col className="w-12" /> {/* Gols Pró */}
          <col className="w-12" /> {/* Gols Contra */}
          <col className="w-12" /> {/* Saldo */}
        </colgroup>
        <thead>
          <tr className="text-gray-400">
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">#</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Time</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold">P</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold hidden sm:table-cell">J</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold hidden sm:table-cell">V</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold hidden sm:table-cell">E</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold hidden sm:table-cell">D</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold">GP</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold">GC</th>
            <th scope="col" className="py-3 px-4 text-center text-sm font-semibold">SG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {standings.map((standing, index) => (
            <tr
              key={index}
              className={`${
                index < (groupName ? 2 : 4) ? 'bg-green-900/20' : ''
              } hover:bg-gray-700/30 transition-colors`}
            >
              <td className="py-4 px-4 text-gray-300 text-sm font-medium">{index + 1}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3 min-h-[40px]">
                  {standing.team.logo_url ? (
                    <img
                      src={standing.team.logo_url}
                      alt={standing.team.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-gray-600" />
                  )}
                  <span className="text-white text-sm font-medium whitespace-nowrap">
                    {standing.team.name}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-center font-semibold text-white text-sm">
                {standing.points}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm hidden sm:table-cell">
                {standing.matches_played}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm hidden sm:table-cell">
                {standing.wins}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm hidden sm:table-cell">
                {standing.draws}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm hidden sm:table-cell">
                {standing.losses}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm">
                {standing.goals_for}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm">
                {standing.goals_against}
              </td>
              <td className="py-4 px-4 text-center text-gray-300 text-sm">
                {standing.goal_difference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-white">{error}</h1>
        <BackButton fallbackPath="/dashboard/championships" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackButton />
      <h1 className="text-2xl font-bold text-white mb-8">Estatísticas do Campeonato</h1>

      {/* Standings */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Classificação</h2>
          </div>

          {formatType === 'groups' ? (
            <div className="space-y-8">
              {groups.map(group => (
                <div key={group.id}>
                  <h3 className="text-lg font-medium text-white mb-4">
                   {group.name}
                  </h3>
                  {renderStandingsTable(group.standings, group.name)}
                </div>
              ))}
            </div>
          ) : (
            renderStandingsTable(standings)
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Scorers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Goal className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Artilharia</h2>
          </div>

          <div className="space-y-4">
            {topScorers.map((scorer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-900/50 text-green-300 rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {scorer.player.name}
                      </span>
                      <span className="text-gray-400">
                        #{scorer.player.jersey_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        {scorer.team.name}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {scorer.player.position}
                      </span>
                      {formatType === 'groups' && scorer.group_name && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">
                            Grupo {scorer.group_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {scorer.goals}
                    </div>
                    <div className="text-xs text-gray-400">Gols</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">
                      {scorer.assists}
                    </div>
                    <div className="text-xs text-gray-400">Assists</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Assists */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Assistências</h2>
          </div>

          <div className="space-y-4">
            {topAssists.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-900/50 text-blue-300 rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {player.player.name}
                      </span>
                      <span className="text-gray-400">
                        #{player.player.jersey_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        {player.team.name}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {player.player.position}
                      </span>
                      {formatType === 'groups' && player.group_name && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">
                            Grupo {player.group_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {player.assists}
                    </div>
                    <div className="text-xs text-gray-400">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">
                      {player.goals}
                    </div>
                    <div className="text-xs text-gray-400">Gols</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Estatísticas por Time</h2>
          </div>

          <div className="space-y-4">
            {teamStats.map((team, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {team.team.logo_url ? (
                    <img
                      src={team.team.logo_url}
                      alt={team.team.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Shield className="w-8 h-8 text-gray-600" />
                  )}
                  <div>
                    <span className="text-white font-medium">
                      {team.team.name}
                    </span>
                    {formatType === 'groups' && team.group_name && (
                      <span className="text-sm text-gray-400 ml-2">
                        Grupo {team.group_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {team.goals_for}
                    </div>
                    <div className="text-xs text-gray-400">Gols Marcados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {team.goals_against}
                    </div>
                    <div className="text-xs text-gray-400">Gols Sofridos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disciplinary Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-white">Cartões</h2>
          </div>

          <div className="space-y-4">
            {disciplinaryStats.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-900/50 text-red-300 rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {player.player.name}
                      </span>
                      <span className="text-gray-400">
                        #{player.player.jersey_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        {player.team.name}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {player.player.position}
                      </span>
                      {formatType === 'groups' && player.group_name && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">
                            Grupo {player.group_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {player.yellow_cards}
                    </div>
                    <div className="text-xs text-gray-400">Amarelos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {player.red_cards}
                    </div>
                    <div className="text-xs text-gray-400">Vermelhos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}