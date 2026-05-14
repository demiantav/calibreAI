import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, Send, Sparkles, Mail, DollarSign, TrendingUp } from 'lucide-react';
import type { LogEntry, PitchDraft } from '@/lib/types';

export default function Pitches() {
  const [pitches, setPitches] = useState<PitchDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPitches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8080/logs');
        if (response.ok) {
          const data: LogEntry[] = await response.json();
          const pitchLogs = data.filter((log) => log.type === 'pitch_draft');
          const extracted = pitchLogs.map((log) => log.content as PitchDraft);
          if (extracted.length > 0) setPitches(extracted);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchPitches();
  }, []);

  return (
    <motion.div className="min-h-screen p-8 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Pitches</h1>
          <span className="px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">{pitches.length}</span>
        </div>
        <p className="text-sm font-bold text-text-tertiary mt-1 ml-4">Sponsorship proposals crafted by your AI</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pitches.map((pitch, index) => {
          const isLead = pitch.status === 'lead';
          return (
            <motion.div
              key={pitch.brandEmail + index}
              className="glass-card rounded-[24px] p-6 relative overflow-hidden group"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent-muted-soft border border-accent-muted/10 flex items-center justify-center text-base font-black text-accent-muted">
                    {pitch.brandName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-text truncate">{pitch.brandName}</h3>
                    <p className="flex items-center gap-1 text-xs font-bold text-text-tertiary">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pitch.brandEmail}</span>
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black shrink-0 ${
                  isLead ? 'bg-accent-soft text-accent' : 'bg-success/10 text-success'
                }`}>
                  {isLead ? <CircleDot className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  {isLead ? 'Lead' : 'Sent'}
                </span>
              </div>

              <p className="text-sm font-black text-text mb-2 truncate">{pitch.pitchSubject}</p>
              <p className="text-xs font-medium text-text-tertiary leading-relaxed line-clamp-3">{pitch.pitchContent}</p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary">
                  <DollarSign className="w-3.5 h-3.5 text-accent" />
                  <span className="text-text-secondary">Rate pending</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-text-secondary">High match</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {pitches.length === 0 && !isLoading && (
        <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-14 h-14 rounded-2xl bg-surface-hover/70 border border-border/50 mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-text-tertiary" />
          </div>
          <p className="text-base font-black text-text">No pitches yet</p>
          <p className="text-sm font-bold text-text-tertiary mt-1">Your AI agent will generate them based on your content</p>
        </motion.div>
      )}
    </motion.div>
  );
}
