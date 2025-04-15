import React from 'react';

interface MatchEvent {
  id: string;
  minute: number;
  event_type: string;
  team_id: string;
  player: {
    name: string;
    jersey_number: number;
  };
  assist_player?: {
    name: string;
    jersey_number: number;
  };
}

interface MatchEventsProps {
  events: MatchEvent[];
  homeTeamId: string;
}

export function MatchEvents({ events, homeTeamId }: MatchEventsProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Gol':
        return '⚽';
      case 'Cartão Amarelo':
        return '🟨';
      case 'Cartão Vermelho':
        return '🟥';
      case 'Substituição':
        return '🔄';
      default:
        return '📝';
    }
  };

  if (events.length === 0) {
    return (
      <p className="text-center text-gray-400 py-4">
        Nenhum evento registrado
      </p>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Home Team Events */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Time Mandante</h4>
        {sortedEvents
          .filter(event => event.team_id === homeTeamId)
          .map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg"
            >
              <span className="text-gray-400 font-mono w-12">
                {event.minute}'
              </span>
              <span className="text-xl">
                {getEventIcon(event.event_type)}
              </span>
              <div className="flex-1">
                <span className="text-white">
                  {event.player.name} 
                  <span className="text-gray-400 text-sm ml-1">
                    #{event.player.jersey_number}
                  </span>
                </span>
                {event.assist_player && event.event_type === 'Gol' && (
                  <span className="text-gray-400 text-sm ml-2">
                    (Assistência: {event.assist_player.name} #{event.assist_player.jersey_number})
                  </span>
                )}
                {event.assist_player && event.event_type === 'Substituição' && (
                  <span className="text-gray-400 text-sm ml-2">
                    (Saiu: {event.assist_player.name} #{event.assist_player.jersey_number})
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Away Team Events */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Time Visitante</h4>
        {sortedEvents
          .filter(event => event.team_id !== homeTeamId)
          .map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg"
            >
              <span className="text-gray-400 font-mono w-12">
                {event.minute}'
              </span>
              <span className="text-xl">
                {getEventIcon(event.event_type)}
              </span>
              <div className="flex-1">
                <span className="text-white">
                  {event.player.name} 
                  <span className="text-gray-400 text-sm ml-1">
                    #{event.player.jersey_number}
                  </span>
                </span>
                {event.assist_player && event.event_type === 'Gol' && (
                  <span className="text-gray-400 text-sm ml-2">
                    (Assistência: {event.assist_player.name} #{event.assist_player.jersey_number})
                  </span>
                )}
                {event.assist_player && event.event_type === 'Substituição' && (
                  <span className="text-gray-400 text-sm ml-2">
                    (Saiu: {event.assist_player.name} #{event.assist_player.jersey_number})
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}