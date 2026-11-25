import { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/45 bg-[#14120c] font-semibold text-[#f8e6a0] transition-colors hover:border-[#f0cb65] hover:bg-[#1e1a10] whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-3 py-2 text-xs w-full justify-center' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download className="h-3.5 w-3.5 text-[#d4af37]" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#14120c] font-semibold text-[#f8e6a0] transition-colors hover:border-[#f0cb65] whitespace-nowrap shrink-0 cursor-pointer ${
            compact ? 'px-3 py-2 text-xs w-full justify-center' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 text-[#d4af37]" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[#d4af37]/45 bg-[#0d0c09] p-6 text-[#f5f2eb] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-widest text-[#d4af37] uppercase">
                    iPhone & iPad Install
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-white">
                    Add DQR to Home Screen
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="rounded-lg p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ol className="mt-4 space-y-2.5 text-xs leading-relaxed text-[#d6cebc]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-[#d4af37]">1.</span>
                  <span>
                    Tap the{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-white">
                      Share <Share className="h-3.5 w-3.5 text-[#d4af37]" />
                    </span>{' '}
                    button in your Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-[#d4af37]">2.</span>
                  <span>
                    Scroll down and tap{' '}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-[#d4af37]">3.</span>
                  <span>
                    Tap <strong className="text-white">Add</strong> — DQR opens full-screen like a native app.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#c79a26] to-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
