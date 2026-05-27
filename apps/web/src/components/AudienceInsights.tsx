import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';

export interface AudienceInsightsData {
  videoId: string;
  videoTitle: string;
  totalComments: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
}

interface Props {
  data: AudienceInsightsData;
}

export function AudienceInsights({ data }: Props) {
  const total = data.sentiment.positive + data.sentiment.negative + data.sentiment.neutral;
  const posPct = total > 0 ? Math.round((data.sentiment.positive / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((data.sentiment.negative / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((data.sentiment.neutral / total) * 100) : 0;

  return (
    <motion.section
      className="mb-10 lg:mb-14"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-4 h-4 text-accent" />
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.15em]">Lo que dice tu audiencia</span>
        <span className="text-[11px] text-text-tertiary">{data.totalComments} comentarios analizados</span>
      </div>

      <div className="space-y-5">
        {/* Sentiment bars */}
        <div className="rounded-[24px] p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold text-text">Sentimiento</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${posPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-emerald-400 w-12 text-right">{posPct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Minus className="w-4 h-4 text-text-tertiary shrink-0" />
              <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-text-tertiary rounded-full transition-all" style={{ width: `${neuPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-text-tertiary w-12 text-right">{neuPct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ThumbsDown className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${negPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-red-400 w-12 text-right">{negPct}%</span>
            </div>
          </div>
        </div>

        {/* Top themes */}
        {data.topThemes.length > 0 && (
          <div className="rounded-[24px] p-6 bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-accent-muted" />
              <span className="text-sm font-semibold text-text">Temas recurrentes</span>
            </div>
            <div className="space-y-3">
              {data.topThemes.map((theme, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-accent mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-text">{theme.theme}</span>
                      <span className="text-xs text-text-tertiary">{theme.count} menciones</span>
                    </div>
                    {theme.examples.length > 0 && (
                      <p className="text-xs text-text-secondary italic">"{theme.examples[0].slice(0, 100)}..."</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top questions */}
        {data.topQuestions.length > 0 && (
          <div className="rounded-[24px] p-6 bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-accent-muted" />
              <span className="text-sm font-semibold text-text">Preguntas frecuentes</span>
            </div>
            <ul className="space-y-2">
              {data.topQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{q.question}{q.count > 1 && <span className="text-text-tertiary text-xs ml-1">({q.count}x)</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.section>
  );
}
