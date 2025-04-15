import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, X } from 'lucide-react';

interface MatchPredictionProps {
  matchId: string;
  homeTeam: {
    name: string;
    logo_url: string | null;
  };
  awayTeam: {
    name: string;
    logo_url: string | null;
  };
  status: string;
}

interface PredictionStats {
  home_percentage: number;
  draw_percentage: number;
  away_percentage: number;
  total_votes: number;
}

export function MatchPrediction({ matchId, homeTeam, awayTeam, status }: MatchPredictionProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user has already voted
  useEffect(() => {
    const checkVote = () => {
      const vote = localStorage.getItem(`match_prediction_${matchId}`);
      if (vote) setHasVoted(true);
    };
    checkVote();
  }, [matchId]);

  // Fetch current stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_prediction_stats', { p_match_id: matchId });

        if (error) throw error;
        setStats(data);
      } catch (err) {
        console.error('Error fetching prediction stats:', err);
      }
    };

    fetchStats();
  }, [matchId, hasVoted]);

  const handleVote = async (prediction: 'home' | 'draw' | 'away') => {
    if (hasVoted || status === 'Encerrado') return;
    
    setLoading(true);
    setError(null);

    try {
      // Get client IP
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { error } = await supabase
        .from('match_predictions')
        .insert([{
          match_id: matchId,
          prediction,
          ip_address: ip
        }]);

      if (error) throw error;

      // Save to localStorage
      localStorage.setItem(`match_prediction_${matchId}`, prediction);
      setHasVoted(true);

      // Refetch stats
      const { data: newStats, error: statsError } = await supabase
        .rpc('get_prediction_stats', { p_match_id: matchId });

      if (statsError) throw statsError;
      setStats(newStats);
    } catch (err) {
      setError('Você já votou nesta partida');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'Encerrado') {
    return null;
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Quem vai vencer?
        </h3>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!hasVoted ? (
        <div className="grid grid-cols-3 gap-4">
          {/* Home Team */}
          <button
            onClick={() => handleVote('home')}
            disabled={loading}
            className="flex flex-col items-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {homeTeam.logo_url ? (
              <img
                src={homeTeam.logo_url}
                alt={homeTeam.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-600 rounded-full" />
            )}
            <span className="text-sm text-center text-white font-medium">
              {homeTeam.name}
            </span>
          </button>

          {/* Draw */}
          <button
            onClick={() => handleVote('draw')}
            disabled={loading}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-300">X</span>
            </div>
            <span className="text-sm text-center text-white font-medium">
              Empate
            </span>
          </button>

          {/* Away Team */}
          <button
            onClick={() => handleVote('away')}
            disabled={loading}
            className="flex flex-col items-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {awayTeam.logo_url ? (
              <img
                src={awayTeam.logo_url}
                alt={awayTeam.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-600 rounded-full" />
            )}
            <span className="text-sm text-center text-white font-medium">
              {awayTeam.name}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-green-400 font-medium">
            Obrigado por votar!
          </p>

          {stats && (
            <div className="space-y-4">
              {/* Home Team */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{homeTeam.name}</span>
                  <span className="text-white font-medium">{stats.home_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stats.home_percentage}%` }}
                  />
                </div>
              </div>

              {/* Draw */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Empate</span>
                  <span className="text-white font-medium">{stats.draw_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${stats.draw_percentage}%` }}
                  />
                </div>
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{awayTeam.name}</span>
                  <span className="text-white font-medium">{stats.away_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${stats.away_percentage}%` }}
                  />
                </div>
              </div>

              <div className="text-center text-sm text-gray-400 mt-4">
                Total de votos: {stats.total_votes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}