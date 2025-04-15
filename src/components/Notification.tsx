import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Notification({ type, message, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full flex items-center gap-3 p-4 rounded-lg shadow-lg animate-slide-in ${
        type === 'success' ? 'bg-green-900/90 text-green-100' : 'bg-red-900/90 text-red-100'
      }`}
      role="alert"
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:opacity-80 transition-opacity"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}