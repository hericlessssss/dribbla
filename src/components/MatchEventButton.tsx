import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface MatchEventButtonProps {
  matchId: string;
  isActive: boolean;
  isOrganizer: boolean;
}

export function MatchEventButton({ matchId, isActive, isOrganizer }: MatchEventButtonProps) {
  const navigate = useNavigate();

  if (!isOrganizer || !isActive) return null;

  return (
    <button
      onClick={() => navigate(`events/new`)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Novo Evento
    </button>
  );
}