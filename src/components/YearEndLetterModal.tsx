import { AnimatePresence, motion } from 'motion/react';
import { Award, Sparkles, X } from 'lucide-react';
import { YearEndLetterData } from '../utils/yearEndHelpers';

interface YearEndLetterModalProps {
  open: boolean;
  data: YearEndLetterData | null;
  onClose: () => void;
}

export function YearEndLetterModal({
  open,
  data,
  onClose,
}: YearEndLetterModalProps) {
  if (!data) return null;

  const rankSentence = data.rankChanged
    ? `You went from ${data.startRankName} to ${data.endRankName}.`
    : data.endLevel > data.startLevel
      ? `You stood in ${data.endRankName} and climbed from Level ${data.startLevel} to Level ${data.endLevel}.`
      : `You stood steady at ${data.endRankName} (Level ${data.endLevel}).`;

  const territorySentence = `You won ${data.territoriesWon} ${
    data.territoriesWon === 1 ? 'territory' : 'territories'
  }.`;

  const resilienceSentence =
    data.fallsCount > 0
      ? `You fell ${data.fallsCount} ${
          data.fallsCount === 1 ? 'time' : 'times'
        } and came back each time.`
      : `You held your ground across the seasons without losing your footing.`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-[#d4af37]/50 bg-gradient-to-b from-[#17130c] via-[#0e0c09] to-[#08080a] p-7 text-[#f6f1e6] shadow-[0_32px_100px_rgba(212,175,55,0.22)] sm:p-10"
          >
            {/* Soft Gold Top Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-[#d4af37]/18 blur-3xl"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Year-End Letter"
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.24em] text-[#d4af37] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>December 31 · {data.year} Year-End Letter</span>
              </div>

              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                A Year Remembered, {data.fullName}
              </h2>

              <div className="my-6 h-px w-full bg-gradient-to-r from-[#d4af37]/50 via-[#d4af37]/20 to-transparent" />

              {/* Narrative Letter Body — Screenshot-worthy centerpiece */}
              <div className="rounded-2xl border border-[#d4af37]/25 bg-black/35 p-6 sm:p-7">
                <p className="font-display text-lg leading-[1.75] text-[#f9f4e8] sm:text-xl">
                  “This year, you played{' '}
                  <span className="font-bold text-[#f5dc82]">
                    {data.quizzesPlayed}
                  </span>{' '}
                  {data.quizzesPlayed === 1 ? 'quiz' : 'quizzes'}.{' '}
                  {rankSentence} {territorySentence} {resilienceSentence}
                </p>
                <p className="mt-5 font-display text-lg leading-[1.75] text-[#f5dc82] sm:text-xl">
                  Thank you for being here. We grew together,{' '}
                  <span className="underline decoration-[#d4af37]/60 underline-offset-4">
                    {data.fullName}
                  </span>
                  .”
                </p>
              </div>

              {/* Compact Summary Strip */}
              <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
                    Quizzes
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-[#f5dc82] tabular-nums">
                    {data.quizzesPlayed}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
                    Territories
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-[#f5dc82] tabular-nums">
                    {data.territoriesWon}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
                    Streak
                  </p>
                  <p className="mt-0.5 font-mono text-base font-bold text-[#f5dc82] tabular-nums">
                    🔥 {data.streakDays}d
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                <div className="flex items-center gap-2 text-xs text-white/55">
                  <Award className="h-4 w-4 text-[#d4af37]" />
                  <span>Dijan Quiz Rankings · Small Actions Accumulate</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-[#c79a26] to-[#d4af37] px-5 py-2 text-xs font-bold text-[#08080a] shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  Keep Going
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
