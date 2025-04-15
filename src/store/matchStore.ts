import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Match {
  id: string;
  championship_id: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  match_date: string;
  phase: 'Pontos Corridos' | 'Fase de Grupos' | 'Oitavas de Final' | 'Quartas de Final' | 'Semifinal' | 'Final';
  status: 'Agendado' | 'Em Andamento' | 'Intervalo' | 'Segundo Tempo' | 'Pênaltis' | 'Encerrado';
  match_time: number;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
  home_team?: {
    name: string;
    logo_url: string | null;
  };
  away_team?: {
    name: string;
    logo_url: string | null;
  };
  championship?: {
    organizer_id: string;
    match_formats?: {
      format_type: 'points' | 'groups';
    }[];
  };
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  assist_player_id?: string;
  event_type: 'Gol' | 'Assistência' | 'Cartão Amarelo' | 'Cartão Vermelho' | 'Substituição';
  minute: number;
  created_at: string;
  player?: {
    name: string;
    jersey_number: number;
  };
  assist_player?: {
    name: string;
    jersey_number: number;
  };
}

interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  matchEvents: MatchEvent[];
  loading: boolean;
  error: string | null;
  timer: number | null;
  fetchMatches: (championshipId?: string) => Promise<void>;
  createMatch: (match: Omit<Match, 'id' | 'created_at' | 'updated_at' | 'match_time' | 'home_score' | 'away_score'>) => Promise<Match>;
  updateMatch: (id: string, match: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  fetchMatchEvents: (matchId: string) => Promise<void>;
  createMatchEvent: (event: Omit<MatchEvent, 'id' | 'created_at'>) => Promise<void>;
  startMatch: (matchId: string) => Promise<void>;
  pauseMatch: (matchId: string) => Promise<void>;
  resumeMatch: (matchId: string) => Promise<void>;
  endMatch: (matchId: string) => Promise<void>;
  updateMatchTime: (matchId: string, time: number) => Promise<void>;
  setTimer: (time: number | null) => void;
  updateMatchStatistics: (matchId: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  currentMatch: null,
  matchEvents: [],
  loading: false,
  error: null,
  timer: null,

  fetchMatches: async (championshipId?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url),
          championship:championships(
            organizer_id,
            match_formats (
              format_type
            )
          )
        `);

      if (championshipId) {
        query = query.eq('championship_id', championshipId);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('Fetched matches:', data);

      // Update phase based on format type
      const matchesWithCorrectPhase = data?.map(match => ({
        ...match,
        phase: match.championship?.match_formats?.[0]?.format_type === 'points' ? 'Pontos Corridos' : match.phase
      })) || [];

      set({ matches: matchesWithCorrectPhase });
    } catch (error) {
      console.error('Error fetching matches:', error);
      set({ error: 'Erro ao carregar partidas' });
    } finally {
      set({ loading: false });
    }
  },

  fetchMatchEvents: async (matchId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          player:players!match_events_player_id_fkey(name, jersey_number),
          assist_player:players!match_events_assist_player_id_fkey(name, jersey_number)
        `)
        .eq('match_id', matchId)
        .order('minute', { ascending: true });

      if (error) throw error;
      set({ matchEvents: data || [] });
    } catch (error) {
      set({ error: 'Erro ao carregar eventos da partida' });
    } finally {
      set({ loading: false });
    }
  },

  createMatchEvent: async (event) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('match_events')
        .insert([event])
        .select(`
          *,
          player:players!match_events_player_id_fkey(name, jersey_number),
          assist_player:players!match_events_assist_player_id_fkey(name, jersey_number)
        `)
        .single();

      if (error) throw error;
      set(state => ({ matchEvents: [...state.matchEvents, data] }));

      // Update match score if it's a goal
      if (event.event_type === 'Gol') {
        const match = get().matches.find(m => m.id === event.match_id);
        if (match) {
          const isHomeTeam = event.team_id === match.home_team_id;
          await get().updateMatch(match.id, {
            home_score: isHomeTeam ? match.home_score + 1 : match.home_score,
            away_score: !isHomeTeam ? match.away_score + 1 : match.away_score
          });
        }
      }
    } catch (error) {
      set({ error: 'Erro ao criar evento' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createMatch: async (match) => {
    set({ loading: true, error: null });
    try {
      // Get format type
      const { data: formatData } = await supabase
        .from('match_formats')
        .select('format_type')
        .eq('championship_id', match.championship_id)
        .single();

      const phase = formatData?.format_type === 'points' ? 'Pontos Corridos' : match.phase;

      const { data, error } = await supabase
        .from('matches')
        .insert([{
          ...match,
          phase,
          status: 'Agendado',
          home_score: 0,
          away_score: 0,
          match_time: 0
        }])
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        `)
        .single();

      if (error) throw error;

      set(state => ({
        matches: [data, ...state.matches]
      }));

      return data;
    } catch (error) {
      set({ error: 'Erro ao criar partida' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateMatch: async (id, match) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('matches')
        .update(match)
        .eq('id', id)
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url),
          championship:championships(organizer_id)
        `)
        .single();

      if (error) throw error;
      set(state => ({
        matches: state.matches.map(m => m.id === id ? data : m),
        currentMatch: state.currentMatch?.id === id ? data : state.currentMatch
      }));
    } catch (error) {
      set({ error: 'Erro ao atualizar partida' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteMatch: async (id) => {
    set({ loading: true, error: null });
    try {
      // Clear match statistics before deleting the match
      const { error: clearStatsError } = await supabase.rpc('clear_match_statistics', {
        p_match_id: id
      });

      if (clearStatsError) throw clearStatsError;

      // Delete the match
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      set(state => ({
        matches: state.matches.filter(m => m.id !== id),
        currentMatch: state.currentMatch?.id === id ? null : state.currentMatch
      }));
    } catch (error) {
      set({ error: 'Erro ao excluir partida' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  startMatch: async (matchId: string) => {
    try {
      await get().updateMatch(matchId, {
        status: 'Em Andamento',
        match_time: 0
      });
      set({ timer: 0 });
    } catch (error) {
      console.error('Error starting match:', error);
      throw error;
    }
  },

  pauseMatch: async (matchId: string) => {
    try {
      await get().updateMatch(matchId, {
        status: 'Intervalo',
        match_time: 45
      });
      set({ timer: 45 });
    } catch (error) {
      console.error('Error pausing match:', error);
      throw error;
    }
  },

  resumeMatch: async (matchId: string) => {
    try {
      await get().updateMatch(matchId, {
        status: 'Segundo Tempo',
        match_time: 45
      });
      set({ timer: 45 }); // Start second half at 45 minutes
    } catch (error) {
      console.error('Error resuming match:', error);
      throw error;
    }
  },

  endMatch: async (matchId: string) => {
    try {
      await get().updateMatch(matchId, {
        status: 'Encerrado',
        match_time: 90
      });
      set({ timer: null });

      // Update statistics after match ends
      await get().updateMatchStatistics(matchId);
    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  },

  updateMatchTime: async (matchId: string, time: number) => {
    try {
      await get().updateMatch(matchId, { match_time: time });
    } catch (error) {
      console.error('Error updating match time:', error);
      throw error;
    }
  },

  setTimer: (time) => set({ timer: time }),

  updateMatchStatistics: async (matchId: string) => {
    try {
      const match = get().matches.find(m => m.id === matchId);
      if (!match) throw new Error('Match not found');

      // Get all events for this match
      const { data: events, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId);

      if (eventsError) throw eventsError;

      // Update championship standings
      const homeTeamPoints = match.home_score > match.away_score ? 3 : match.home_score === match.away_score ? 1 : 0;
      const awayTeamPoints = match.away_score > match.home_score ? 3 : match.home_score === match.away_score ? 1 : 0;

      // Update home team standings
      const { error: homeStandingsError } = await supabase.rpc('update_team_standings', {
        p_championship_id: match.championship_id,
        p_team_id: match.home_team_id,
        p_points: homeTeamPoints,
        p_goals_for: match.home_score,
        p_goals_against: match.away_score,
        p_is_win: match.home_score > match.away_score,
        p_is_draw: match.home_score === match.away_score,
        p_is_loss: match.home_score < match.away_score
      });

      if (homeStandingsError) throw homeStandingsError;

      // Update away team standings
      const { error: awayStandingsError } = await supabase.rpc('update_team_standings', {
        p_championship_id: match.championship_id,
        p_team_id: match.away_team_id,
        p_points: awayTeamPoints,
        p_goals_for: match.away_score,
        p_goals_against: match.home_score,
        p_is_win: match.away_score > match.home_score,
        p_is_draw: match.home_score === match.away_score,
        p_is_loss: match.away_score < match.home_score
      });

      if (awayStandingsError) throw awayStandingsError;

      // Update player statistics
      if (events) {
        for (const event of events) {
          const { error: playerStatsError } = await supabase.rpc('update_player_stats', {
            p_championship_id: match.championship_id,
            p_player_id: event.player_id,
            p_team_id: event.team_id,
            p_goals: event.event_type === 'Gol' ? 1 : 0,
            p_assists: event.event_type === 'Assistência' ? 1 : 0,
            p_yellow_cards: event.event_type === 'Cartão Amarelo' ? 1 : 0,
            p_red_cards: event.event_type === 'Cartão Vermelho' ? 1 : 0,
            p_minutes_played: 90
          });

          if (playerStatsError) throw playerStatsError;

          // Update assist player stats if exists
          if (event.assist_player_id) {
            const { error: assistPlayerStatsError } = await supabase.rpc('update_player_stats', {
              p_championship_id: match.championship_id,
              p_player_id: event.assist_player_id,
              p_team_id: event.team_id,
              p_goals: 0,
              p_assists: 1,
              p_yellow_cards: 0,
              p_red_cards: 0,
              p_minutes_played: 90
            });

            if (assistPlayerStatsError) throw assistPlayerStatsError;
          }
        }
      }
    } catch (error) {
      console.error('Error updating match statistics:', error);
      throw error;
    }
  }
}));