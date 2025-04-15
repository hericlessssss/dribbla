import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTeamStore } from '../store/teamStore';
import { Shield } from 'lucide-react';

export function TeamForm() {
  const navigate = useNavigate();
  const { teamId, championshipId } = useParams();
  const { createTeam, updateTeam, getTeamById } = useTeamStore();
  
  const [formData, setFormData] = useState({
    name: '',
    coach_name: '',
    logo_url: '',
    primary_color: '#059669',
    secondary_color: '#065F46',
    championship_id: championshipId || null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTeam = async () => {
      if (teamId) {
        try {
          const team = await getTeamById(teamId);
          if (team) {
            setFormData({
              name: team.name,
              coach_name: team.coach_name,
              logo_url: team.logo_url || '',
              primary_color: team.primary_color,
              secondary_color: team.secondary_color,
              championship_id: team.championship_id
            });
          }
        } catch (err) {
          setError('Erro ao carregar dados do time');
        }
      }
    };

    loadTeam();
  }, [teamId, getTeamById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only include championship_id if it exists
      const teamData = {
        ...formData,
        championship_id: formData.championship_id || undefined
      };
      
      if (teamId) {
        await updateTeam(teamId, teamData);
      } else {
        await createTeam(teamData);
      }

      navigate(championshipId 
        ? `/dashboard/championships/${championshipId}/teams`
        : '/dashboard/teams'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBack = () => {
    if (teamId) {
      navigate(`/dashboard/teams/${teamId}`);
    } else if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/teams`);
    } else {
      navigate('/dashboard/teams');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">
          {teamId ? 'Editar Time' : 'Novo Time'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Time
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="Ex: Real Madrid"
          />
        </div>

        <div>
          <label htmlFor="coach_name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Técnico
          </label>
          <input
            type="text"
            id="coach_name"
            name="coach_name"
            value={formData.coach_name}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="Ex: Carlo Ancelotti"
          />
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
            URL do Logo (opcional)
          </label>
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="https://exemplo.com/logo.png"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primary_color" className="block text-sm font-medium text-gray-300 mb-2">
              Cor Principal
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleChange}
                className="h-12 w-12 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={handleChange}
                name="primary_color"
                className="flex-1 h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-300 mb-2">
              Cor Secundária
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                id="secondary_color"
                name="secondary_color"
                value={formData.secondary_color}
                onChange={handleChange}
                className="h-12 w-12 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondary_color}
                onChange={handleChange}
                name="secondary_color"
                className="flex-1 h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : teamId ? 'Atualizar Time' : 'Criar Time'}
          </button>
        </div>
      </form>
    </div>
  );
}