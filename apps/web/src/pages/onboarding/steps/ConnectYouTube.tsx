import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onComplete: () => void;
}

export default function ConnectYouTube({ onComplete }: Props) {
  const [channelUrl, setChannelUrl] = useState('');
  const [preview, setPreview] = useState<{ channelId: string; channelName: string; subscriberCount?: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleValidate = async () => {
    setError('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('calibre-jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/auth/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channelUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al validar canal');
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) onComplete();
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-text">Conecta tu canal de YouTube</h2>
        <p className="text-sm text-text-secondary">Pegá la URL de tu canal para que Calibre analice tus métricas</p>
      </div>

      <div className="space-y-3">
        <input
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://www.youtube.com/@midudev"
          className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-border text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          onClick={handleValidate}
          disabled={!channelUrl || isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Validando...' : 'Validar canal'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="p-4 rounded-lg bg-surface-raised border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {preview.channelName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-text">{preview.channelName}</p>
              {preview.subscriberCount && (
                <p className="text-sm text-text-secondary">{parseInt(preview.subscriberCount).toLocaleString()} suscriptores</p>
              )}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-2 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Confirmar y continuar
          </button>
        </div>
      )}

      <p className="text-xs text-text-tertiary text-center">
        Formatos soportados: youtube.com/@handle, /c/nombre, /channel/UC...
      </p>
    </div>
  );
}
