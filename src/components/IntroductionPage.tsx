import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  LineChart,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import { IntroSettings } from '../types';
import { GoldParticles } from './GoldParticles';
import { FounderGoldenSilhouette, WhatsAppContactBox } from './Crowns';
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../data/initialData';

interface IntroductionPageProps {
  settings: IntroSettings;
  isLoggedIn: boolean;
  onGetStarted: () => void;
  onGoHallOfFame: () => void;
  focusSection?: 'home' | 'about';
}

const PROVIDE_BUBBLES = [
  {
    id: 'material',
    title: 'Personalized Studying Material',
    description:
      'Focused daily quiz briefs and curated academic notes tailored to build steady retention without overwhelm.',
    icon: BookOpen,
    gradient: 'from-[#f8e6a0]/16 via-[#d4af37]/8 to-transparent',
    borderColor: 'border-[#f5dc82]/35 hover:border-[#f5dc82]/75',
    glowShadow: 'hover:shadow-[0_18px_48px_rgba(245,220,130,0.20)]',
    iconBg: 'bg-[#f5dc82]/14 text-[#f8e6a0]',
    floatDelay: 0,
    floatDuration: 5.2,
  },
  {
    id: 'tracking',
    title: 'Performance Tracking',
    description:
      'Measure accuracy, consistency streaks, and ranking progression across every quiz session over time.',
    icon: LineChart,
    gradient: 'from-[#e6b83a]/16 via-[#b8861b]/8 to-transparent',
    borderColor: 'border-[#d4af37]/35 hover:border-[#f0c75e]/75',
    glowShadow: 'hover:shadow-[0_18px_48px_rgba(212,175,55,0.22)]',
    iconBg: 'bg-[#d4af37]/15 text-[#f0c75e]',
    floatDelay: 0.4,
    floatDuration: 5.8,
  },
  {
    id: 'accountability',
    title: 'Accountability',
    description:
      'A structured daily habit loop that keeps you showing up for a few intentional minutes instead of cramming.',
    icon: ShieldCheck,
    gradient: 'from-[#f0a830]/16 via-[#a86d14]/8 to-transparent',
    borderColor: 'border-[#e0a238]/35 hover:border-[#f5b94c]/75',
    glowShadow: 'hover:shadow-[0_18px_48px_rgba(224,162,56,0.22)]',
    iconBg: 'bg-[#e0a238]/15 text-[#f7c568]',
    floatDelay: 0.8,
    floatDuration: 5.5,
  },
  {
    id: 'competition',
    title: 'Competition',
    description:
      'Climb transparent rankings alongside driven peers and sharpen composure for district-level academic stages.',
    icon: Trophy,
    gradient: 'from-[#d99b4e]/16 via-[#8c5a18]/8 to-transparent',
    borderColor: 'border-[#c98b3e]/35 hover:border-[#e6aa5c]/75',
    glowShadow: 'hover:shadow-[0_18px_48px_rgba(201,139,62,0.22)]',
    iconBg: 'bg-[#c98b3e]/15 text-[#f2be79]',
    floatDelay: 1.2,
    floatDuration: 6.1,
  },
];

