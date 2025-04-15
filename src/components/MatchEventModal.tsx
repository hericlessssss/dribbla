import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMatchStore, Match } from '../store/matchStore';
import { useTeamStore } from '../store/teamStore';
import { usePlayerStore } from '../store/playerStore';

interface MatchEventModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

const EVENT_TYPES = {
  'Gol': '⚽',
  'Assistência': '👟',
  'Cartão Amarelo': '🟨',
  'Cartão Vermelho': '🟥',
  'Substituição': '🔄'
};

export function MatchEventModal({ match, isOpen, onClose }: MatchEventModalProps) {
  const { createMatchEvent, timer } = useMatchStore();
  const { players: homePlayers } = usePlayerStore();
  const { players: awayPlayers } = usePlayerStore();
  const [selectedTeam, setSelectedTeam] = useState<string>(match.home_team_id);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedAssistPlayer, setSelectedAssistPlayer] = useState<string>('');
  const [eventType, setEventType] = useState<keyof typeof EVENT_TYPES>('Gol');

  // Don't render the modal if we don't have a valid match ID
  if (!isOpen || !match.id || match.id === 'new') return null;

  useEffect(() => {
    // Only fetch players if we have valid team IDs and the modal is open
    if (isOpen) {
      if (match.home_team_id && match.home_team_id !== 'new') {
        usePlayerStore.getState().fetchPlayers(match.home_team_id);
      }
      if (match.away_team_id && match.away_team_id !== 'new') {
        usePlayerStore.getState().fetchPlayers(match.away_team_id);
      }
    }
  }, [match.home_team_id, match.away_team_id, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMatchEvent({
        match_id: match.id,
        team_id: selectedTeam,
        player_id: selectedPlayer,
        assist_player_id: eventType === 'Gol' ? selectedAssistPlayer : undefined,
        event_type: eventType,
        minute: timer || 0
      });
      
      onClose();
      setSelectedPlayer('');
      setSelectedAssistPlayer('');
      setEventType('Gol');
    } catch (error) {
      console.error('Error creating match event:', error);
    }
  };

  const currentPlayers = selectedTeam === match.home_team_id ? homePlayers : awayPlayers;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Novo Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Time
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              <option value={match.home_team_id}>{match.home_team?.name}</option>
              <option value={match.away_team_id}>{match.away_team?.name}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as keyof typeof EVENT_TYPES)}
              className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              {Object.entries(EVENT_TYPES).map(([type, icon]) => (
                <option key={type} value={type}>
                  {icon} {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Jogador
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              required
              className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              <option value="">Selecione um jogador</option>
              {currentPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.jersey_number} - {player.name}
                </option>
              ))}
            </select>
          </div>

          {eventType === 'Gol' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Assistência (opcional)
              </label>
              <select
                value={selectedAssistPlayer}
                onChange={(e) => setSelectedAssistPlayer(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="">Sem assistência</option>
                {currentPlayers
                  .filter(player => player.id !== selectedPlayer)
                  .map(player => (
                    <option key={player.id} value={player.id}>
                      {player.jersey_number} - {player.name}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Adicionar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}