import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onComplete: () => void;
}

export default function FirstPulse({ onComplete }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Guard: if user somehow got here without YouTube, redirect back
  const { user } = useAuth();
  if (!user?.youtube_channel_id) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-secondary">Necesitás conectar tu canal de YouTube primero.</p>
        <button
          onClick={() => navigate('/onboarding?step=1')}
          className="py-2 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
        >
          Volver a conectar YouTube
        </button>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setError('');
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('calibre-jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/pulse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar análisis');

      // Start polling like Dashboard does
      pollForResults();
    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const pollForResults = () => {
    let attempts = 0;
    const maxAttempts = 60; // 60 * 2s = 2 minutes

    const check = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        setIsAnalyzing(false);
        // Even if not complete, go to dashboard
        onComplete();
        return;
      }

      try {
        const token = localStorage.getItem('calibre-jwt');
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/logs?type=agent_summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const logs = await res.json();
        if (Array.isArray(logs) && logs.length > 0) {
          // Analysis complete!
          setIsAnalyzing(false);
          onComplete();
          return;
        }
      } catch {
        // Ignore polling errors
      }

      setTimeout(check, 2000);
    };

    check();
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-text">Primer análisis</h2>
        <p className="text-sm text-text-secondary">
          Vamos a analizar tu canal por primera vez. Esto puede tardar unos minutos.
        </p>
      </div>

      {isAnalyzing ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          <p className="text-text-secondary">Analizando tu contenido...</p>
          <p className="text-xs text-text-tertiary">Revisando métricas, emails y generando insights</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            className="w-full py-3 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            Analizar mi canal
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2 px-4 rounded-lg text-sm text-text-secondary hover:text-text transition-colors"
          >
            Saltar por ahora →
          </button>
        </div>
      )}
    </div>
  );
}
