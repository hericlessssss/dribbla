import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Trophy, Calendar, MapPin, ArrowLeft, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MatchPrediction } from '../MatchPrediction';

interface Match {
  id: string;
  home_team: { name: string; logo_url: string | null };
  away_team: { name: string; logo_url: string | null };
  venue: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: string;
  phase: string;
  championship: {
    id: string;
    name: string;
    category: string;
  };
}

export function PublicMatch() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;

      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(name, logo_url),
            away_team:teams!matches_away_team_id_fkey(name, logo_url),
            championship:championships(id, name, category)
          `)
          .eq('id', matchId)
          .single();

        if (error) throw error;
        setMatch(data);
      } catch (err) {
        setError('Erro ao carregar partida');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-gray-400">Carregando partida...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold">Erro ao carregar partida</h1>
        <p className="text-gray-400">{error || 'Partida não encontrada'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link
          to={`/championships/${match.championship.id}`}
          className="inline-flex items-center text-green-500 hover:text-green-400 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para {match.championship.name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Details */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{match.championship.name}</h1>
                  <p className="text-gray-400">{match.championship.category}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  match.status === 'Em Andamento' || match.status === 'Segundo Tempo'
                    ? 'bg-green-900/50 text-green-300 animate-pulse'
                    : match.status === 'Encerrado'
                    ? 'bg-gray-700/50 text-gray-300'
                    : 'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {match.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center mb-8">
                {/* Home Team */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    {match.home_team.logo_url ? (
                      <img
                        src={match.home_team.logo_url}
                        alt={match.home_team.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield className="w-full h-full text-gray-600" />
                    )}
                  </div>
                  <h2 className="text-lg font-medium">{match.home_team.name}</h2>
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="text-5xl font-bold mb-4">
                    {match.home_score} - {match.away_score}
                  </div>
                  <div className="text-sm text-gray-400">
                    {match.phase}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    {match.away_team.logo_url ? (
                      <img
                        src={match.away_team.logo_url}
                        alt={match.away_team.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield className="w-full h-full text-gray-600" />
                    )}
                  </div>
                  <h2 className="text-lg font-medium">{match.away_team.name}</h2>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(match.match_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Match Prediction */}
            <MatchPrediction
              matchId={match.id}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              status={match.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}