import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { AgentIndicator } from './AgentIndicator';
import { PulseButton } from './PulseButton';
import { usePulse } from '@/lib/pulse-context';

export default function Layout({ children }: { children: ReactNode }) {
  const { pulseStatus, setPulseStatus, triggerPulse } = usePulse();
  const [logsCount, setLogsCount] = useState(0);
  const [pitchCount, setPitchCount] = useState(0);

  useEffect(() => {
    if (pulseStatus === 'success' || pulseStatus === 'error') {
      const timer = setTimeout(() => setPulseStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [pulseStatus, setPulseStatus]);

  // Fetch real counts for AgentIndicator
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('http://localhost:8080/logs');
        if (res.ok) {
          const data = await res.json();
          setLogsCount(data.length);
          const pitches = data.filter((log: any) => log.type === 'pitch_draft');
          setPitchCount(pitches.length);
        }
      } catch {
        // silent fail — keep defaults
      }
    };
    fetchCounts();
  }, [pulseStatus]); // Re-fetch after pulse to update counts

  return (
    <div className="flex min-h-screen bg-bg selection:bg-accent/20 selection:text-accent">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-[300px] mr-0 lg:mr-4 my-0 lg:my-4 min-h-screen lg:min-h-[calc(100vh-2rem)] pt-14 lg:pt-4 px-4 lg:px-0">
        <AgentIndicator logsCount={logsCount} pitchCount={pitchCount} />
        {children}
      </main>

      {/* PulseButton: hidden on mobile, visible on desktop */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <PulseButton onPulse={triggerPulse} status={pulseStatus} />
      </div>
    </div>
  );
}
