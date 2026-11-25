import { motion } from 'motion/react';
import { QuizPosition } from '../types';
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../data/initialData';

/** 1st Place — Imperial Three-Peak Golden Crown */
export function FirstGoldCrown({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={{ y: [0, -3, 0], rotate: [0, 1.5, -1.5, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="goldCrownGrad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="45%" stopColor="#E5B942" />
          <stop offset="100%" stopColor="#9E7312" />
        </linearGradient>
      </defs>
      {/* Silhouette Aura */}
      <circle cx="32" cy="34" r="24" fill="url(#goldCrownGrad)" opacity="0.16" />
      <path
        d="M11 45L8 22L22 31L32 13L42 31L56 22L53 45H11Z"
        fill="url(#goldCrownGrad)"
        stroke="#FFF4C8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="11" y="47" width="42" height="5.5" rx="2.5" fill="url(#goldCrownGrad)" stroke="#FFF4C8" strokeWidth="1.2" />
      <circle cx="32" cy="11" r="3" fill="#FFF7D6" />
      <circle cx="8" cy="20" r="2.3" fill="#FDE68A" />
      <circle cx="56" cy="20" r="2.3" fill="#FDE68A" />
      <path d="M29 36L32 31L35 36L32 41L29 36Z" fill="#78350F" opacity="0.65" />
    </motion.svg>
  );
}

/** 2nd Place — Regal Silver Laurel Coronet */
export function SecondSilverCrown({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={{ y: [0, -2.5, 0], scale: [1, 1.03, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="silverCrownGrad" x1="10" y1="14" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="23" fill="#E2E8F0" opacity="0.13" />
      {/* Twin Silver Winged Diadem */}
      <path
        d="M13 44C10 34 11 24 16 19C19 25 23 29 27 31L32 17L37 31C41 29 45 25 48 19C53 24 54 34 51 44H13Z"
        fill="url(#silverCrownGrad)"
        stroke="#F8FAFC"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="13" y="46.5" width="38" height="4.5" rx="2.2" fill="url(#silverCrownGrad)" stroke="#F8FAFC" strokeWidth="1.1" />
      <circle cx="32" cy="15" r="2.5" fill="#FFFFFF" />
      <circle cx="22" cy="38" r="2" fill="#334155" opacity="0.45" />
      <circle cx="42" cy="38" r="2" fill="#334155" opacity="0.45" />
    </motion.svg>
  );
}

/** 3rd Place — Warm Bronze / Carved Wood Crest Crown */
export function ThirdBronzeCrown({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={{ y: [0, -2, 0], rotate: [0, -1.2, 1.2, 0] }}
      transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="bronzeCrownGrad" x1="10" y1="16" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5C08D" />
          <stop offset="50%" stopColor="#B86B35" />
          <stop offset="100%" stopColor="#5C3116" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="22" fill="#B86B35" opacity="0.16" />
      {/* Carved Tri-Shield Crest Crown */}
      <path
        d="M14 44L11 26L23 34L32 20L41 34L53 26L50 44H14Z"
        fill="url(#bronzeCrownGrad)"
        stroke="#FCD9B6"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M15 47H49L46 52H18L15 47Z" fill="url(#bronzeCrownGrad)" stroke="#FCD9B6" strokeWidth="1.1" />
      <circle cx="32" cy="18" r="2.2" fill="#FDE6C4" />
      <circle cx="11" cy="24" r="1.9" fill="#F5C08D" />
      <circle cx="53" cy="24" r="1.9" fill="#F5C08D" />
    </motion.svg>
  );
}

/** 4th–6th Place — Academic Merit Shield */
export function MeritShieldEmblem({
  position,
  className = 'w-10 h-10',
}: {
  position: string;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
        <path
          d="M32 8L50 15V31C50 43.5 41.8 52.2 32 56C22.2 52.2 14 43.5 14 31V15L32 8Z"
          fill="#0F2C52"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <path
          d="M32 13L45 18V31C45 40.5 39 47.2 32 50.4C25 47.2 19 40.5 19 31V18L32 13Z"
          fill="#163968"
          stroke="#D4AF37"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-[#F5DC82]">
        {position}
      </span>
    </motion.div>
  );
}

/** Not Qualified — Participation Laurel Seal */
export function ParticipationSeal({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
        <circle
          cx="32"
          cy="32"
          r="21"
          fill="#1E293B"
          stroke="#94A3B8"
          strokeWidth="1.6"
          strokeDasharray="4 3"
        />
        <circle cx="32" cy="32" r="15" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold text-slate-300">
        NQ
      </span>
    </div>
  );
}

export function PositionCrownOrEmblem({
  position,
  className,
}: {
  position: QuizPosition;
  className?: string;
}) {
  if (position === '1st') return <FirstGoldCrown className={className} />;
  if (position === '2nd') return <SecondSilverCrown className={className} />;
  if (position === '3rd') return <ThirdBronzeCrown className={className} />;
  if (position === 'Not Qualified') return <ParticipationSeal className={className} />;
  return <MeritShieldEmblem position={position} className={className} />;
}

/** Golden Silhouette Placeholder for Founder Portrait */
export function FounderGoldenSilhouette() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#17130a] via-[#0e0c08] to-[#08080a]">
      {/* Subtle radial golden aura */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(212,175,55,0.28),transparent_65%)]"
      />
      <svg
        viewBox="0 0 240 280"
        fill="none"
        className="relative z-10 h-[86%] w-[86%]"
        aria-label="Founder Golden Silhouette"
      >
        <defs>
          <linearGradient id="founderGold" x1="40" y1="20" x2="200" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF0B8" />
            <stop offset="42%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#7C5810" />
          </linearGradient>
          <linearGradient id="founderRing" x1="0" y1="0" x2="240" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5DC82" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Crest Ring */}
        <circle cx="120" cy="116" r="88" stroke="url(#founderRing)" strokeWidth="1.2" strokeDasharray="5 4" />
        {/* Head Silhouette */}
        <circle cx="120" cy="96" r="38" fill="url(#founderGold)" />
        {/* Academic Collar & Shoulders Silhouette */}
        <path
          d="M42 256C44 196 76 156 120 156C164 156 196 196 198 256H42Z"
          fill="url(#founderGold)"
        />
        {/* Subtle inner lapel line */}
        <path
          d="M95 162L120 206L145 162"
          stroke="#08080A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

/** Custom Animated WhatsApp Logo-Shaped Contact Box */
export function WhatsAppContactBox({ compact = false }: { compact?: boolean }) {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative inline-flex items-center gap-3.5 rounded-2xl border border-[#25D366]/40 bg-[#0d1912] px-5 py-3.5 text-left shadow-[0_12px_32px_rgba(37,211,102,0.16)] transition-colors hover:border-[#25D366]/80 hover:bg-[#112318] ${
        compact ? 'py-2.5 px-4' : ''
      }`}
    >
      {/* WhatsApp Speech-Bubble Logo Container */}
      <motion.div
        animate={{ rotate: [0, -6, 6, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" className="h-full w-full drop-shadow-[0_4px_12px_rgba(37,211,102,0.45)]">
          <path
            d="M32 6C17.64 6 6 17.41 6 31.49C6 36.7 7.6 41.55 10.33 45.6L7 57L18.88 53.77C22.77 55.86 27.24 57 32 57C46.36 57 58 45.59 58 31.5C58 17.41 46.36 6 32 6Z"
            fill="#25D366"
          />
          <path
            d="M32 10.5C20.14 10.5 10.5 19.9 10.5 31.5C10.5 36.12 12.04 40.42 14.66 43.91L12.66 51L20.04 49.04C23.51 51.23 27.61 52.5 32 52.5C43.86 52.5 53.5 43.1 53.5 31.5C53.5 19.9 43.86 10.5 32 10.5Z"
            fill="#128C7E"
            opacity="0.25"
          />
          <path
            d="M24.2 21.8C23.7 20.7 23.2 20.7 22.7 20.7H21.4C20.9 20.7 20.2 20.9 19.6 21.6C19 22.3 17.3 23.9 17.3 27.1C17.3 30.3 19.7 33.4 20 33.8C20.3 34.2 24.6 41.2 31.4 43.9C37 46.1 38.2 45.7 39.4 45.6C40.6 45.5 43.3 44 43.9 42.4C44.5 40.8 44.5 39.5 44.3 39.2C44.1 38.9 43.6 38.7 42.9 38.4C42.2 38 38.9 36.4 38.3 36.2C37.7 36 37.2 35.9 36.8 36.5C36.3 37.2 35.1 38.7 34.7 39.1C34.3 39.5 33.9 39.6 33.2 39.2C32.5 38.9 30.3 38.1 27.7 35.8C25.7 34 24.3 31.8 23.9 31.1C23.5 30.4 23.9 30 24.2 29.7C24.5 29.4 24.9 28.9 25.3 28.5C25.6 28.1 25.8 27.8 26 27.3C26.2 26.8 26.1 26.4 25.9 26.1C25.8 25.7 24.7 22.8 24.2 21.8Z"
            fill="#FFFFFF"
          />
        </svg>
      </motion.div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6ee79c]">
          <span aria-hidden="true">💬</span>
          <span>Wanna get started? Contact Admin</span>
        </div>
        <div className="mt-0.5 font-mono text-sm font-bold tracking-wide text-white group-hover:text-[#9ef5be]">
          WhatsApp: {WHATSAPP_NUMBER}
        </div>
        <div className="text-[11px] text-neutral-400">
          Accounts are created exclusively by Admin
        </div>
      </div>
    </motion.a>
  );
}
