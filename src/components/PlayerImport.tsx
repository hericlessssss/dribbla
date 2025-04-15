import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useTeamStore } from '../store/teamStore';
import { Notification } from './Notification';

interface CSVPlayer {
  name: string;
  position: string;
  birth_date: string;
  jersey_number: string;
  team_name: string;
}

const VALID_POSITIONS = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Volante',
  'Meio Campo',
  'Atacante'
];

export function PlayerImport() {
  const { championshipId } = useParams();
  const navigate = useNavigate();
  const { createPlayer } = usePlayerStore();
  const { teams, fetchTeams } = useTeamStore();
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
  } | null>(null);

  React.useEffect(() => {
    if (championshipId) {
      fetchTeams(championshipId);
    }
  }, [championshipId, fetchTeams]);

  const validatePlayer = (player: CSVPlayer, lineNumber: number): string[] => {
    const errors: string[] = [];

    if (!player.name?.trim()) {
      errors.push(`Linha ${lineNumber}: Nome do jogador é obrigatório`);
    }

    if (!VALID_POSITIONS.includes(player.position)) {
      errors.push(`Linha ${lineNumber}: Posição inválida "${player.position}". Posições válidas: ${VALID_POSITIONS.join(', ')}`);
    }

    if (!player.birth_date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push(`Linha ${lineNumber}: Data de nascimento inválida. Use o formato YYYY-MM-DD`);
    }

    const jerseyNumber = parseInt(player.jersey_number);
    if (isNaN(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
      errors.push(`Linha ${lineNumber}: Número da camisa deve ser entre 1 e 99`);
    }

    if (!player.team_name?.trim()) {
      errors.push(`Linha ${lineNumber}: Nome do time é obrigatório`);
    } else {
      const team = teams.find(t => t.name.toLowerCase() === player.team_name.toLowerCase());
      if (!team) {
        errors.push(`Linha ${lineNumber}: Time "${player.team_name}" não encontrado no campeonato`);
      }
    }

    return errors;
  };

  const parseCSV = (text: string): CSVPlayer[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {} as any);
      });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStats(null);
    setNotification(null);

    try {
      const text = await file.text();
      const players = parseCSV(text);
      
      // Validate all players first
      const errors: string[] = [];
      players.forEach((player, index) => {
        const playerErrors = validatePlayer(player, index + 2); // +2 because we skip header and 0-based index
        errors.push(...playerErrors);
      });

      if (errors.length > 0) {
        setNotification({
          type: 'error',
          message: `Erros de validação encontrados:\n${errors.join('\n')}`
        });
        return;
      }

      // Start import
      const stats = {
        total: players.length,
        processed: 0,
        success: 0,
        failed: 0
      };

      for (const player of players) {
        try {
          const team = teams.find(t => t.name.toLowerCase() === player.team_name.toLowerCase());
          if (!team) continue;

          await createPlayer({
            name: player.name,
            position: player.position,
            birth_date: player.birth_date,
            jersey_number: parseInt(player.jersey_number),
            team_id: team.id
          });

          stats.success++;
        } catch (error) {
          stats.failed++;
          console.error(`Error importing player ${player.name}:`, error);
        }
        stats.processed++;
        setImportStats({ ...stats });
      }

      setNotification({
        type: 'success',
        message: `Importação concluída! ${stats.success} jogadores importados com sucesso, ${stats.failed} falhas.`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao processar arquivo CSV. Verifique o formato e tente novamente.'
      });
    } finally {
      setImporting(false);
    }
  }, [teams, createPlayer]);

  const handleBack = () => {
    if (championshipId) {
      navigate(`/dashboard/championships/${championshipId}/teams`);
    } else {
      navigate('/dashboard/teams');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={handleBack}
        className="flex items-center text-green-500 hover:text-green-400 mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </button>

      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Importar Jogadores</h1>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="whitespace-pre-wrap">{notification.message}</div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">
                Selecione um arquivo CSV com os dados dos jogadores
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer ${
                  importing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {importing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Selecionar Arquivo
                  </>
                )}
              </label>
            </div>
          </div>

          {importStats && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Progresso da Importação</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processando</span>
                  <span className="text-white">{importStats.processed} de {importStats.total}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(importStats.processed / importStats.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Sucesso: {importStats.success}</span>
                  <span className="text-red-400">Falhas: {importStats.failed}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Formato do CSV</h3>
            <p className="text-gray-400 mb-4">
              O arquivo CSV deve conter as seguintes colunas:
            </p>
            <div className="bg-gray-700/30 rounded-lg p-4 font-mono text-sm">
              <code className="text-green-400">
                name,position,birth_date,jersey_number,team_name
              </code>
              <p className="mt-2 text-gray-400">Exemplo:</p>
              <code className="text-gray-300">
                João Silva,Goleiro,1995-03-15,1,Santos FC<br />
                Pedro Santos,Atacante,1998-07-22,9,SE Palmeiras
              </code>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-400">
              <p>• Posições válidas: {VALID_POSITIONS.join(', ')}</p>
              <p>• Data de nascimento no formato: YYYY-MM-DD</p>
              <p>• Número da camisa: entre 1 e 99</p>
              <p>• Nome do time deve corresponder exatamente ao cadastrado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}