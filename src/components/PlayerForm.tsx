import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { User } from 'lucide-react';

const POSITIONS = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Volante',
  'Meio Campo',
  'Atacante'
];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PlayerForm() {
  const navigate = useNavigate();
  const { teamId, championshipId } = useParams();
  const { createPlayer } = usePlayerStore();
  
  const [formData, setFormData] = useState({
    name: '',
    position: 'Goleiro',
    birth_date: '',
    jersey_number: '',
    photo_url: '',
    team_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Validate teamId when component mounts
    if (!teamId || !UUID_REGEX.test(teamId)) {
      navigate('/dashboard/teams', { 
        state: { 
          error: 'ID do time inválido. Por favor, selecione um time válido.' 
        }
      });
      return;
    }
    
    setFormData(prev => ({ ...prev, team_id: teamId }));
  }, [teamId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.team_id || !UUID_REGEX.test(formData.team_id)) {
      setError('ID do time inválido. Por favor, recarregue a página e tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPlayer({
        ...formData,
        jersey_number: parseInt(formData.jersey_number, 10)
      });

      // Navigate based on context
      if (championshipId) {
        navigate(`/dashboard/championships/${championshipId}/teams/${teamId}`);
      } else {
        navigate(`/dashboard/teams/${teamId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBack = () => {
    if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/teams/${teamId}`);
    } else {
      navigate(`/dashboard/teams/${teamId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8 text-green-500" />
        <h1 className="text-3xl font-bold text-white">Novo Jogador</h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Jogador
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="Ex: Neymar Jr."
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
            Posição
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
          >
            {POSITIONS.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-300 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-300 mb-2">
              Número da Camisa
            </label>
            <input
              type="number"
              id="jersey_number"
              name="jersey_number"
              value={formData.jersey_number}
              onChange={handleChange}
              required
              min="1"
              max="99"
              className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="photo_url" className="block text-sm font-medium text-gray-300 mb-2">
            URL da Foto (opcional)
          </label>
          <input
            type="url"
            id="photo_url"
            name="photo_url"
            value={formData.photo_url}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-lg bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500"
            placeholder="https://exemplo.com/foto.jpg"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Adicionar Jogador'}
          </button>
        </div>
      </form>
    </div>
  );
}