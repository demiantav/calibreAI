import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PulseContextType {
  lastPulseAt: number | null;
  triggerPulse: () => Promise<void>;
}

const PulseCtx = createContext<PulseContextType>({
  lastPulseAt: null,
  triggerPulse: async () => {},
});

export function PulseProvider({ children }: { children: ReactNode }) {
  const [lastPulseAt, setLastPulseAt] = useState<number | null>(null);

  const triggerPulse = useCallback(async () => {
    setLastPulseAt(Date.now());
    await fetch('http://localhost:8080/pulse').catch(() => {});
  }, []);

  return (
    <PulseCtx.Provider value={{ lastPulseAt, triggerPulse }}>
      {children}
    </PulseCtx.Provider>
  );
}

export const usePulse = () => useContext(PulseCtx);
