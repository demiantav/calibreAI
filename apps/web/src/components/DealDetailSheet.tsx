import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Eye, CheckCircle2, CircleDot, Mail, ChevronDown, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { API_BASE_URL, getJsonHeaders } from '@/lib/api-config';
import type { UnifiedDeal, DealStatus } from '@/lib/types';

interface DealDetailSheetProps {
  deal: UnifiedDeal | null;
  onClose: () => void;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
  onSent: () => void;
}

export default function DealDetailSheet({ deal, onClose, onStatusChange, onSent }: DealDetailSheetProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Reset state when deal changes
  useEffect(() => {
    setShowOriginal(false);
    setSendError(null);
  }, [deal?.id]);

  if (!deal) return null;

  const handleSend = async () => {
    if (!deal.logId || !deal.subject || !deal.content) return;
    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pitches/${deal.logId}/send`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ subject: deal.subject, content: deal.content }),
      });
      if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      onSent();
      onClose();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig: Record<DealStatus, { label: string; icon: typeof CircleDot; color: string; bg: string }> = {
    new: { label: 'New', icon: CircleDot, color: 'text-text-tertiary', bg: 'bg-text-tertiary/10' },
    draft_ready: { label: 'Draft Ready', icon: Eye, color: 'text-warning', bg: 'bg-warning/10' },
    sent: { label: 'Sent', icon: Send, color: 'text-accent', bg: 'bg-accent/10' },
    responded: { label: 'Responded', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  };

  const status = statusConfig[deal.status];
  const StatusIcon = status.icon;

  return (
    <Sheet open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-surface border-l border-border overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-lg font-semibold text-text-secondary">
                {deal.brandName.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-lg font-black text-text">{deal.brandName}</SheetTitle>
                <SheetDescription className="text-xs font-bold text-text-tertiary flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {deal.brandEmail}
                </SheetDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${status.bg} ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            {deal.sentAt && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary">
                <Clock className="w-3 h-3" />
                Enviado {new Date(deal.sentAt).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Timeline */}
          <div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-4">Timeline</p>
            <div className="space-y-0">
              <TimelineItem
                icon={Mail}
                iconColor="text-text-tertiary"
                bgColor="bg-text-tertiary/10"
                title="Email recibido"
                subtitle={deal.detectedAt ? new Date(deal.detectedAt).toLocaleDateString('es-ES') : 'Desconocido'}
                isFirst
                isActive={deal.status === 'new'}
              />
              <TimelineItem
                icon={MessageSquare}
                iconColor="text-warning"
                bgColor="bg-warning/10"
                title="Pitch generado"
                subtitle={deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('es-ES') : 'Desconocido'}
                isActive={deal.status === 'draft_ready'}
              />
              <TimelineItem
                icon={Send}
                iconColor="text-accent"
                bgColor="bg-accent/10"
                title="Pitch enviado"
                subtitle={deal.sentAt ? new Date(deal.sentAt).toLocaleDateString('es-ES') : 'Pendiente'}
                isActive={deal.status === 'sent'}
              />
              <TimelineItem
                icon={CheckCircle2}
                iconColor="text-success"
                bgColor="bg-success/10"
                title="Respuesta recibida"
                subtitle={deal.status === 'responded' ? 'Activo' : 'Esperando...'}
                isLast
                isActive={deal.status === 'responded'}
              />
            </div>
          </div>

          {/* Original Email */}
          {(deal.kind === 'lead' || deal.originalEmailFrom || deal.originalEmailSubject || deal.originalEmailSnippet) && (
            <div className="rounded-2xl bg-accent-soft border border-accent-muted/10 overflow-hidden">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center justify-between w-full px-4 py-3 text-xs font-black text-accent-muted"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {deal.kind === 'lead' ? 'Email entrante' : 'Email original de la marca'}
                </div>
                <motion.div animate={{ rotate: showOriginal ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showOriginal && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-3 space-y-2 border-t border-accent-muted/10 pt-3 overflow-hidden"
                  >
                    {/* From */}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-text-tertiary shrink-0" />
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mr-1">From:</span>
                      <span className="text-xs font-bold text-text truncate">
                        {deal.originalEmailFrom || deal.brandEmail}
                      </span>
                    </div>
                    {/* Subject */}
                    {(deal.originalEmailSubject || deal.subject) && (
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider shrink-0 mt-0.5">Subject:</span>
                        <p className="text-xs font-black text-text">{deal.originalEmailSubject || deal.subject}</p>
                      </div>
                    )}
                    {/* Snippet */}
                    {(deal.originalEmailSnippet || deal.snippet) && (
                      <p className="text-[11px] font-medium text-text-secondary leading-relaxed pl-[58px]">
                        {deal.originalEmailSnippet || deal.snippet}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Pitch content */}
          {deal.subject && (
            <div>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-2">Asunto del pitch</p>
              <p className="text-sm font-bold text-text">{deal.subject}</p>
            </div>
          )}
          {deal.content && (
            <div>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-2">Contenido</p>
              <div className="rounded-2xl p-4 bg-surface-hover/70 border border-border/50 text-xs font-medium text-text-secondary leading-relaxed whitespace-pre-wrap">
                {deal.content}
              </div>
            </div>
          )}

          {/* Error */}
          {sendError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
              {sendError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            {deal.status === 'draft_ready' && deal.logId && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-accent hover:brightness-110 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {isSending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
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
                whileTap={{ scale: 0.95 }}
                onClick={() => onStatusChange(deal.logId!, 'responded')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-success hover:brightness-110 transition-all shadow-lg shadow-success/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como respondido
              </motion.button>
            )}

            {deal.status === 'responded' && deal.logId && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onStatusChange(deal.logId!, 'sent')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-text bg-surface-hover border border-border hover:border-accent/30 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                Volver a Sent
              </motion.button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TimelineItem({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  subtitle,
  isFirst,
  isLast,
  isActive,
}: {
  icon: typeof CircleDot;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  isFirst?: boolean;
  isLast?: boolean;
  isActive?: boolean;
}) {
  return (
    <div className="flex gap-3 relative">
      {/* Connector line */}
      {!isFirst && (
        <div className="absolute left-[18px] top-0 bottom-1/2 w-px bg-border/50 -translate-x-1/2" />
      )}
      {!isLast && (
        <div className="absolute left-[18px] top-1/2 bottom-0 w-px bg-border/50 -translate-x-1/2" />
      )}

      <div className={`relative z-10 w-9 h-9 rounded-full ${bgColor} flex items-center justify-center shrink-0 ${isActive ? 'ring-2 ring-offset-2 ring-offset-surface ring-accent/30' : ''}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="pb-5 pt-1">
        <p className={`text-xs font-bold ${isActive ? 'text-text' : 'text-text-tertiary'}`}>{title}</p>
        <p className="text-[10px] font-medium text-text-tertiary">{subtitle}</p>
      </div>
    </div>
  );
}
