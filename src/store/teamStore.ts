import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  name: string;
  coach_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  championship_id: string;
  created_at: string;
  updated_at: string;
  _count?: {
    players: number;
  };
  average_age?: number;
}

interface TeamState {
  teams: Team[];
  loading: boolean;
  error: string | null;
  fetchTeams: (championshipId?: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  getTeamById: (id: string) => Promise<Team | null>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  loading: false,
  error: null,

  fetchTeams: async (championshipId?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('teams')
        .select(`
          *,
          players (
            id,
            birth_date
          )
        `);

      if (championshipId) {
        query = query.eq('championship_id', championshipId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process team statistics
      const teamsWithStats = data.map(team => {
        const players = team.players || [];
        
        // Calculate average age
        const now = new Date();
        const ages = players.map(player => {
          const birthDate = new Date(player.birth_date);
          const age = now.getFullYear() - birthDate.getFullYear();
          // Adjust age if birthday hasn't occurred this year
          const monthDiff = now.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            return age - 1;
          }
          return age;
        });

        const averageAge = ages.length > 0
          ? ages.reduce((sum, age) => sum + age, 0) / ages.length
          : 0;

        return {
          ...team,
          players: undefined, // Remove raw players data
          _count: {
            players: players.length
          },
          average_age: averageAge > 0 ? Math.round(averageAge * 10) / 10 : 0
        };
      });

      set({ teams: teamsWithStats });
    } catch (error) {
      set({ error: 'Failed to fetch teams' });
    } finally {
      set({ loading: false });
    }
  },

  createTeam: async (team) => {
    set({ loading: true, error: null });
    try {
      // Remove championship_id if it's null or undefined to prevent constraint violation
      const teamData = { ...team };
      if (!teamData.championship_id) {
        delete teamData.championship_id;
      }

      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        teams: [{ ...data, _count: { players: 0 }, average_age: 0 }, ...state.teams]
      }));
    } catch (error) {
      set({ error: 'Failed to create team' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, team) => {
    set({ loading: true, error: null });
    try {
      // Remove championship_id if it's null or undefined to prevent constraint violation
      const teamData = { ...team };
      if (!teamData.championship_id) {
        delete teamData.championship_id;
      }

      const { data, error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        teams: state.teams.map(t => t.id === id ? { ...t, ...data } : t)
      }));
    } catch (error) {
      set({ error: 'Failed to update team' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        teams: state.teams.filter(t => t.id !== id)
      }));
    } catch (error) {
      set({ error: 'Failed to delete team' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getTeamById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          players (
            id,
            birth_date
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Calculate statistics
      const players = data.players || [];
      const now = new Date();
      const ages = players.map(player => {
        const birthDate = new Date(player.birth_date);
        const age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
          return age - 1;
        }
        return age;
      });

      const averageAge = ages.length > 0
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length
        : 0;

      return {
        ...data,
        players: undefined,
        _count: {
          players: players.length
        },
        average_age: averageAge > 0 ? Math.round(averageAge * 10) / 10 : 0
      };
    } catch (error) {
      console.error('Failed to fetch team:', error);
      return null;
    }
  }
}));