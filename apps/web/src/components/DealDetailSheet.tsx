import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Eye,
  CheckCircle2,
  CircleDot,
  Mail,
  ChevronDown,
  MessageSquare,
  Clock,
  ArrowRight,
  Edit3,
  Save,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { API_BASE_URL, getJsonHeaders } from '@/lib/api-config';
import type { UnifiedDeal, DealStatus } from '@/lib/types';

interface DealDetailSheetProps {
  deal: UnifiedDeal | null;
  onClose: () => void;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
  onSent: () => void;
}

/* ------------------------------------------------------------------ */

export default function DealDetailSheet({
  deal,
  onClose,
  onStatusChange,
  onSent,
}: DealDetailSheetProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  /* status update state */
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  /* editable pitch state */
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedContent, setEditedContent] = useState('');

  /* reset everything when deal changes */
  useEffect(() => {
    setShowOriginal(false);
    setSendError(null);
    setUpdateError(null);
    setIsUpdating(false);
    setIsEditing(false);
    if (deal) {
      setEditedSubject(deal.subject || '');
      setEditedContent(deal.content || '');
    }
  }, [deal?.id]);

  const handleStatusChange = useCallback(
    async (newStatus: DealStatus) => {
      if (!deal?.logId) return;
      setIsUpdating(true);
      setUpdateError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/pitches/${deal.logId}/status`, {
          method: 'PATCH',
          headers: getJsonHeaders(),
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed: ${res.status}`);
        }
        onClose();
        onSent();
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : 'Error al actualizar');
      } finally {
        setIsUpdating(false);
      }
    },
    [deal?.logId, onClose, onSent]
  );

  const handleSend = useCallback(async () => {
    if (!deal?.logId) return;
    const subject = isEditing ? editedSubject : (deal.subject || '');
    const content = isEditing ? editedContent : (deal.content || '');
    if (!subject || !content) return;

    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pitches/${deal.logId}/send`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ subject, content }),
      });
      if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      onSent();
      onClose();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setIsSending(false);
    }
  }, [deal, isEditing, editedSubject, editedContent, onSent, onClose]);

  if (!deal) return null;

  const statusCfg = STATUS_MAP[deal.status];
  const StatusIcon = statusCfg.icon;

  const activeSubject = isEditing ? editedSubject : (deal.subject || '');
  const activeContent = isEditing ? editedContent : (deal.content || '');

  /* ── render ── */
  return (
    <Sheet open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-bg border-l border-border p-0 flex flex-col overflow-hidden"
      >
        {/* ═════ HEADER ═════ */}
        <header className="shrink-0 px-6 pt-6 pb-5 border-b border-border/60">
          <div className="flex items-center gap-4 min-w-0 pr-10">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-xl font-bold text-accent shrink-0">
              {deal.brandName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-text truncate leading-tight">
                {deal.brandName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-text-secondary">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{deal.brandEmail}</span>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 mt-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </span>
            {deal.sentAt && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                <Clock className="w-3.5 h-3.5" />
                Enviado {new Date(deal.sentAt).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </header>

        {/* ═════ SCROLLABLE BODY ═════ */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* ── Timeline ── */}
          <section>
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-5">
              Timeline
            </h3>
            <div className="space-y-0">
              <TimelineStep
                icon={Mail}
                color="text-text-tertiary"
                bg="bg-text-tertiary/10"
                title="Email recibido"
                date={deal.detectedAt}
                isFirst
                isDone
                isActive={deal.status === 'new'}
              />
              <TimelineStep
                icon={MessageSquare}
                color="text-warning"
                bg="bg-warning/10"
                title="Pitch generado"
                date={deal.createdAt}
                isDone={deal.status !== 'new'}
                isActive={deal.status === 'draft_ready'}
              />
              <TimelineStep
                icon={Send}
                color="text-accent"
                bg="bg-accent/10"
                title="Pitch enviado"
                date={deal.sentAt}
                isDone={deal.status === 'sent' || deal.status === 'responded'}
                isActive={deal.status === 'sent'}
              />
              <TimelineStep
                icon={CheckCircle2}
                color="text-success"
                bg="bg-success/10"
                title="Respuesta recibida"
                date={deal.status === 'responded' ? deal.sentAt : undefined}
                isLast
                isDone={deal.status === 'responded'}
                isActive={deal.status === 'responded'}
              />
            </div>
          </section>

          {/* ── Original Email (collapsible) ── */}
          {(deal.kind === 'lead' ||
            deal.originalEmailFrom ||
            deal.originalEmailSubject ||
            deal.originalEmailSnippet) && (
            <section className="rounded-2xl border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setShowOriginal((v) => !v)}
                className="flex items-center justify-between w-full px-5 py-4 text-sm font-semibold text-text-secondary hover:text-text transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-accent-muted" />
                  {deal.kind === 'lead'
                    ? 'Email entrante'
                    : 'Email original de la marca'}
                </div>
                <motion.div
                  animate={{ rotate: showOriginal ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {showOriginal && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="border-t border-border/60"
                  >
                    <div className="px-5 py-4 space-y-3">
                      <EmailField label="From" value={deal.originalEmailFrom || deal.brandEmail} />
                      {(deal.originalEmailSubject || deal.subject) && (
                        <EmailField
                          label="Asunto"
                          value={deal.originalEmailSubject || deal.subject || ''}
                        />
                      )}
                      {(deal.originalEmailSnippet || deal.snippet) && (
                        <p className="text-sm text-text-secondary leading-relaxed pl-[52px]">
                          {deal.originalEmailSnippet || deal.snippet}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* ── Pitch Content (editable) ── */}
          {deal.status === 'draft_ready' && (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                  Pitch redactado por IA
                </h3>
                <button
                  onClick={() => {
                    if (isEditing) {
                      /* save → just toggle off, state already synced */
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-raised border border-border hover:border-accent/30 text-text-secondary hover:text-text transition-colors"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </>
                  )}
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Asunto
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border text-sm font-medium text-text placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border/60 text-sm font-semibold text-text">
                    {activeSubject || 'Sin asunto'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Contenido
                </label>
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border text-sm font-medium text-text placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all outline-none resize-y leading-relaxed"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border/60 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap min-h-[160px]">
                    {activeContent || 'Sin contenido'}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Sent / Responded read-only view ── */}
          {(deal.status === 'sent' || deal.status === 'responded') && (
            <section className="space-y-5">
              <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                Pitch enviado
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Asunto
                </label>
                <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border/60 text-sm font-semibold text-text">
                  {deal.subject || 'Sin asunto'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Contenido
                </label>
                <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border/60 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap min-h-[160px]">
                  {deal.content || 'Sin contenido'}
                </div>
              </div>
            </section>
          )}

          {/* ── Última respuesta de la marca ── */}
          {deal.status === 'responded' && deal.latestResponseSnippet && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                Última respuesta de la marca
              </h3>
              <div className="rounded-2xl p-5 bg-success/5 border border-success/20">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {deal.latestResponseSnippet}
                </p>
                {deal.latestResponseAt && (
                  <p className="text-xs text-text-tertiary mt-3">
                    Recibido {new Date(deal.latestResponseAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Errors ── */}
          <AnimatePresence>
            {sendError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium"
              >
                {sendError}
              </motion.div>
            )}
            {updateError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium"
              >
                {updateError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═════ FOOTER ACTIONS ═════ */}
        <footer className="shrink-0 px-6 py-5 border-t border-border/60 bg-surface/50">
          <div className="flex items-center gap-3">
            {deal.status === 'draft_ready' && deal.logId && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={isSending || !activeSubject || !activeContent}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-accent hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? 'Enviando...' : 'Enviar Pitch'}
              </motion.button>
            )}

            {deal.status === 'sent' && deal.logId && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStatusChange('responded')}
                disabled={isUpdating}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-success hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isUpdating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isUpdating ? 'Actualizando...' : 'Marcar como respondido'}
              </motion.button>
            )}

            {deal.status === 'responded' && deal.logId && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStatusChange('sent')}
                disabled={isUpdating}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold text-text bg-surface-raised border border-border hover:border-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isUpdating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isUpdating ? 'Actualizando...' : 'Volver a Sent'}
              </motion.button>
            )}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

/* ================================================================== */
/*  Timeline Step                                                      */
/* ================================================================== */

function TimelineStep({
  icon: Icon,
  color,
  bg,
  title,
  date,
  isFirst,
  isLast,
  isDone,
  isActive,
}: {
  icon: typeof CircleDot;
  color: string;
  bg: string;
  title: string;
  date?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isDone?: boolean;
  isActive?: boolean;
}) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Pendiente';

  return (
    <div className="flex gap-4 relative">
      {/* connector */}
      {!isFirst && (
        <div className="absolute left-[22px] top-0 bottom-1/2 w-px bg-border/40 -translate-x-1/2" />
      )}
      {!isLast && (
        <div className="absolute left-[22px] top-1/2 bottom-0 w-px bg-border/40 -translate-x-1/2" />
      )}

      {/* dot */}
      <div
        className={`relative z-10 w-11 h-11 rounded-full ${bg} flex items-center justify-center shrink-0 border-2 border-transparent ${
          isActive ? 'border-accent/40' : ''
        } ${isDone ? '' : 'opacity-60'}`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>

      {/* text */}
      <div className="pb-6 pt-1.5">
        <p
          className={`text-sm font-semibold ${
            isActive ? 'text-text' : isDone ? 'text-text-secondary' : 'text-text-tertiary'
          }`}
        >
          {title}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">{formattedDate}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Email Field                                                        */
/* ================================================================== */

function EmailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider w-12 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-medium text-text break-all">{value}</span>
    </div>
  );
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const STATUS_MAP: Record<
  DealStatus,
  { label: string; icon: typeof CircleDot; color: string; bg: string }
> = {
  new: {
    label: 'Nuevo',
    icon: CircleDot,
    color: 'text-text-tertiary',
    bg: 'bg-text-tertiary/10',
  },
  draft_ready: {
    label: 'Borrador',
    icon: Eye,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  sent: {
    label: 'Enviado',
    icon: Send,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  responded: {
    label: 'Respondido',
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
  },
};
