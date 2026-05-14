import { motion } from 'framer-motion';
import { Mail, ArrowUpRight, CircleDot, Send } from 'lucide-react';
import type { PitchDraft } from '@/lib/types';

const brandAvatars = [
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=80&h=80&fit=crop',
];

interface PitchCardProps {
  pitch: PitchDraft;
  index?: number;
}

export function PitchCard({ pitch, index = 0 }: PitchCardProps) {
  const isLead = pitch.status === 'lead';
  const avatarUrl = brandAvatars[index % brandAvatars.length];

  return (
    <motion.article
      className={`rounded-[24px] p-5 group hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden border ${
        isLead
          ? 'bg-gradient-to-br from-yellow-soft to-yellow-muted/50 border-yellow/20'
          : 'bg-gradient-to-br from-mint-soft to-mint-muted/50 border-mint/20'
      }`}
      whileHover={{ y: -6, scale: 1.02 }}
    >
      <div className="absolute top-4 right-4">
        {isLead ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow text-foreground shadow-md">
            <CircleDot className="w-3 h-3" />
            Lead
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-mint text-foreground shadow-md">
            <Send className="w-3 h-3" />
            Sent
          </span>
        )}
      </div>
      <div className="flex items-start gap-3 mb-4">
        <img
          src={avatarUrl}
          alt={pitch.brandName}
          width={56}
          height={56}
          className="rounded-2xl object-cover shadow-lg ring-2 ring-white"
        />
        <div className="min-w-0 pr-20">
          <h3 className="font-bold text-foreground text-base truncate">{pitch.brandName}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate font-medium">
            <Mail className="w-3 h-3 shrink-0" />
            {pitch.brandEmail}
          </p>
        </div>
      </div>
      <h4 className="font-bold text-sm text-foreground mb-2 line-clamp-1">{pitch.pitchSubject}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{pitch.pitchContent}</p>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
          isLead ? 'bg-gradient-to-br from-yellow to-orange text-white' : 'bg-gradient-to-br from-mint to-emerald-400 text-white'
        }`}>
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </motion.article>
  );
}
