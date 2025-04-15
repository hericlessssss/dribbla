import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
}

export function BackButton({ fallbackPath = '/', label = 'Voltar' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center text-green-500 hover:text-green-400 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      {label}
    </button>
  );
}