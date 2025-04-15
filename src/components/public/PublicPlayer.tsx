import React from 'react';
import { useParams } from 'react-router-dom';

export function PublicPlayer() {
  const { playerId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Player Details</h1>
        {/* Player content will be implemented later */}
        <p className="text-gray-600">Loading player information...</p>
      </div>
    </div>
  );
}