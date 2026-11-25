import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, KeyRound, Lock, User, X } from 'lucide-react';
import { DqrUser } from '../types';
import { verifyUserCredentialsInSupabase } from '../lib/supabase';
import { WhatsAppContactBox } from './Crowns';

interface LoginModalProps {
  open: boolean;
  users: DqrUser[];
  onClose: () => void;
  onSuccess: (user: DqrUser) => void;
  onRefreshUsers?: () => Promise<DqrUser[]>;
  onSyncMatchedUser?: (user: DqrUser) => void;
}

export function LoginModal({
  open,
  users,
  onClose,
  onSuccess,
  onRefreshUsers,
  onSyncMatchedUser,
}: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUser) {
      setError('Please enter your username.');
      return;
    }
    if (!/^\d{4,9}$/.test(cleanPin)) {
      setError('PIN must be 4 to 9 numeric digits.');
      return;
    }

    setVerifying(true);
    let match: DqrUser | undefined;
    try {
      const liveResult = await verifyUserCredentialsInSupabase(
        cleanUser,
        cleanPin
      );
      if (liveResult.status === 'ok') {
        onSyncMatchedUser?.(liveResult.user);
        match = liveResult.user;
      } else if (liveResult.status === 'invalid') {
        setError('Invalid username or PIN. Contact Admin if you need access.');
        return;
      } else {
        // Offline fallback when Supabase cannot be reached
        const candidateList = onRefreshUsers
          ? await onRefreshUsers()
          : users;
        match = candidateList.find(
          (u) => u.username.toLowerCase() === cleanUser && u.pin === cleanPin
        );
      }
    } finally {
      setVerifying(false);
    }

    if (!match) {
      setError('Invalid username or PIN. Contact Admin if you need access.');
      return;
    }

    setUsername('');
    setPin('');
    onSuccess(match);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-[#0d0c09] p-6 text-[#f5f2eb] shadow-[0_28px_80px_rgba(0,0,0,0.85)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-[#d4af37] uppercase">
                  DQR Member Access
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#f8e6a0]">
                  Sign In to DQR
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close login dialog"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-medium text-[#d6cebc]"
                >
                  Username
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d4af37]/70" />
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-[#d4af37]/30 bg-[#15130e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-[#f0cb65] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-pin"
                  className="block text-xs font-medium text-[#d6cebc]"
                >
                  4–9 Digit PIN
                </label>
                <div className="relative mt-1.5">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d4af37]/70" />
                  <input
                    id="login-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={9}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 9))
                    }
                    placeholder="••••••"
                    className="w-full rounded-xl border border-[#d4af37]/30 bg-[#15130e] py-2.5 pl-10 pr-11 font-mono text-sm tracking-widest text-white placeholder-neutral-500 focus:border-[#f0cb65] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((s) => !s)}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="sheen-hover flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] via-[#f0cb65] to-[#d4af37] py-3 text-sm font-bold text-[#08080a] shadow-[0_10px_28px_rgba(212,175,55,0.28)] transition-transform hover:-translate-y-0.5 disabled:opacity-70 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>{verifying ? 'Verifying...' : 'Sign In'}</span>
              </button>
            </form>

            {/* No Public Signup Notice + WhatsApp Contact */}
            <div className="mt-5 border-t border-white/10 pt-5">
              <WhatsAppContactBox compact />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
