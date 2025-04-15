import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Scroll, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from './Notification';
import { BackButton } from './BackButton';

interface Championship {
  id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  rules: string;
  logo_url: string | null;
  is_active: boolean;
  organizer_id: string;
}

export function ChampionshipDetails() {
  const { championshipId } = useParams();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function fetchChampionship() {
      if (!championshipId) {
        navigate('/dashboard/championships');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('championships')
          .select('*')
          .eq('id', championshipId)
          .single();

        if (error) throw error;
        setChampionship(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar campeonato');
      } finally {
        setLoading(false);
      }
    }

    fetchChampionship();
  }, [championshipId, navigate]);

  const handleResetChampionship = async () => {
    if (!championshipId || !championship) return;
    
    setResetting(true);
    try {
      const { error } = await supabase.rpc('reset_championship_statistics', {
        p_championship_id: championshipId
      });

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Estatísticas do campeonato resetadas com sucesso!'
      });
      setShowResetConfirmation(false);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Erro ao resetar estatísticas do campeonato'
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || 'Campeonato não encontrado'}</p>
        <BackButton fallbackPath="/dashboard/championships" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <BackButton fallbackPath="/dashboard/championships" />

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">{championship.name}</h1>
            {championship.logo_url && (
              <img
                src={championship.logo_url}
                alt={`${championship.name} logo`}
                className="w-24 h-24 object-contain"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Categoria</p>
                <p className="text-lg font-medium text-white">{championship.category}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Duração</p>
                <p className="text-lg font-medium text-white">
                  {format(new Date(championship.start_date), "dd 'de' MMMM", { locale: ptBR })} até{' '}
                  {format(new Date(championship.end_date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-start mb-6">
              <Scroll className="w-6 h-6 text-green-500 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-3 text-white">Regulamento</h2>
                <div className="prose max-w-none text-gray-300">
                  <p className="whitespace-pre-wrap">{championship.rules}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${championship.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-300">{championship.is_active ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className="flex gap-4">
                {championship.is_active && (
                  <>
                    <button
                      onClick={() => setShowResetConfirmation(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resetar Estatísticas
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/championships/${championshipId}/edit`)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Editar Campeonato
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-semibold text-white mb-4">Resetar Estatísticas</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja resetar todas as estatísticas do campeonato? Esta ação irá:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
              <li>Limpar todos os resultados de partidas</li>
              <li>Zerar a classificação dos times</li>
              <li>Remover estatísticas individuais dos jogadores</li>
              <li>Redefinir status das partidas para "Agendado"</li>
            </ul>
            <p className="text-red-400 text-sm mb-6">
              Esta ação não pode ser desfeita!
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                onClick={handleResetChampionship}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Confirmar Reset
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