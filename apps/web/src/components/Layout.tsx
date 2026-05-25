import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AgentIndicator } from './AgentIndicator';
import { PulseButton } from './PulseButton';
import { usePulse } from '@/lib/pulse-context';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { LogEntry } from '@/lib/types';

const LOGS_ENDPOINT = '/logs';

export default function Layout({ children }: { children: ReactNode }) {
  const { pulseStatus, setPulseStatus, triggerPulse } = usePulse();
  const { data: logs, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  useEffect(() => {
    if (pulseStatus === 'success' || pulseStatus === 'error') {
      const timer = setTimeout(() => setPulseStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [pulseStatus, setPulseStatus]);

  // Re-fetch after pulse completes
  useEffect(() => {
    if (pulseStatus === 'success') {
      refetch();
    }
  }, [pulseStatus, refetch]);

  const logsCount = logs?.length ?? 0;
  const pitchCount = logs?.filter((log) => log.type === 'pitch_draft').length ?? 0;

  return (
    <div className="flex min-h-screen bg-bg selection:bg-accent/20 selection:text-accent">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-[300px] mr-0 lg:mr-4 my-0 lg:my-4 min-h-screen lg:min-h-[calc(100vh-2rem)] pt-14 lg:pt-4 px-5 lg:px-8 xl:px-12">
        <AgentIndicator logsCount={logsCount} pitchCount={pitchCount} />
        {children}
      </main>

      {/* PulseButton: visible on all devices, positioned for thumb reach on mobile */}
      <div className="fixed bottom-8 right-8 z-50 lg:bottom-8 lg:right-8">
        <PulseButton onPulse={triggerPulse} status={pulseStatus} />
      </div>
    </div>
  );
}
