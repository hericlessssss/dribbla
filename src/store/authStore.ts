import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthError } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'organizer' | 'fan';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'organizer' | 'fan') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const getErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case 'User already registered':
      return 'Este e-mail já está cadastrado';
    case 'Invalid login credentials':
      return 'E-mail ou senha incorretos';
    case 'Email not confirmed':
      return 'Por favor, confirme seu e-mail antes de fazer login';
    case 'Invalid email':
      return 'E-mail inválido';
    case 'Password should be at least 6 characters':
      return 'A senha deve ter pelo menos 6 caracteres';
    case 'Email link is invalid or has expired':
      return 'O link de confirmação é inválido ou expirou';
    case 'Rate limit exceeded':
      return 'Muitas tentativas. Por favor, aguarde alguns minutos';
    case 'Network error':
      return 'Erro de conexão. Verifique sua internet';
    default:
      return error.message || 'Ocorreu um erro inesperado';
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  signUp: async (email, password, firstName, lastName, role) => {
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este e-mail já está cadastrado');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      });

      if (signUpError) {
        throw new Error(getErrorMessage(signUpError));
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Ocorreu um erro inesperado durante o cadastro');
    }
  },
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(getErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Erro ao fazer login');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Erro ao carregar perfil do usuário');
      }

      set({ user: profile });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(getErrorMessage(error as AuthError));
      }
      throw new Error('Ocorreu um erro inesperado durante o login');
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(getErrorMessage(error));
    }
    set({ user: null });
  },
}));

// Initialize session
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profile) {
      useAuthStore.getState().setUser(profile);
    }
  }
});