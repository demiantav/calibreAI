import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Sparkles, Mail, ChevronDown, MessageSquare } from 'lucide-react';
import type { PitchDraft } from '@/lib/types';

interface SendPitchModalProps {
  pitch: PitchDraft;
  pitchId: string;
  onClose: () => void;
  onSent: () => void;
}

export default function SendPitchModal({ pitch, pitchId, onClose, onSent }: SendPitchModalProps) {
  const [subject, setSubject] = useState(pitch.pitchSubject || '');
  const [content, setContent] = useState(pitch.pitchContent || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus the close button when modal opens
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSend = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/pitches/${pitchId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      });
      if (!res.ok) throw new Error(`Failed to send: ${res.status} ${res.statusText}`);
      onSent();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send pitch. Please try again.';
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-pitch-title"
        className="relative rounded-[24px] p-7 w-full max-w-lg z-10 bg-surface border border-border shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="send-pitch-title" className="text-lg font-sans font-bold text-text tracking-tight">Send Pitch</h2>
              <p className="text-xs font-bold text-text-tertiary">to {pitch.brandName}</p>
            </div>
          </div>
          <motion.button
            ref={closeButtonRef}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Close dialog"
            className="w-11 h-11 rounded-xl bg-surface-hover border border-border/50 flex items-center justify-center text-text-tertiary hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="space-y-4">
          {/* To field */}
          <div>
            <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-1.5">To</p>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-hover/70 border border-border/50">
              <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
              <span className="text-sm font-bold text-text truncate">{pitch.brandEmail}</span>
            </div>
          </div>

          {/* Original Email — collapsible (show if ANY original email data exists) */}
          {(pitch.originalEmailFrom || pitch.originalEmailSubject || pitch.originalEmailSnippet) && (
            <div className="rounded-2xl bg-accent-soft border border-accent-muted/10 overflow-hidden">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center justify-between w-full px-4 py-3 text-xs font-black text-accent-muted"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Original Email
                </div>
                <motion.div
                  animate={{ rotate: showOriginal ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              {showOriginal && (
                <div className="px-4 pb-3 space-y-2 border-t border-accent-muted/10 pt-3">
                  {pitch.originalEmailFrom && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-text-tertiary shrink-0" />
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mr-1">From:</span>
                      <span className="text-xs font-bold text-text truncate">{pitch.originalEmailFrom}</span>
                    </div>
                  )}
                  {pitch.originalEmailSubject && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider shrink-0 mt-0.5">Subject:</span>
                      <p className="text-xs font-black text-text">{pitch.originalEmailSubject}</p>
                    </div>
                  )}
                  {pitch.originalEmailSnippet && (
                    <p className="text-[11px] font-medium text-text-secondary leading-relaxed line-clamp-3 pl-[58px]">{pitch.originalEmailSnippet}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-1.5">Subject</p>
            <input
              type="text"
              value={subject}
              readOnly={!isEditing}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-text bg-surface-hover/70 border border-border/50 transition-all ${
                isEditing ? 'focus:outline-none focus:border-accent/30' : ''
              }`}
            />
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-1.5">Message</p>
            <textarea
              value={content}
              readOnly={!isEditing}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-medium text-text-secondary bg-surface-hover/70 border border-border/50 resize-none transition-all ${
                isEditing ? 'focus:outline-none focus:border-accent/30' : ''
              }`}
            />
          </div>
        </div>

        {/* Error message */}
        {sendError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            {sendError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-3 rounded-2xl text-sm font-semibold text-accent bg-accent-soft hover:bg-accent-soft/80 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-[44px]"
          >
            {isEditing ? 'Done Editing' : 'Edit'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-accent hover:brightness-110 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white min-h-[44px]"
          >
            {isSending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
