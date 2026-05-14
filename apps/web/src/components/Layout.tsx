import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { AgentIndicator } from './AgentIndicator';
import { PulseButton } from './PulseButton';

export default function Layout({ children }: { children: ReactNode }) {
  const [pulseCount, setPulseCount] = useState(0);

  const handlePulse = async () => {
    try {
      await fetch('http://localhost:8080/pulse');
      setPulseCount((c) => c + 1);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex min-h-screen bg-bg selection:bg-accent/20 selection:text-accent">
      <Sidebar />
      <main className="flex-1 ml-[300px] mr-4 my-4 min-h-[calc(100vh-2rem)] pt-4">
        <AgentIndicator logsCount={12} pitchCount={3} />
        {children}
      </main>

      <div className="fixed bottom-8 right-8 z-50">
        <PulseButton onPulse={handlePulse} />
      </div>
    </div>
  );
}
