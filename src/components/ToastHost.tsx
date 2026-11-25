import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, Sparkles, X } from 'lucide-react';

export type ToastTone = 'gold' | 'blue' | 'emerald';

export interface ToastItem {
  id: string;
  message: string;
  tone?: ToastTone;
}

interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const TONE_STYLES: Record<
  ToastTone,
  { border: string; iconWrap: string; text: string }
> = {
  gold: {
    border: 'border-[#d4af37]/50 shadow-[0_14px_34px_rgba(212,175,55,0.16)]',
    iconWrap: 'text-[#f8e6a0]',
    text: 'text-[#f8f5ee]',
  },
  blue: {
    border: 'border-[#3988ff]/50 shadow-[0_14px_34px_rgba(57,136,255,0.16)]',
    iconWrap: 'text-[#8ec5ff]',
    text: 'text-[#eff6ff]',
  },
  emerald: {
    border: 'border-emerald-400/50 shadow-[0_14px_34px_rgba(16,185,129,0.16)]',
    iconWrap: 'text-emerald-300',
    text: 'text-emerald-50',
  },
};

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2 sm:right-5 sm:bottom-5"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'gold';
          const styles = TONE_STYLES[tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border bg-[#0e0d0a]/95 px-3.5 py-2.5 backdrop-blur-md ${styles.border}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`shrink-0 ${styles.iconWrap}`}>
                  {tone === 'emerald' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : tone === 'blue' ? (
                    <Info className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </span>
                <p
                  className={`truncate text-xs font-medium tracking-wide ${styles.text}`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
