import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Trophy, Calendar, MapPin, ArrowLeft, Shield, AlertTriangle, Loader2, Search } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface Championship {
  id: string;
  name: string;
  category: string;
}

export function PublicAllMatches() {
  const { championshipId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!championshipId) return;

      try {
        // Fetch championship details
        const { data: champData, error: champError } = await supabase
          .from('championships')
          .select('id, name, category')
          .eq('id', championshipId)
          .single();

        if (champError) throw champError;
        setChampionship(champData);

        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(name, logo_url),
            away_team:teams!matches_away_team_id_fkey(name, logo_url)
          `)
          .eq('championship_id', championshipId)
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        setMatches(matchesData || []);
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [championshipId]);

  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.home_team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'live':
        return ['Em Andamento', 'Intervalo', 'Segundo Tempo'].includes(match.status);
      case 'upcoming':
        return match.status === 'Agendado';
      case 'finished':
        return match.status === 'Encerrado';
      default:
        return true;
    }
  });

  // Group matches by date
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const date = format(new Date(match.match_date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-gray-400">Carregando partidas...</p>
        </div>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold">Erro ao carregar dados</h1>
        <p className="text-gray-400">{error}</p>
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
          to={`/championships/${championship.id}`}
          className="inline-flex items-center text-green-500 hover:text-green-400 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para {championship.name}
        </Link>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">{championship.name}</h1>
              <p className="text-gray-400">{championship.category}</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar partidas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('live')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'live'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Ao Vivo
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'upcoming'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Próximas
                </button>
                <button
                  onClick={() => setFilter('finished')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'finished'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Encerradas
                </button>
              </div>
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-8">
            {Object.entries(groupedMatches).map(([date, matches]) => (
              <div key={date}>
                <h3 className="text-lg font-medium text-white mb-4">
                  {isSameDay(new Date(date), new Date()) 
                    ? 'Hoje'
                    : format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match) => (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="block bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400">{match.phase}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          match.status === 'Em Andamento' || match.status === 'Segundo Tempo'
                            ? 'bg-green-900/50 text-green-300 animate-pulse'
                            : match.status === 'Encerrado'
                            ? 'bg-gray-700/50 text-gray-300'
                            : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {match.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {match.home_team.logo_url ? (
                            <img
                              src={match.home_team.logo_url}
                              alt={match.home_team.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Shield className="w-8 h-8 text-gray-600" />
                          )}
                          <span className="text-white">{match.home_team.name}</span>
                        </div>
                        <span className="text-xl font-bold text-white">
                          {match.home_score}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {match.away_team.logo_url ? (
                            <img
                              src={match.away_team.logo_url}
                              alt={match.away_team.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Shield className="w-8 h-8 text-gray-600" />
                          )}
                          <span className="text-white">{match.away_team.name}</span>
                        </div>
                        <span className="text-xl font-bold text-white">
                          {match.away_score}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(match.match_date), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{match.venue}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {filteredMatches.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  Nenhuma partida encontrada
                </h3>
                <p className="text-gray-400">
                  {searchTerm
                    ? 'Tente outros termos de busca'
                    : 'Não há partidas para exibir'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}