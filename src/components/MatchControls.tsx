import React from 'react';
import { Play, Pause, StopCircle, X, Check } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';

interface MatchControlsProps {
  matchId: string;
  status: string;
  isOrganizer: boolean;
}

export function MatchControls({ matchId, status, isOrganizer }: MatchControlsProps) {
  const { startMatch, pauseMatch, resumeMatch, endMatch } = useMatchStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = React.useState(false);

  const canStart = status === 'Agendado';
  const canPause = status === 'Em Andamento';
  const canResume = status === 'Intervalo';
  const canEnd = ['Em Andamento', 'Segundo Tempo', 'Intervalo'].includes(status);

  const handleMatchControl = async (action: 'start' | 'pause' | 'resume' | 'end') => {
    if (!isOrganizer) return;
    
    setLoading(true);
    setError(null);

    try {
      switch (action) {
        case 'start':
          await startMatch(matchId);
          break;
        case 'pause':
          await pauseMatch(matchId);
          break;
        case 'resume':
          await resumeMatch(matchId);
          break;
        case 'end':
          await endMatch(matchId);
          setShowEndConfirmation(false);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status da partida');
    } finally {
      setLoading(false);
    }
  };

  if (!isOrganizer) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {canStart && (
          <button
            onClick={() => handleMatchControl('start')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Iniciar Partida</span>
          </button>
        )}

        {canPause && (
          <button
            onClick={() => handleMatchControl('pause')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Intervalo</span>
          </button>
        )}

        {canResume && (
          <button
            onClick={() => handleMatchControl('resume')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">2º Tempo</span>
          </button>
        )}

        {canEnd && !showEndConfirmation && (
          <button
            onClick={() => setShowEndConfirmation(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <StopCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        )}
      </div>

      {showEndConfirmation && (
        <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg animate-fade-in">
          <span className="text-white">Confirmar encerramento da partida?</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleMatchControl('end')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
            <button
              onClick={() => setShowEndConfirmation(false)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}