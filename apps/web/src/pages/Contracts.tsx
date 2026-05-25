import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Upload, AlertTriangle, ShieldCheck, AlertOctagon, DollarSign, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { RelativeTime } from '@/lib/use-relative-time';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api-config';
import type { LogEntry, ContractAudit } from '@/lib/types';

const LOGS_ENDPOINT = '/logs?type=contract_audit';

export default function Contracts() {
  const [isUploading, setIsUploading] = useState(false);
  const [auditResult, setAuditResult] = useState<ContractAudit | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const { data: logs, isLoading, error, refetch } = useApiFetch<LogEntry[]>(LOGS_ENDPOINT);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Solo se aceptan archivos PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo no debe superar los 10MB');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setAuditResult(null);

    const formData = new FormData();
    formData.append('contract', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/contracts/audit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al analizar contrato');

      setAuditResult(data);
      refetch();
    } catch (err: any) {
      setUploadError(err.message || 'Error al analizar el contrato');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const riskConfig = {
    low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: 'Bajo riesgo' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Riesgo medio' },
    high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertOctagon, label: 'Alto riesgo' },
  };

  if (isLoading) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <header className="mb-10 lg:mb-12">
          <div className="h-8 bg-surface-raised rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-surface-raised rounded animate-pulse w-72" />
        </header>
        <SkeletonCard className="mb-8" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ErrorState message={error} onRetry={refetch} />
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen p-4 lg:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-10 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black text-text tracking-tight">Auditor de Contratos</h1>
        </div>
        <p className="text-sm font-light text-text-tertiary/60">Analiza contratos de marcas con IA antes de firmar</p>
      </header>

      {/* Upload Zone */}
      <div
        className={`rounded-[28px] p-8 lg:p-10 mb-8 border-2 border-dashed transition-all cursor-pointer ${
          dragActive
            ? 'border-accent bg-accent/5'
            : 'border-border bg-surface hover:border-border-accent/40 hover:bg-surface-hover'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('contract-upload')?.click()}
      >
        <input
          id="contract-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-base font-semibold text-text mb-1">
              {isUploading ? 'Analizando contrato...' : 'Arrastra un PDF aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-text-tertiary">Solo archivos PDF, máximo 10MB</p>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
          <p className="text-sm text-text-secondary">Analizando cláusulas con IA...</p>
        </div>
      )}

      {uploadError && (
        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {auditResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-10 space-y-6"
          >
            {/* Risk Level Header */}
            <div className={`rounded-[24px] p-6 lg:p-8 border ${riskConfig[auditResult.riskLevel].border} ${riskConfig[auditResult.riskLevel].bg}`}>
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = riskConfig[auditResult.riskLevel].icon;
                  return <Icon className={`w-10 h-10 ${riskConfig[auditResult.riskLevel].color}`} />;
                })()}
                <div>
                  <p className={`text-lg font-bold ${riskConfig[auditResult.riskLevel].color}`}>
                    {riskConfig[auditResult.riskLevel].label}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">{auditResult.summary}</p>
                </div>
              </div>
            </div>

            {/* Contract Type & Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[24px] p-6 bg-surface border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-accent-muted" />
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Tipo de contrato</span>
                </div>
                <p className="text-lg font-semibold text-text capitalize">{auditResult.contractType}</p>
              </div>
              {auditResult.estimatedFairRate && (
                <div className="rounded-[24px] p-6 bg-surface border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Fee estimado justo</span>
                  </div>
                  <p className="text-lg font-semibold text-text">${auditResult.estimatedFairRate.toLocaleString()} USD</p>
                </div>
              )}
            </div>

            {/* Red Flags */}
            {auditResult.redFlags.length > 0 && (
              <div className="rounded-[24px] p-6 lg:p-8 bg-surface border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-text">Cláusulas problemáticas ({auditResult.redFlags.length})</h3>
                </div>
                <ul className="space-y-3">
                  {auditResult.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                      <span className="text-sm text-text-secondary">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negotiation Points */}
            {auditResult.suggestedNegotiationPoints.length > 0 && (
              <div className="rounded-[24px] p-6 lg:p-8 bg-surface border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <MessageSquare className="w-5 h-5 text-accent-muted" />
                  <h3 className="text-base font-semibold text-text">Sugerencias de negociación</h3>
                </div>
                <ul className="space-y-3">
                  {auditResult.suggestedNegotiationPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised">
                      <span className="text-accent text-sm mt-0.5">💡</span>
                      <span className="text-sm text-text-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {logs && logs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-display font-bold text-text tracking-tight mb-6">Historial de análisis</h2>
          <div className="space-y-4">
            {logs.map((log) => {
              const audit = log.content as ContractAudit;
              return (
                <div key={log.id} className="rounded-[20px] p-5 bg-surface border border-border hover:border-border-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskConfig[audit.riskLevel].bg} ${riskConfig[audit.riskLevel].color}`}>
                        {riskConfig[audit.riskLevel].label}
                      </span>
                      <span className="text-xs text-text-tertiary capitalize">{audit.contractType}</span>
                    </div>
                    <span className="text-[11px] text-text-tertiary">
                      <RelativeTime iso={log.created_at} />
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{audit.summary}</p>
                  {audit.estimatedFairRate && (
                    <p className="text-xs text-text-tertiary mt-2">Fee justo estimado: ${audit.estimatedFairRate.toLocaleString()} USD</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
