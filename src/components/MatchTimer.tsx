import React, { useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';

interface MatchTimerProps {
  matchId: string;
  status: string;
}

export function MatchTimer({ matchId, status }: MatchTimerProps) {
  const { timer, setTimer, updateMatchTime } = useMatchStore();

  const isRunning = ['Em Andamento', 'Segundo Tempo'].includes(status);
  const maxTime = status === 'Em Andamento' ? 45 : 90;
  const startTime = status === 'Segundo Tempo' ? 45 : 0;

  const updateTimer = useCallback(() => {
    if (isRunning && timer !== null) {
      const newTime = timer + 1;
      if (newTime <= maxTime) {
        setTimer(newTime);
        updateMatchTime(matchId, newTime);
      }
    }
  }, [timer, status, matchId, setTimer, updateMatchTime, isRunning, maxTime]);

  useEffect(() => {
    // Initialize timer when status changes
    if (status === 'Em Andamento') {
      setTimer(0);
    } else if (status === 'Segundo Tempo') {
      setTimer(45);
    }
  }, [status, setTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timer !== null) {
      interval = setInterval(updateTimer, 60000); // Update every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timer, updateTimer]);

  if (!isRunning && !timer) return null;

  return (
    <div className="flex items-center gap-2 text-lg font-semibold text-white">
      <Clock className="w-5 h-5" />
      <span>{timer ?? startTime}'</span>
    </div>
  );
}