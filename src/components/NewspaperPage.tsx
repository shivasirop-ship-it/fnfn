import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Archive, ArrowLeft, Newspaper } from 'lucide-react';
import { ArchivedNewspaperEdition, NewspaperEdition } from '../types';

interface NewspaperPageProps {
  edition: NewspaperEdition;
  archive?: ArchivedNewspaperEdition[];
}

export function NewspaperPage({ edition, archive = [] }: NewspaperPageProps) {
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

  const sortedArchive = useMemo(
    () => [...archive].sort((a, b) => b.archivedAt - a.archivedAt),
    [archive]
  );

  const activeArchived = selectedArchiveId
    ? sortedArchive.find((a) => a.id === selectedArchiveId) || null
    : null;
  const displayedEdition: NewspaperEdition = activeArchived || edition;

  return (
    <div className="min-h-screen bg-[#15120e] px-4 py-10 sm:px-8 sm:py-14">
      {sortedArchive.length > 0 && (
        <div className="mx-auto mb-6 max-w-5xl rounded-2xl border border-[#d4af37]/30 bg-[#0d0b08]/95 p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#f5dc82]">
              <Archive className="h-4 w-4 text-[#d4af37]" />
              <span>The DQR Chronicle Archive ({sortedArchive.length + 1} Issues)</span>
            </div>
            {activeArchived && (
              <button
                type="button"
                onClick={() => setSelectedArchiveId(null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-bold text-[#08080a] cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Current Edition</span>
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedArchiveId(null)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedArchiveId === null
                  ? 'border-[#f5dc82] bg-[#d4af37]/20 text-[#fde68a]'
                  : 'border-white/15 bg-black/30 text-neutral-300 hover:border-white/30 hover:text-white'
              }`}
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Current · {edition.volumeLabel}</span>
            </button>

            {sortedArchive.map((item) => {
              const isSelected = selectedArchiveId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedArchiveId(item.id)}
                  className={`rounded-xl border px-3 py-1.5 text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#f5dc82] bg-[#d4af37]/20 font-semibold text-[#fde68a]'
                      : 'border-white/15 bg-black/30 text-neutral-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="font-mono">{item.volumeLabel}</span>
                  <span className="ml-1.5 text-neutral-400">· {item.dateLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.article
          key={activeArchived ? activeArchived.id : 'live-edition'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backgroundColor: displayedEdition.paperBg,
            color: displayedEdition.inkColor,
          }}
          className="mx-auto max-w-5xl rounded-sm border border-black/25 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)] sm:p-12"
        >
          {activeArchived && (
            <div
              style={{ borderColor: displayedEdition.accentColor }}
              className="mb-5 flex flex-wrap items-center justify-between gap-2 border border-dashed bg-black/[0.04] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider"
            >
              <span>Archived Issue · {activeArchived.dateLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedArchiveId(null)}
                style={{ color: displayedEdition.accentColor }}
                className="underline cursor-pointer"
              >
                Return to Live Issue
              </button>
            </div>
          )}

          {/* Top Masthead Rule */}
          <div
            style={{ borderColor: displayedEdition.inkColor }}
            className="border-b-4 pb-4 text-center"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 pb-2 font-mono text-[11px] tracking-widest uppercase opacity-75">
              <span>{displayedEdition.volumeLabel}</span>
              <span>{displayedEdition.dateLabel}</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, letterSpacing: '0.16em' }}
              animate={{ opacity: 1, letterSpacing: '0.06em' }}
              transition={{ duration: 0.6 }}
              className="mt-4 font-display text-4xl font-extrabold tracking-wide uppercase sm:text-6xl"
            >
              {displayedEdition.masthead}
            </motion.h1>
          </div>

          {/* Double hairline divider */}
          <div
            style={{ borderColor: displayedEdition.accentColor }}
            className="mt-1 border-b-2"
          />

          {/* Lead Headline */}
          <div className="mt-7 text-center">
            <h2
              style={{ color: displayedEdition.accentColor }}
              className="font-display text-2xl leading-tight font-extrabold uppercase sm:text-4xl"
            >
              {displayedEdition.headline}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl font-display text-base italic opacity-85 sm:text-lg">
              {displayedEdition.subheadline}
            </p>
          </div>

          {/* Editorial Grid */}
          <div className="mt-8 grid gap-8 border-t border-black/20 pt-8 lg:grid-cols-12">
            {/* Main Column */}
            <div className="space-y-5 lg:col-span-8 lg:border-r lg:border-black/20 lg:pr-8">
              {displayedEdition.featuredImageUrl && (
                <figure className="overflow-hidden border border-black/30 bg-black/5">
                  <img
                    src={displayedEdition.featuredImageUrl}
                    alt={displayedEdition.headline}
                    referrerPolicy="no-referrer"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </figure>
              )}

              <p
                style={{ color: displayedEdition.accentColor }}
                className="font-mono text-xs font-bold tracking-wider uppercase"
              >
                {displayedEdition.leadAuthor}
              </p>

              <div className="space-y-4 text-[15px] leading-relaxed whitespace-pre-line">
                {displayedEdition.leadBody}
              </div>
            </div>

            {/* Right Sidebar Column */}
            <aside className="flex flex-col justify-between gap-6 lg:col-span-4">
              <div className="border border-black/25 bg-black/[0.03] p-5">
                <h3
                  style={{ color: displayedEdition.accentColor }}
                  className="border-b border-black/20 pb-2 font-display text-lg font-bold uppercase"
                >
                  {displayedEdition.sideTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                  {displayedEdition.sideBody}
                </p>
              </div>

              <blockquote
                style={{ borderColor: displayedEdition.accentColor }}
                className="border-y-2 py-5 text-center"
              >
                <p className="font-display text-lg italic leading-snug">
                  “{displayedEdition.quoteText}”
                </p>
                <footer className="mt-2 font-mono text-xs font-semibold uppercase opacity-75">
                  — {displayedEdition.quoteAuthor}
                </footer>
              </blockquote>
            </aside>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
