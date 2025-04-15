import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Championship {
  id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  rules: string;
  logo_url?: string;
  is_active: boolean;
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

interface ChampionshipState {
  championships: Championship[];
  loading: boolean;
  error: string | null;
  fetchChampionships: () => Promise<void>;
  createChampionship: (championship: Omit<Championship, 'id' | 'created_at' | 'updated_at' | 'organizer_id'>) => Promise<void>;
  updateChampionship: (id: string, championship: Partial<Championship>) => Promise<void>;
  deleteChampionship: (id: string) => Promise<void>;
  getChampionshipById: (id: string) => Promise<Championship | null>;
}

export const useChampionshipStore = create<ChampionshipState>((set, get) => ({
  championships: [],
  loading: false,
  error: null,

  fetchChampionships: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ championships: data });
    } catch (error) {
      set({ error: 'Erro ao carregar campeonatos' });
    } finally {
      set({ loading: false });
    }
  },

  createChampionship: async (championship) => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('championships')
        .insert([{
          ...championship,
          organizer_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        championships: [data, ...state.championships]
      }));
    } catch (error) {
      set({ error: 'Erro ao criar campeonato' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateChampionship: async (id, championship) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('championships')
        .update(championship)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        championships: state.championships.map(c => 
          c.id === id ? { ...c, ...data } : c
        )
      }));
    } catch (error) {
      set({ error: 'Erro ao atualizar campeonato' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteChampionship: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('championships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        championships: state.championships.filter(c => c.id !== id)
      }));
    } catch (error) {
      set({ error: 'Erro ao excluir campeonato' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getChampionshipById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching championship:', error);
      return null;
    }
  }
}));