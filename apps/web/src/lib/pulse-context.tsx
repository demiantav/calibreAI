import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api-config';

export type PulseStatus = 'idle' | 'pulsing' | 'success' | 'error';

interface PulseContextType {
  lastPulseAt: number | null;
  pulseStatus: PulseStatus;
  setPulseStatus: (status: PulseStatus) => void;
  triggerPulse: () => Promise<void>;
}

const PulseCtx = createContext<PulseContextType>({
  lastPulseAt: null,
  pulseStatus: 'idle',
  setPulseStatus: () => {},
  triggerPulse: async () => {},
});

export function PulseProvider({ children }: { children: ReactNode }) {
  const [lastPulseAt, setLastPulseAt] = useState<number | null>(null);
  const [pulseStatus, setPulseStatus] = useState<PulseStatus>('idle');

  const triggerPulse = useCallback(async () => {
    setPulseStatus('pulsing');
    setLastPulseAt(Date.now());
    await fetch(`${API_BASE_URL}/pulse`, {
      headers: getAuthHeaders(),
    }).catch(() => {});
  }, []);

  return (
    <PulseCtx.Provider value={{ lastPulseAt, pulseStatus, setPulseStatus, triggerPulse }}>
      {children}
    </PulseCtx.Provider>
  );
}

export const usePulse = () => useContext(PulseCtx);
