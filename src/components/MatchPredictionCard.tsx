import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MatchPredictionCardProps {
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
  className?: string;
}

interface PredictionStats {
  home_percentage: number;
  draw_percentage: number;
  away_percentage: number;
  total_votes: number;
}

export function MatchPredictionCard({ matchId, homeTeam, awayTeam, status, className = '' }: MatchPredictionCardProps) {
  const [stats, setStats] = useState<PredictionStats | null>(null);

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
  }, [matchId]);

  if (status === 'Encerrado' || !stats) {
    return null;
  }

  const calculateOdds = (percentage: number) => {
    // Convert percentage to decimal odds
    // Formula: 100 / percentage (with minimum odds of 1.01)
    const odds = Math.max(100 / (percentage || 100), 1.01);
    return odds.toFixed(2);
  };

  return (
    <div className={`flex items-center justify-between p-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-400">{calculateOdds(stats.home_percentage)}</span>
          <span className="text-yellow-400">{calculateOdds(stats.draw_percentage)}</span>
          <span className="text-blue-400">{calculateOdds(stats.away_percentage)}</span>
        </div>
      </div>
      
      <Link
        to={`/matches/${matchId}`}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        Votar <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}