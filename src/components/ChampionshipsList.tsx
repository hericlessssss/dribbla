import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Trophy, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useChampionshipStore } from '../store/championshipStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from './Notification';
import { seedChampionshipData } from '../scripts/seedData';

export function ChampionshipsList() {
  const { user } = useAuthStore();
  const { championships, loading, error, fetchChampionships, deleteChampionship } = useChampionshipStore();
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este campeonato?')) return;

    try {
      await deleteChampionship(id);
      setNotification({ type: 'success', message: 'Campeonato excluído com sucesso!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao excluir campeonato' });
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const championshipId = await seedChampionshipData();
      await fetchChampionships();
      setNotification({ 
        type: 'success', 
        message: 'Dados de exemplo criados com sucesso!' 
      });
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: 'Erro ao criar dados de exemplo' 
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Meus Campeonatos</h1>
        <div className="flex gap-2">
          {user?.role === 'organizer' && (
            <>
              <Link
                to="/dashboard/championships/new"
                className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Novo Campeonato
              </Link>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trophy className="w-4 h-4" />
                )}
                Criar Exemplo
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {championships.map((championship) => (
          <div
            key={championship.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
          >
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              {championship.logo_url ? (
                <img
                  src={championship.logo_url}
                  alt={championship.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Trophy className="w-12 h-12 text-gray-600" />
              )}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{championship.name}</h2>
                <span className="inline-block mt-1 px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                  {championship.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(championship.start_date), "dd 'de' MMMM", { locale: ptBR })} até{' '}
                  {format(new Date(championship.end_date), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/dashboard/championships/${championship.id}`}
                  className="flex-1 text-center py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Ver Detalhes
                </Link>
                {user?.id === championship.organizer_id && (
                  <>
                    <Link
                      to={`/dashboard/championships/${championship.id}/edit`}
                      className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(championship.id)}
                      className="p-2 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {championships.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhum campeonato encontrado</h3>
          <p className="text-gray-400">
            {user?.role === 'organizer'
              ? 'Comece criando seu primeiro campeonato!'
              : 'Não há campeonatos disponíveis no momento.'}
          </p>
        </div>
      )}
    </div>
  );
}