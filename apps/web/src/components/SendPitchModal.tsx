import { useState } from 'react';
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
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`http://localhost:8080/api/pitches/${pitchId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      });
      if (!res.ok) throw new Error('Failed to send');
      onSent();
      onClose();
    } catch (err) {
      console.error(err);
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
        className="relative glass-card rounded-[24px] p-7 w-full max-w-lg z-10"
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
              <h2 className="text-lg font-display font-black text-text tracking-tight">Send Pitch</h2>
              <p className="text-xs font-bold text-text-tertiary">to {pitch.brandName}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-hover border border-border/50 flex items-center justify-center text-text-tertiary hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
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

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2.5 rounded-2xl text-xs font-black text-accent bg-accent-soft hover:bg-accent-soft/80 transition-all"
          >
            {isEditing ? 'Done Editing' : 'Edit'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-accent hover:brightness-110 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
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
