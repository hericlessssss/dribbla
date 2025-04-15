import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Shuffle, AlertTriangle, X } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { supabase } from '../lib/supabase';
import { Notification } from './Notification';

export function MatchDraw() {
  const { championshipId } = useParams();
  const { teams } = useTeamStore();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formatType, setFormatType] = useState<'points' | 'groups'>('points');
  const [homeAndAway, setHomeAndAway] = useState(true);
  const [numberOfGroups, setNumberOfGroups] = useState(2);

  const handleDrawMatches = async () => {
    if (!championshipId) return;
    setLoading(true);

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

      // First, check if a match format already exists
      const { data: existingFormat } = await supabase
        .from('tournament_formats')
        .select('id')
        .eq('championship_id', championshipId)
        .single();

      // Update or insert the match format
      const { error: formatError } = await supabase
        .from('tournament_formats')
        .upsert({
          championship_id: championshipId,
          format_type: formatType,
          number_of_groups: formatType === 'groups' ? numberOfGroups : null,
          teams_per_group: formatType === 'groups' ? Math.floor(teams.length / numberOfGroups) : null,
          teams_advancing: formatType === 'groups' ? Math.floor(teams.length / numberOfGroups) : null,
          has_knockout_stage: false,
          ...(existingFormat && { id: existingFormat.id })
        }, {
          onConflict: 'championship_id'
        });

      if (formatError) throw formatError;

      if (formatType === 'groups') {
        // Generate group stage matches
        const { error: groupError } = await supabase.rpc('generate_group_stage_matches', {
          p_championship_id: championshipId,
          p_number_of_groups: numberOfGroups,
          p_home_and_away: homeAndAway
        });

        if (groupError) throw groupError;
      } else {
        // Generate regular matches
        const { error: matchError } = await supabase.rpc('generate_championship_matches', {
          p_championship_id: championshipId,
          p_format_type: formatType,
          p_home_and_away: homeAndAway
        });

        if (matchError) throw matchError;
      }

      setNotification({
        type: 'success',
        message: 'Partidas sorteadas com sucesso!'
      });
      setShowModal(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao sortear partidas'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <Shuffle className="w-4 h-4" />
        Sortear Partidas
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Sortear Partidas</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teams.length < 2 ? (
              <div className="flex items-center gap-3 text-yellow-400 mb-4 bg-yellow-400/10 p-4 rounded-lg relative">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm flex-1">É necessário ter pelo menos 2 times cadastrados</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formato do Campeonato
                  </label>
                  <div className="grid grid-cols-2 gap-4">
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
                        Todos os times se enfrentam entre si
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
                        Times divididos em grupos
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
                        <span className="text-white text-sm truncate">{team.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDrawMatches}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sorteando...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4" />
                        Sortear
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}