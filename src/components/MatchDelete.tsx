import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Notification } from './Notification';

export function MatchDelete() {
  const { championshipId } = useParams();
  const { user } = useAuthStore();
  const { matches, deleteMatch, fetchMatches } = useMatchStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Only show delete options for organizers
  const isOrganizer = matches.some(match => match.championship?.organizer_id === user?.id);

  const handleDeleteAllMatches = async () => {
    if (!championshipId) return;
    
    setLoading(true);
    try {
      // Call the reset_championship_statistics RPC function
      const { error } = await supabase.rpc('reset_championship_statistics', {
        p_championship_id: championshipId
      });

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Todas as partidas e estatísticas foram excluídas com sucesso!'
      });

      // Refresh matches list
      await fetchMatches(championshipId);
      setShowModal(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao excluir partidas e estatísticas'
      });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOrganizer) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Limpar Partidas
      </button>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Excluir Partidas</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Você está prestes a excluir todas as partidas e estatísticas deste campeonato. Esta ação irá:
            </p>

            <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
              <li>Excluir todas as partidas</li>
              <li>Remover todos os eventos de partidas (gols, cartões, etc.)</li>
              <li>Zerar a classificação de todos os times</li>
              <li>Limpar todas as estatísticas individuais dos jogadores</li>
            </ul>

            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm font-medium">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllMatches}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}