export function IntroductionPage({
  settings,
  isLoggedIn,
  onGetStarted,
  onGoHallOfFame,
}: IntroductionPageProps) {
  const [termsOpen, setTermsOpen] = useState(false);

  const headlineWords = ['Small', 'Actions', 'Accumulate'];

  return (
    <div className="bg-[#08080a] text-[#f5f2eb]">
      {/* 1. HERO SECTION */}
      <section
        id="intro-hero"
        className="relative flex min-h-[84vh] items-center justify-center overflow-hidden border-b border-[#d4af37]/15 px-5 py-24 sm:px-8"
      >
        {/* Ambient radial backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(212,175,55,0.12),transparent_70%)]"
        />
        <GoldParticles />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs tracking-[0.22em] text-[#d4af37]/90 uppercase"
          >
            Dijan Quiz Rankings · Daily Academic Discipline
          </motion.p>

          <h1
            className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]"
            style={{ textWrap: 'balance' }}
          >
            {headlineWords.map((word, index) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.7,
                  delay: 0.12 + index * 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="gold-shimmer-text mr-3 inline-block last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#d6d0c4] sm:text-lg"
          >
            DQR — Dijan Quiz Rankings — is a platform that seeks to provide a few
            minutes for quiz or academics each day to make the journey easier,
            rather than piling everything on one day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={onGetStarted}
              className="sheen-hover inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#c79a26] via-[#f0cb65] to-[#d4af37] px-7 py-3.5 text-sm font-bold tracking-wide text-[#08080a] shadow-[0_12px_32px_rgba(212,175,55,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(212,175,55,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0cb65] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isLoggedIn ? 'Enter Hall of Fame' : 'Get Started'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onGoHallOfFame}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/35 bg-[#12110e]/80 px-6 py-3.5 text-sm font-semibold text-[#f5dc82] transition-colors duration-200 hover:border-[#d4af37] hover:bg-[#1b1810] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Explore Hall of Fame</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT / ORIGIN SECTION */}
      <section
        id="about-section"
        className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12"
        >
          {/* Founder Portrait Slot */}
          <div className="lg:col-span-5">
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#100f0c] shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
              {settings.founderPhotoUrl ? (
                <img
                  src={settings.founderPhotoUrl}
                  alt={`Founder ${settings.founderName}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FounderGoldenSilhouette />
              )}

              {/* Bottom caption scrim */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/85 to-transparent p-6">
                <p className="font-mono text-xs tracking-wider text-[#d4af37]">
                  Founder · Established {settings.establishedDate}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-white">
                  {settings.founderName}
                </p>
              </div>
            </div>
          </div>

          {/* Origin Story & Mission */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
              Origin & Philosophy
            </p>
            <h2
              className="mt-3 font-display text-3xl leading-tight font-bold text-[#f8f5ee] sm:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              {settings.aboutHeadline}
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-[#c8bfa9]">
              <span>Established {settings.establishedDate}</span>
              <span aria-hidden="true">·</span>
              <span>Founder: {settings.founderName}</span>
            </div>

            <p className="mt-6 text-base leading-relaxed text-[#cec7b8]">
              {settings.aboutText}
            </p>

            <div className="mt-8 rounded-xl border border-[#d4af37]/20 bg-[#11100d] p-5">
              <p className="font-display text-lg italic text-[#f5dc82]">
                “{settings.missionLine}”
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. WHAT DQR PROVIDES — STAR SECTION */}
      <section className="relative overflow-hidden border-y border-[#d4af37]/15 bg-[#0b0a08] px-5 py-20 sm:px-8 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.10),transparent_65%)]"
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
              Four Pillars of Daily Mastery
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#f9f6ef] sm:text-4xl">
              What DQR Provides
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#beb6a4] sm:text-base">
              Every pillar works together so small daily sessions turn into lasting
              confidence and measurable results.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROVIDE_BUBBLES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: item.floatDuration,
                      delay: item.floatDelay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`group relative flex h-full flex-col justify-between rounded-[28px] border bg-gradient-to-b ${item.gradient} ${item.borderColor} ${item.glowShadow} bg-[#11100d]/90 p-7 transition-all duration-300`}
                  >
                    <div>
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${item.iconBg} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-[#faf6ec]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#c6beab]">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-6 h-px w-full bg-gradient-to-r from-[#d4af37]/40 via-[#d4af37]/10 to-transparent" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA BANNER + WHATSAPP CONTACT ADMIN */}
      <section
        id="contact-section"
        className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-gradient-to-br from-[#16130b] via-[#0e0d0a] to-[#12100b] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.65)] sm:p-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-3xl"
          />

          <h2 className="relative z-10 font-display text-3xl font-bold text-[#f8e6a0] sm:text-5xl">
            Ready to build the habit?
          </h2>
          <p className="relative z-10 mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#cfc7b6] sm:text-base">
            Log in with your DQR username and 4–9 digit PIN, or message the
            admin directly on WhatsApp to request your account.
          </p>

          <div className="relative z-10 mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <button
              type="button"
              onClick={onGetStarted}
              className="sheen-hover inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#c79a26] via-[#f0cb65] to-[#d4af37] px-8 py-4 text-sm font-bold text-[#08080a] shadow-[0_12px_32px_rgba(212,175,55,0.28)] transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{isLoggedIn ? 'Open Hall of Fame' : 'Get Started'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <WhatsAppContactBox />
          </div>
        </motion.div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-[#d4af37]/15 bg-[#060607] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold tracking-wider text-[#d4af37]">
              DQR
            </span>
            <span className="text-xs text-[#8f8778]">
              Dijan Quiz Rankings · Est. {settings.establishedDate}
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs font-medium text-[#b8b0a0]">
            <a
              href="#about-section"
              className="transition-colors hover:text-[#f0cb65]"
            >
              About
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#6ee79c]"
            >
              Contact ({WHATSAPP_NUMBER})
            </a>
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="transition-colors hover:text-[#f0cb65] cursor-pointer"
            >
              Terms
            </button>
          </nav>

          <p className="text-xs text-[#7c7567]">
            © 2026 DQR. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Terms Modal */}
      <AnimatePresence>
        {termsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setTermsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#d4af37]/30 bg-[#11100d] p-6 text-[#ece7dc] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#d4af37]/15 pb-4">
                <h3 className="font-display text-xl font-bold text-[#f5dc82]">
                  DQR Terms & Account Policy
                </h3>
                <button
                  type="button"
                  onClick={() => setTermsOpen(false)}
                  aria-label="Close terms"
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#c6beab]">
                <p>
                  1. Accounts on DQR are created exclusively by the platform
                  administrator. Public self-registration is disabled to preserve
                  verified student standings.
                </p>
                <p>
                  2. Hall of Fame records reflect verified district-level quiz
                  appearances and external competition placements managed by the
                  DQR admin team.
                </p>
                <p>
                  3. For account provisioning or record inquiries, contact the
                  administrator via WhatsApp at {WHATSAPP_NUMBER}.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
