import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onComplete: () => void;
}

export default function ConnectGmail({ onComplete }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { user, refreshUser } = useAuth();

  // Check if user already has Gmail connected
  useEffect(() => {
    if (user?.onboarding_step && user.onboarding_step >= 3) {
      setIsConnected(true);
    }
  }, [user]);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const token = localStorage.getItem('calibre-jwt');
      // Mark as skipped in backend (dev-only: set step to 3 without real Gmail)
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onComplete();
      }
    } finally {
      setIsSkipping(false);
    }
  };

  const handleConnect = async () => {
    const token = localStorage.getItem('calibre-jwt');
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/auth/gmail/start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error starting Gmail OAuth:', err);
    }
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    await refreshUser();
    setIsChecking(false);
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-text">Conecta tu Gmail</h2>
        <p className="text-sm text-text-secondary">
          Calibre necesita acceso a tu Gmail para detectar oportunidades de marca
        </p>
      </div>

      {isConnected ? (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="font-medium">Gmail conectado correctamente</span>
          </div>
          <button
            onClick={onComplete}
            className="w-full py-2 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            Continuar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleConnect}
            className="w-full py-3 px-4 rounded-lg bg-surface-raised border border-border text-text font-medium hover:bg-surface transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            Conectar Gmail
          </button>

          <div className="text-center">
            <button
              onClick={handleCheckConnection}
              disabled={isChecking}
              className="text-sm text-accent hover:underline disabled:opacity-50"
            >
              {isChecking ? 'Verificando...' : 'Ya conecté mi Gmail'}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised/50 text-xs text-text-tertiary space-y-1">
            <p>Calibre solo lee emails para detectar oportunidades de colaboración.</p>
            <p>No envía emails sin tu aprobación.</p>
          </div>

          {/* Dev-only skip button */}
          {import.meta.env.DEV && (
            <button
              onClick={handleSkip}
              disabled={isSkipping}
              className="w-full py-2 px-4 rounded-lg text-xs text-text-tertiary border border-dashed border-border hover:text-text hover:border-text-tertiary transition-colors"
            >
              {isSkipping ? 'Saltando...' : 'Saltar Gmail (solo para testear)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
