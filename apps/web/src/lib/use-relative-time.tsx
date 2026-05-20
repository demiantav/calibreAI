import { useEffect, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';

function compute(isoString: string | undefined | null): string {
  if (!isoString) return '';
  try {
    const then = Temporal.Instant.from(isoString);
    const elapsed = Temporal.Now.instant().since(then);
    const mins = elapsed.total('minutes');
    const hours = elapsed.total('hours');
    const days = elapsed.total('days');

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${Math.floor(mins)}m ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (days < 2) return 'Yesterday';
    return `${Math.floor(days)}d ago`;
  } catch {
    return isoString || '';
  }
}

export function useRelativeTime(isoString: string | undefined | null): string {
  const [label, setLabel] = useState(() => compute(isoString));

  useEffect(() => {
    setLabel(compute(isoString));
    const interval = setInterval(() => setLabel(compute(isoString)), 30000);
    return () => clearInterval(interval);
  }, [isoString]);

  return label;
}

export function RelativeTime({ iso }: { iso: string | undefined | null }) {
  const label = useRelativeTime(iso);
  return <>{label}</>;
}
