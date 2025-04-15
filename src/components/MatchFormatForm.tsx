import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Shuffle } from 'lucide-react';
import { useMatchFormatStore } from '../store/matchFormatStore';
import { useTeamStore } from '../store/teamStore';

export function MatchFormatForm() {
  const navigate = useNavigate();
  const { championshipId } = useParams();
  const { createFormat, generateMatches } = useMatchFormatStore();
  const { teams, fetchTeams } = useTeamStore();
  
  const [formatType, setFormatType] = useState<'points' | 'groups'>('points');
  const [homeAndAway, setHomeAndAway] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (championshipId) {
      fetchTeams(championshipId);
    }
  }, [championshipId, fetchTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!championshipId) return;

    setLoading(true);
    setError('');

    try {
      // Validate minimum number of teams
      if (teams.length < 2) {
        throw new Error('É necessário ter pelo menos 2 times cadastrados');
      }

      // For group format, validate number of groups
      if (formatType === 'groups') {
        if (numberOfGroups > teams.length / 2) {
          throw new Error('Número de grupos muito alto para a quantidade de times');
        }
      }

      // Create format
      await createFormat({
        championship_id: championshipId,
        format_type: formatType,
        home_and_away: homeAndAway,
        number_of_groups: formatType === 'groups' ? numberOfGroups : undefined
      });

      // Generate matches
      await generateMatches(championshipId);

      navigate(`/dashboard/championships/${championshipId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">Formato do Campeonato</h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Formato do Campeonato
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormatType('points')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formatType === 'points'
                  ? 'border-green-500 bg-green-900/20 text-white'
                  : 'border-gray-700 bg-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">Pontos Corridos</h3>
              <p className="text-sm">
                Todos os times se enfrentam entre si em um único grupo
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormatType('groups')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formatType === 'groups'
                  ? 'border-green-500 bg-green-900/20 text-white'
                  : 'border-gray-700 bg-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">Fase de Grupos</h3>
              <p className="text-sm">
                Times divididos em grupos, jogando entre si dentro de cada grupo
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="homeAndAway"
            checked={homeAndAway}
            onChange={(e) => setHomeAndAway(e.target.checked)}
            className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-offset-gray-800"
          />
          <label htmlFor="homeAndAway" className="text-gray-300">
            Jogos de ida e volta
          </label>
        </div>

        {formatType === 'groups' && (
          <div>
            <label htmlFor="numberOfGroups" className="block text-sm font-medium text-gray-300 mb-2">
              Número de Grupos
            </label>
            <input
              type="number"
              id="numberOfGroups"
              value={numberOfGroups}
              onChange={(e) => setNumberOfGroups(Math.max(2, parseInt(e.target.value)))}
              min="2"
              max={Math.floor(teams.length / 2)}
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
            <p className="mt-2 text-sm text-gray-400">
              Mínimo de 2 times por grupo
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Times Participantes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map(team => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
              >
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-600 rounded-full" />
                )}
                <span className="text-white text-sm">{team.name}</span>
              </div>
            ))}
          </div>
          {teams.length < 2 && (
            <p className="mt-4 text-yellow-400 text-sm">
              É necessário ter pelo menos 2 times cadastrados
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/championships/${championshipId}`)}
            className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || teams.length < 2}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Gerar Partidas'}
          </button>
        </div>
      </form>
    </div>
  );
}