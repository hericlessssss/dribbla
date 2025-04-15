import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChampionshipStore } from '../store/championshipStore';
import { Trophy } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  'Amador',
  'Profissional',
  'Sub-17',
  'Sub-20',
  'Feminino',
  'Master',
  'Veterano'
];

export function ChampionshipForm() {
  const navigate = useNavigate();
  const { championshipId } = useParams();
  const { createChampionship, updateChampionship, getChampionshipById } = useChampionshipStore();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Amador',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    rules: '',
    logo_url: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChampionship = async () => {
      if (championshipId) {
        try {
          const championship = await getChampionshipById(championshipId);
          if (championship) {
            setFormData({
              name: championship.name,
              category: championship.category,
              start_date: format(new Date(championship.start_date), 'yyyy-MM-dd'),
              end_date: format(new Date(championship.end_date), 'yyyy-MM-dd'),
              rules: championship.rules,
              logo_url: championship.logo_url || '',
              is_active: championship.is_active
            });
          }
        } catch (err) {
          setError('Erro ao carregar dados do campeonato');
        }
      }
    };

    loadChampionship();
  }, [championshipId, getChampionshipById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (championshipId) {
        await updateChampionship(championshipId, formData);
        navigate(`/dashboard/championships/${championshipId}`);
      } else {
        await createChampionship(formData);
        navigate('/dashboard/championships');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">
          {championshipId ? 'Editar Campeonato' : 'Novo Campeonato'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Campeonato
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="Ex: Copa Regional 2025"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-2">
              Data de Início
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-2">
              Data de Término
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rules" className="block text-sm font-medium text-gray-300 mb-2">
            Regulamento
          </label>
          <textarea
            id="rules"
            name="rules"
            value={formData.rules}
            onChange={handleChange}
            required
            rows={8}
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500 resize-none"
            placeholder="Descreva as regras do campeonato..."
          />
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
            URL do Logo (opcional)
          </label>
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="https://exemplo.com/logo.png"
          />
        </div>

        {championshipId && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="is_active" className="text-gray-300">
              Campeonato ativo
            </label>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(championshipId ? `/dashboard/championships/${championshipId}` : '/dashboard/championships')}
            className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : championshipId ? 'Atualizar Campeonato' : 'Criar Campeonato'}
          </button>
        </div>
      </form>
    </div>
  );
}