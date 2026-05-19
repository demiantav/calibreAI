import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot, Send, Sparkles, Mail, DollarSign, TrendingUp, Eye, CheckCircle2, FileText, Inbox } from 'lucide-react';
import type { LogEntry, PitchDraft, PitchEntry } from '@/lib/types';
import SendPitchModal from '@/components/SendPitchModal';

export default function Pitches() {
  const [entries, setEntries] = useState<PitchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<{ draft: PitchDraft; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'draft_ready' | 'sent' | 'responded'>('draft_ready');

  const tabs = [
    { key: 'draft_ready' as const, label: 'Pending', icon: Eye },
    { key: 'sent' as const, label: 'Sent', icon: Send },
    { key: 'responded' as const, label: 'Responded', icon: CheckCircle2 },
  ];

  const filteredEntries = useMemo(
    () => entries.filter((e) => e.draft.status === activeTab),
    [entries, activeTab]
  );

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/logs');
      if (response.ok) {
        const data: LogEntry[] = await response.json();
        const pitchLogs = data.filter((log) => log.type === 'pitch_draft');
        const extracted: PitchEntry[] = pitchLogs
          .map((log) => ({
            id: log.id,
            draft: log.content as PitchDraft,
            created_at: log.created_at,
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (extracted.length > 0) setEntries(extracted);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPitches(); }, []);

  const statusConfig: Record<string, { label: string; icon: typeof CircleDot; className: string }> = {
    draft_ready: { label: 'Draft Ready', icon: Eye, className: 'bg-warning/10 text-warning' },
    sent: { label: 'Sent', icon: CheckCircle2, className: 'bg-success/10 text-success' },
    lead: { label: 'Lead', icon: CircleDot, className: 'bg-accent-soft text-accent' },
    responded: { label: 'Responded', icon: Send, className: 'bg-accent-soft text-accent' },
  };

  return (
    <motion.div className="min-h-screen p-8 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Pitches</h1>
          <span className="px-3 py-1 rounded-full bg-accent-muted-soft text-accent-muted text-xs font-black">{filteredEntries.length}</span>
        </div>
        <p className="text-sm font-bold text-text-tertiary mt-1 ml-4">Sponsorship proposals crafted by your AI</p>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-5 ml-4 bg-surface-hover rounded-2xl p-1 border border-border/50 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = entries.filter((e) => e.draft.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab.key
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-text-tertiary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-hover text-text-tertiary'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEntries.map((entry, index) => {
          const pitch = entry.draft;
          const status = statusConfig[pitch.status] || statusConfig.lead;
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={entry.id}
              className="glass-card rounded-[24px] p-6 relative overflow-hidden group"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-accent-muted-soft border border-accent-muted/10 flex items-center justify-center text-base font-black text-accent-muted shrink-0">
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
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black shrink-0 ${status.className}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
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

              {/* Draft ready — show action button */}
              {pitch.status === 'draft_ready' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPitch({ draft: pitch, id: entry.id })}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-accent hover:brightness-110 transition-all shadow-lg shadow-accent/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Review & Send
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && !isLoading && (
        <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-14 h-14 rounded-2xl bg-surface-hover/70 border border-border/50 mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
            {activeTab === 'draft_ready' ? (
              <Inbox className="w-6 h-6 text-text-tertiary" />
            ) : (
              <FileText className="w-6 h-6 text-text-tertiary" />
            )}
          </div>
          {activeTab === 'draft_ready' ? (
            <>
              <p className="text-base font-black text-text">No pending pitches</p>
              <p className="text-sm font-bold text-text-tertiary mt-1">Your AI agent will generate them based on your content</p>
            </>
          ) : (
            <>
              <p className="text-base font-black text-text">No {activeTab} pitches</p>
              <p className="text-sm font-bold text-text-tertiary mt-1">They will appear here after you review and send them</p>
            </>
          )}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedPitch && (
          <SendPitchModal
            pitch={selectedPitch.draft}
            pitchId={selectedPitch.id}
            onClose={() => setSelectedPitch(null)}
            onSent={fetchPitches}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
