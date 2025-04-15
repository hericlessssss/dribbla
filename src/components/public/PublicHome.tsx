import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Search, Calendar, Users, ArrowRight, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Championship {
  id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  logo_url: string | null;
  _count?: {
    teams: number;
    matches: number;
  };
}

export function PublicHome() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchChampionships() {
      try {
        const { data, error } = await supabase
          .from('championships')
          .select(`
            *,
            teams(count),
            matches(count)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const championshipsWithCount = data.map(championship => ({
          ...championship,
          _count: {
            teams: championship.teams[0].count,
            matches: championship.matches[0].count
          }
        }));

        setChampionships(championshipsWithCount);
      } catch (err) {
        setError('Erro ao carregar campeonatos');
      } finally {
        setLoading(false);
      }
    }

    fetchChampionships();
  }, []);

  const filteredChampionships = championships.filter(championship =>
    championship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    championship.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-800/50 to-transparent border-b border-gray-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
              Viva a Emoção do Futebol Local
            </h1>
            <p className="text-xl text-gray-400 mb-8 animate-fade-in delay-100">
              Organize, acompanhe e celebre os melhores momentos do seu campeonato
            </p>
            <div className="relative max-w-xl mx-auto animate-fade-in delay-200">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar campeonatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm text-white rounded-lg border border-gray-700/50 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Championships Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChampionships.map((championship) => (
                <Link
                  key={championship.id}
                  to={`/championships/${championship.id}`}
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-700/50"
                >
                  <div className="aspect-video bg-gray-700/50 flex items-center justify-center relative overflow-hidden">
                    {championship.logo_url ? (
                      <img
                        src={championship.logo_url}
                        alt={championship.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <Trophy className="w-16 h-16 text-gray-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/75 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                        {championship.name}
                      </h2>
                      <span className="inline-block px-3 py-1 bg-green-900/50 text-green-300 text-sm rounded-full">
                        {championship.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>
                          {format(new Date(championship.start_date), "dd 'de' MMMM", { locale: ptBR })} até{' '}
                          {format(new Date(championship.end_date), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>{championship._count?.teams || 0} times participantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-green-500" />
                        <span>{championship._count?.matches || 0} partidas programadas</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end text-green-500 group-hover:text-green-400">
                      <span className="text-sm font-medium">Ver detalhes</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredChampionships.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  Nenhum campeonato encontrado
                </h3>
                <p className="text-gray-400">
                  {searchTerm
                    ? 'Tente outros termos de busca'
                    : 'Não há campeonatos ativos no momento'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sponsors Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Megaphone className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Patrocínios e Apoios</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-8">
              <p className="text-gray-400 text-center">
                Espaço disponível para anunciantes
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-8">
              <h3 className="text-lg font-medium text-white mb-4">
                Anuncie no Dribbla
              </h3>
              <p className="text-gray-400 mb-6">
                Alcance milhares de amantes do futebol. Torne-se um patrocinador e faça parte dessa história.
              </p>
              <a
                href="mailto:anuncie@dribbla.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                Quero Anunciar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}