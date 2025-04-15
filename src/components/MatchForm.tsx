import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { useTeamStore } from '../store/teamStore';
import { format } from 'date-fns';

export function MatchForm() {
  const navigate = useNavigate();
  const { championshipId, matchId } = useParams();
  const { createMatch, matches, fetchMatches, updateMatch } = useMatchStore();
  const { teams, fetchTeams } = useTeamStore();
  
  const [formData, setFormData] = useState({
    championship_id: championshipId || '',
    home_team_id: '',
    away_team_id: '',
    venue: '',
    match_date: format(new Date(), 'yyyy-MM-dd'),
    match_time: '19:00',
    phase: 'Fase de Grupos' as const
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (championshipId) {
      fetchTeams(championshipId);
    }
    if (matchId) {
      fetchMatches();
    }
  }, [championshipId, matchId, fetchTeams, fetchMatches]);

  useEffect(() => {
    if (matchId) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const matchDate = new Date(match.match_date);
        setFormData({
          championship_id: match.championship_id,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          venue: match.venue,
          match_date: format(matchDate, 'yyyy-MM-dd'),
          match_time: format(matchDate, 'HH:mm'),
          phase: match.phase
        });
      }
    }
  }, [matchId, matches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const matchDateTime = new Date(`${formData.match_date}T${formData.match_time}`);

      if (matchId) {
        await updateMatch(matchId, {
          venue: formData.venue,
          match_date: matchDateTime.toISOString()
        });
      } else {
        await createMatch({
          ...formData,
          match_date: matchDateTime.toISOString()
        });
      }

      navigate(championshipId 
        ? `/dashboard/championships/${championshipId}/matches`
        : '/dashboard/matches'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBack = () => {
    if (matchId) {
      navigate(`/dashboard/matches/${matchId}`);
    } else if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/matches`);
    } else {
      navigate('/dashboard/matches');
    }
  };

  const homeTeam = teams.find(team => team.id === formData.home_team_id);
  const awayTeam = teams.find(team => team.id === formData.away_team_id);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={handleBack}
        className="flex items-center text-green-500 hover:text-green-400 mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </button>

      <div className="flex items-center gap-3 mb-8">
        <Calendar className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">
          {matchId ? 'Editar Partida' : 'Nova Partida'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matchId ? (
            // Display teams when editing
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Mandante
                </label>
                <div className="h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white flex items-center">
                  {homeTeam?.name || 'Time não encontrado'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Visitante
                </label>
                <div className="h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white flex items-center">
                  {awayTeam?.name || 'Time não encontrado'}
                </div>
              </div>
            </>
          ) : (
            // Allow team selection when creating
            <>
              <div>
                <label htmlFor="home_team_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Time Mandante
                </label>
                <select
                  id="home_team_id"
                  name="home_team_id"
                  value={formData.home_team_id}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Selecione o time mandante</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="away_team_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Time Visitante
                </label>
                <select
                  id="away_team_id"
                  name="away_team_id"
                  value={formData.away_team_id}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Selecione o time visitante</option>
                  {teams
                    .filter(team => team.id !== formData.home_team_id)
                    .map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-300 mb-2">
            Local da Partida
          </label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="Ex: Estádio Municipal"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="match_date" className="block text-sm font-medium text-gray-300 mb-2">
              Data da Partida
            </label>
            <input
              type="date"
              id="match_date"
              name="match_date"
              value={formData.match_date}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="match_time" className="block text-sm font-medium text-gray-300 mb-2">
              Horário
            </label>
            <input
              type="time"
              id="match_time"
              name="match_time"
              value={formData.match_time}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
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
            {loading ? 'Salvando...' : matchId ? 'Atualizar Partida' : 'Criar Partida'}
          </button>
        </div>
      </form>
    </div>
  );
}