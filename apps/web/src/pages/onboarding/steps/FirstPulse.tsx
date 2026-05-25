import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api-config';

const WAIT_TIMEOUT_MS = 120000; // 2 min safety timeout

interface Props {
  onComplete: () => void;
}

export default function FirstPulse({ onComplete }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [elapsedLabel, setElapsedLabel] = useState('');
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user, updateUser } = useAuth();

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
    setElapsedLabel('');

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setElapsedLabel(`${elapsed}s`);
    }, 1000);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WAIT_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}/pulse?wait=true`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      clearInterval(timerRef.current!);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar análisis');

      await updateUser({ onboarding_completed: true, onboarding_step: 4 });
      onComplete();
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearInterval(timerRef.current!);

      if (err.name === 'AbortError') {
        setError('El análisis está tardando más de lo esperado. Podés ir al Dashboard mientras termina.');
      } else {
        setError(err.message || 'Error al iniciar análisis');
      }
      setIsAnalyzing(false);
    }
  };

  const handleSkip = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await updateUser({ onboarding_completed: true, onboarding_step: 4 });
    navigate('/');
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-text">Primer análisis</h2>
        <p className="text-sm text-text-secondary">
          Vamos a analizar tu canal por primera vez. Podés seguir al Dashboard mientras el análisis se ejecuta.
        </p>
      </div>

      {isAnalyzing ? (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          <p className="text-text-secondary">
            Analizando tu canal
            {elapsedLabel && <span className="text-text-tertiary"> · {elapsedLabel}</span>}
          </p>
          <p className="text-xs text-text-tertiary">Esto puede tomar unos segundos</p>
          {parseInt(elapsedLabel) >= 15 && (
            <button
              onClick={handleSkip}
              className="py-2 px-4 rounded-lg text-sm text-text-secondary hover:text-text transition-colors"
            >
              Ir al Dashboard ya →
            </button>
          )}
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
