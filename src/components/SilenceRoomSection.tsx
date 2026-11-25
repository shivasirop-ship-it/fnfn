import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Coffee, LogOut, Sparkles, Timer, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CalmAudioEngine } from '../utils/calmAudio';

interface PresenceDot {
  id: string;
  isSelf: boolean;
  joinedAt: number;
  hueClass: string;
}

type SilenceMode = 'quiet' | 'pomo-25-5' | 'pomo-50-10';
type PomoPhase = 'focus' | 'break';

const DOT_PALETTE = [
  'bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.7)]',
  'bg-sky-300 shadow-[0_0_16px_rgba(125,211,252,0.7)]',
  'bg-[#f8e6a0] shadow-[0_0_16px_rgba(248,230,160,0.75)]',
  'bg-violet-300 shadow-[0_0_16px_rgba(196,181,253,0.7)]',
  'bg-teal-300 shadow-[0_0_16px_rgba(94,234,212,0.7)]',
];

function formatTimer(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playGentleChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs = [528, 660];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 1.3);
    });
    window.setTimeout(() => void ctx.close().catch(() => {}), 2000);
  } catch {
    // Ignore audio context block
  }
}

export function SilenceRoomSection() {
  const [mode, setMode] = useState<SilenceMode>('quiet');
  const [selectedMinutes, setSelectedMinutes] = useState<5 | 10 | 30>(10);
  const [isSitting, setIsSitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedSession, setCompletedSession] = useState(false);

  // Pomodoro state
  const [pomoPhase, setPomoPhase] = useState<PomoPhase>('focus');
  const [pomoPhaseSec, setPomoPhaseSec] = useState(0);
  const [pomoCyclesCompleted, setPomoCyclesCompleted] = useState(0);

  const [ambientOn, setAmbientOn] = useState(false);
  const audioRef = useRef<CalmAudioEngine | null>(null);

  const anonClientIdRef = useRef<string>(
    `anon-sit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const [remoteSitters, setRemoteSitters] = useState<
    { id: string; joinedAt: number }[]
  >([]);

  const pomoConfig = useMemo(() => {
    if (mode === 'pomo-50-10') {
      return { focusMin: 50, breakMin: 10, label: '50 / 10 Deep Focus' };
    }
    return { focusMin: 25, breakMin: 5, label: '25 / 5 Classic Pomodoro' };
  }, [mode]);

  // Subscribe to anonymous Supabase Realtime Presence for Shared Silence Room
  useEffect(() => {
    const channel = supabase.channel('dqr-silence-room', {
      config: {
        presence: {
          key: anonClientIdRef.current,
        },
      },
    });

    const syncPresence = () => {
      const state = channel.presenceState<{
        joinedAt?: number;
        sitting?: boolean;
      }>();
      const active: { id: string; joinedAt: number }[] = [];
      for (const [key, metas] of Object.entries(state)) {
        if (!Array.isArray(metas) || metas.length === 0) continue;
        const first = metas[0];
        if (first?.sitting) {
          active.push({
            id: key,
            joinedAt: typeof first.joinedAt === 'number' ? first.joinedAt : 0,
          });
        }
      }
      setRemoteSitters(active);
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isSitting) {
          await channel.track({
            sitting: true,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [isSitting]);

  // Sitting elapsed & Pomodoro timer
  useEffect(() => {
    if (!isSitting) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (mode === 'quiet' && next >= selectedMinutes * 60) {
          setCompletedSession(true);
        }
        return next;
      });

      if (mode !== 'quiet') {
        setPomoPhaseSec((prev) => {
          const next = prev + 1;
          const phaseDurationSec =
            (pomoPhase === 'focus'
              ? pomoConfig.focusMin
              : pomoConfig.breakMin) * 60;
          if (next >= phaseDurationSec) {
            playGentleChime();
            if (pomoPhase === 'focus') {
              setPomoCyclesCompleted((c) => c + 1);
              setPomoPhase('break');
            } else {
              setPomoPhase('focus');
            }
            return 0;
          }
          return next;
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isSitting, mode, selectedMinutes, pomoPhase, pomoConfig]);

  // Single ambient sound lifecycle
  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  const toggleAmbient = (forceState?: boolean) => {
    const next = typeof forceState === 'boolean' ? forceState : !ambientOn;
    setAmbientOn(next);
    if (!audioRef.current) {
      audioRef.current = new CalmAudioEngine();
    }
    audioRef.current.setWind(next, 0.36);
  };

  const handleEnterRoom = () => {
    setElapsedSeconds(0);
    setCompletedSession(false);
    setPomoPhase('focus');
    setPomoPhaseSec(0);
    setPomoCyclesCompleted(0);
    setIsSitting(true);
  };

  const handleLeaveRoom = () => {
    setIsSitting(false);
    setElapsedSeconds(0);
    setCompletedSession(false);
    setPomoPhase('focus');
    setPomoPhaseSec(0);
    if (ambientOn) {
      toggleAmbient(false);
    }
  };

  const dots: PresenceDot[] = useMemo(() => {
    const map = new Map<string, { id: string; joinedAt: number }>();
    for (const s of remoteSitters) {
      map.set(s.id, s);
    }
    if (isSitting) {
      map.set(anonClientIdRef.current, {
        id: anonClientIdRef.current,
        joinedAt: Date.now(),
      });
    }
    return Array.from(map.values()).map((entry, idx) => ({
      id: entry.id,
      isSelf: entry.id === anonClientIdRef.current,
      joinedAt: entry.joinedAt,
      hueClass: DOT_PALETTE[idx % DOT_PALETTE.length],
    }));
  }, [remoteSitters, isSitting]);

  const targetSeconds =
    mode === 'quiet'
      ? selectedMinutes * 60
      : (pomoPhase === 'focus' ? pomoConfig.focusMin : pomoConfig.breakMin) *
        60;

  const activeSeconds = mode === 'quiet' ? elapsedSeconds : pomoPhaseSec;
  const remainingSeconds = Math.max(0, targetSeconds - activeSeconds);
  const progressPct = Math.min(
    100,
    Math.round((activeSeconds / Math.max(1, targetSeconds)) * 100)
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#090d14] via-[#070a10] to-[#050608] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.75)] sm:p-10">
      {/* Soft ambient radial atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(125,211,252,0.08),transparent_65%)]"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-sky-300/90 uppercase">
          Shared Silence Room · No Chat · No Names
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-[#f5f2eb] sm:text-3xl">
          Sit Together in Quiet Space
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
          A shared quiet corner in a loud internet. Each small light represents
          someone quietly resting or studying alongside you right now—use
          Silent Timer or Pomodoro focus cycles and leave whenever you wish.
        </p>

        {/* Anonymous Presence Dot Field */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-black/45 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            {dots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <span className="h-3 w-3 rounded-full bg-white/25" />
                <span className="font-mono text-xs text-neutral-400">
                  Room is still · Take a seat whenever you&apos;re ready
                </span>
              </div>
            ) : (
              dots.map((dot, idx) => (
                <motion.div
                  key={dot.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0.65, 1, 0.65],
                    scale: [1, 1.16, 1],
                  }}
                  transition={{
                    duration: 3.4 + (idx % 3) * 0.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  title={
                    dot.isSelf ? 'You (anonymous)' : 'Someone sitting silently'
                  }
                  className={`relative flex h-4 w-4 items-center justify-center rounded-full ${dot.hueClass} ${
                    dot.isSelf
                      ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-[#070a10]'
                      : ''
                  }`}
                />
              ))
            )}
          </div>

          <p className="mt-2 font-mono text-xs text-neutral-300 tabular-nums">
            {dots.length}{' '}
            {dots.length === 1
              ? 'person quietly sitting'
              : 'people quietly sitting'}
            {isSitting ? ' (including you)' : ''}
          </p>
        </div>

        {/* Timer & Pomodoro Controls */}
        <div className="mt-7 rounded-3xl border border-white/10 bg-[#0b0f16]/90 p-6">
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-white/10 pb-5">
            {(
              [
                { id: 'quiet', label: 'Quiet Sit', icon: Clock },
                { id: 'pomo-25-5', label: 'Pomodoro 25 / 5', icon: Timer },
                { id: 'pomo-50-10', label: 'Pomodoro 50 / 10', icon: Coffee },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSitting}
                  onClick={() => setMode(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-mono text-xs font-bold transition-colors ${
                    active
                      ? 'border-sky-400/60 bg-sky-500/15 text-sky-200'
                      : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white'
                  } ${isSitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Duration Presets (Quiet Sit only) */}
          {mode === 'quiet' && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {([5, 10, 30] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isSitting}
                  onClick={() => setSelectedMinutes(mins)}
                  className={`rounded-xl border px-4 py-2 font-mono text-xs font-bold transition-colors tabular-nums ${
                    selectedMinutes === mins
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f8e6a0]'
                      : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                  } ${isSitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          )}

          {/* Active Pomodoro Phase Indicator */}
          {mode !== 'quiet' && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
              <span
                className={
                  pomoPhase === 'focus'
                    ? 'font-bold text-emerald-300'
                    : 'font-bold text-amber-200'
                }
              >
                {pomoPhase === 'focus'
                  ? `FOCUS BLOCK (${pomoConfig.focusMin}m)`
                  : `REST BREAK (${pomoConfig.breakMin}m)`}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-300 tabular-nums">
                Completed Cycles: {pomoCyclesCompleted}
              </span>
            </div>
          )}

          {/* Timer Readout */}
          <div className="mt-5 flex flex-col items-center">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-neutral-400 uppercase">
              <Clock className="h-3.5 w-3.5 text-sky-300" />
              <span>
                {isSitting
                  ? mode === 'quiet'
                    ? completedSession
                      ? 'Goal Reached · Stay as Long as You Like'
                      : 'Time Sitting Silently'
                    : pomoPhase === 'focus'
                      ? 'Stay Locked In · Silent Study'
                      : 'Step Back & Breathe'
                  : 'Ready to Begin'}
              </span>
            </div>

            <p className="mt-2 font-mono text-4xl font-extrabold tracking-tight text-white tabular-nums sm:text-5xl">
              {mode === 'quiet'
                ? formatTimer(elapsedSeconds)
                : formatTimer(remainingSeconds)}
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-400 tabular-nums">
              {mode === 'quiet'
                ? isSitting && !completedSession
                  ? `${formatTimer(remainingSeconds)} left in your ${selectedMinutes}-min quiet sit`
                  : `Session goal: ${selectedMinutes}:00`
                : isSitting
                  ? `Total session time: ${formatTimer(elapsedSeconds)}`
                  : `${pomoConfig.label} · Soft chime on transition`}
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${
                  pomoPhase === 'break' && mode !== 'quiet'
                    ? 'bg-gradient-to-r from-amber-300 to-rose-300'
                    : 'bg-gradient-to-r from-sky-400 via-emerald-300 to-[#f8e6a0]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {completedSession && mode === 'quiet' && (
              <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {selectedMinutes} peaceful minutes complete—stay or leave
                  whenever you wish.
                </span>
              </p>
            )}
          </div>

          {/* Enter / Leave + Single Ambient Sound Toggle */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {!isSitting ? (
              <button
                type="button"
                onClick={handleEnterRoom}
                className="rounded-xl bg-gradient-to-r from-sky-400 to-emerald-300 px-6 py-3 text-sm font-bold text-[#051014] shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
              >
                {mode === 'quiet'
                  ? `Sit Silently (${selectedMinutes}m)`
                  : `Start ${pomoConfig.focusMin}m Focus`}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 px-5 py-3 text-sm font-bold text-rose-200 transition-colors hover:bg-rose-500/25 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Whenever</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleAmbient()}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
                ambientOn
                  ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {ambientOn ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Ambient Sound: On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>Ambient Sound: Off</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

