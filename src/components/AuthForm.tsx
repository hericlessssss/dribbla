import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus, LogIn, Loader2 } from 'lucide-react';
import { Notification } from './Notification';

interface AuthFormProps {
  mode: 'login' | 'register';
}

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'organizer' | 'fan'>('organizer');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password, firstName, lastName, role);
        setNotification({
          type: 'success',
          message: 'Conta criada com sucesso! Você já pode fazer login.'
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ocorreu um erro inesperado'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-green-500 mb-2">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Junte-se ao Dribbla'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' 
              ? 'Entre para gerenciar seus campeonatos'
              : 'Crie sua conta para começar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                    Nome
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full h-12 rounded-md bg-gray-700 border-transparent focus:border-green-500 focus:ring-0 text-white px-4"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                    Sobrenome
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full h-12 rounded-md bg-gray-700 border-transparent focus:border-green-500 focus:ring-0 text-white px-4"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                  Eu sou
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'organizer' | 'fan')}
                  className="mt-1 block w-full h-12 rounded-md bg-gray-700 border-transparent focus:border-green-500 focus:ring-0 text-white px-4"
                  disabled={isLoading}
                >
                  <option value="organizer">Organizador de Campeonatos</option>
                  <option value="fan">Torcedor</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full h-12 rounded-md bg-gray-700 border-transparent focus:border-green-500 focus:ring-0 text-white px-4"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full h-12 rounded-md bg-gray-700 border-transparent focus:border-green-500 focus:ring-0 text-white px-4"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Entrar
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Criar Conta
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <a href="/register" className="text-green-500 hover:text-green-400">
                Cadastre-se
              </a>
            </>
          ) : (
            <>
              Já tem uma conta?{' '}
              <a href="/login" className="text-green-500 hover:text-green-400">
                Entrar
              </a>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm">
        Desenvolvido por{' '}
        <a 
          href="https://labora-tech.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-green-500 hover:text-green-400"
        >
          Labora Tech
        </a>
      </div>
    </div>
  );
}