import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Player {
  id: string;
  name: string;
  position: string;
  birth_date: string;
  jersey_number: number;
  photo_url?: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

interface PlayerState {
  players: Player[];
  loading: boolean;
  error: string | null;
  fetchPlayers: (teamId: string) => Promise<void>;
  createPlayer: (player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePlayer: (id: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  getPlayerById: (id: string) => Promise<Player | null>;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  players: [],
  loading: false,
  error: null,

  fetchPlayers: async (teamId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true });

      if (error) throw error;
      set({ players: data });
    } catch (error) {
      set({ error: 'Failed to fetch players' });
    } finally {
      set({ loading: false });
    }
  },

  createPlayer: async (player) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([player])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        players: [...state.players, data]
      }));
    } catch (error) {
      set({ error: 'Failed to create player' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePlayer: async (id, player) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('players')
        .update(player)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        players: state.players.map(p => p.id === id ? { ...p, ...data } : p)
      }));
    } catch (error) {
      set({ error: 'Failed to update player' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deletePlayer: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        players: state.players.filter(p => p.id !== id)
      }));
    } catch (error) {
      set({ error: 'Failed to delete player' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getPlayerById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch player:', error);
      return null;
    }
  }
}));