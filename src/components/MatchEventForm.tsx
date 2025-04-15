import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';
import { usePlayerStore } from '../store/playerStore';

const EVENT_TYPES = {
  'Gol': '⚽',
  'Cartão Amarelo': '🟨',
  'Cartão Vermelho': '🟥',
  'Substituição': '🔄'
} as const;

type EventType = keyof typeof EVENT_TYPES;

export function MatchEventForm() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { matches, fetchMatches, createMatchEvent, timer } = useMatchStore();
  const { players, fetchPlayers } = usePlayerStore();
  
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedAssistPlayer, setSelectedAssistPlayer] = useState<string>('');
  const [selectedSubstitutedPlayer, setSelectedSubstitutedPlayer] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('Gol');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (matchId) {
      fetchMatches();
    }
  }, [matchId, fetchMatches]);

  const match = matches.find(m => m.id === matchId);

  // Fetch players when team is selected
  useEffect(() => {
    if (selectedTeam) {
      fetchPlayers(selectedTeam);
    }
  }, [selectedTeam, fetchPlayers]);

  // Reset player selections when team changes
  useEffect(() => {
    setSelectedPlayer('');
    setSelectedAssistPlayer('');
    setSelectedSubstitutedPlayer('');
  }, [selectedTeam]);

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center text-red-400">Partida não encontrada</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedTeam || !selectedPlayer) {
        throw new Error('Selecione o time e o jogador');
      }

      if (eventType === 'Substituição' && !selectedSubstitutedPlayer) {
        throw new Error('Selecione o jogador que será substituído');
      }

      await createMatchEvent({
        match_id: matchId!,
        team_id: selectedTeam,
        player_id: selectedPlayer,
        assist_player_id: eventType === 'Gol' ? selectedAssistPlayer || undefined : 
                         eventType === 'Substituição' ? selectedSubstitutedPlayer : undefined,
        event_type: eventType,
        minute: timer || 0
      });
      
      navigate(`/dashboard/matches/${matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(`/dashboard/matches/${matchId}`)}
        className="flex items-center text-green-500 hover:text-green-400 mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para a Partida
      </button>

      <div className="flex items-center gap-3 mb-8">
        <Flag className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">Novo Evento</h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Time
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Selecione um time</option>
            <option value={match.home_team_id}>
              {match.home_team?.name} (Mandante)
            </option>
            <option value={match.away_team_id}>
              {match.away_team?.name} (Visitante)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Evento
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
          >
            {Object.entries(EVENT_TYPES).map(([type, icon]) => (
              <option key={type} value={type}>
                {icon} {type}
              </option>
            ))}
          </select>
        </div>

        {eventType === 'Substituição' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Jogador que Sai
              </label>
              <select
                value={selectedSubstitutedPlayer}
                onChange={(e) => setSelectedSubstitutedPlayer(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
                disabled={!selectedTeam}
              >
                <option value="">Selecione o jogador que sai</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    #{player.jersey_number} - {player.name} ({player.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Jogador que Entra
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
                disabled={!selectedTeam}
              >
                <option value="">Selecione o jogador que entra</option>
                {players
                  .filter(player => player.id !== selectedSubstitutedPlayer)
                  .map(player => (
                    <option key={player.id} value={player.id}>
                      #{player.jersey_number} - {player.name} ({player.position})
                    </option>
                  ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Jogador
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
              disabled={!selectedTeam}
            >
              <option value="">Selecione um jogador</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  #{player.jersey_number} - {player.name} ({player.position})
                </option>
              ))}
            </select>
          </div>
        )}

        {eventType === 'Gol' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assistência (opcional)
            </label>
            <select
              value={selectedAssistPlayer}
              onChange={(e) => setSelectedAssistPlayer(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
              disabled={!selectedTeam}
            >
              <option value="">Sem assistência</option>
              {players
                .filter(player => player.id !== selectedPlayer)
                .map(player => (
                  <option key={player.id} value={player.id}>
                    #{player.jersey_number} - {player.name} ({player.position})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/matches/${matchId}`)}
            className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Criar Evento'}
          </button>
        </div>
      </form>
    </div>
  );
}