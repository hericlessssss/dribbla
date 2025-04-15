import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Search, Shield, ArrowLeft, Calendar, Upload } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { Notification } from './Notification';
import { BackButton } from './BackButton';

export function TeamsList() {
  const { championshipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { teams, loading, error, fetchTeams, deleteTeam } = useTeamStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (championshipId) {
      fetchTeams(championshipId);
    } else {
      fetchTeams();
    }
  }, [championshipId, fetchTeams]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este time?')) return;

    try {
      await deleteTeam(id);
      setNotification({ type: 'success', message: 'Time excluído com sucesso!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao excluir time' });
    }
  };

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.coach_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <BackButton />
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Times</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to={championshipId ? `/dashboard/championships/${championshipId}/teams/new` : "/dashboard/teams/new"}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Time
          </Link>
          <Link
            to={championshipId ? `/dashboard/championships/${championshipId}/teams/import` : "/dashboard/teams/import"}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Importar Jogadores
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar times..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
          >
            <div 
              className="h-32 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})`
              }}
            >
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="w-24 h-24 object-contain"
                />
              ) : (
                <Shield className="w-16 h-16 text-white/50" />
              )}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{team.name}</h2>
                <p className="text-gray-400">Técnico: {team.coach_name}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{team._count?.players || 0} jogadores</span>
                </div>
                {team.average_age && team.average_age > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Média {team.average_age.toFixed(1)} anos</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {team.id && (
                  <Link
                    to={`/dashboard/teams/${team.id}`}
                    state={{ from: location.pathname }}
                    className="flex-1 text-center py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Ver Detalhes
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhum time encontrado</h3>
          <p className="text-gray-400">
            {searchTerm ? 'Tente outros termos de busca' : 'Comece criando seu primeiro time!'}
          </p>
        </div>
      )}
    </div>
  );
}