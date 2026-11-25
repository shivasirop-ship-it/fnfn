import { motion } from 'motion/react';
import { TitleItem } from '../types';

interface TitleBadgeProps {
  title: TitleItem;
  size?: 'sm' | 'md' | 'lg';
}

export function TitleBadge({ title, size = 'md' }: TitleBadgeProps) {
  const padding =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px]'
      : size === 'lg'
        ? 'px-5 py-2 text-sm'
        : 'px-3.5 py-1.5 text-xs';

  const animProps = (() => {
    switch (title.animation) {
      case 'float':
        return {
          animate: { y: [0, -3, 0] },
          transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'pulse-glow':
        return {
          animate: {
            boxShadow: [
              `0 0 8px ${title.borderColor}55`,
              `0 0 20px ${title.borderColor}cc`,
              `0 0 8px ${title.borderColor}55`,
            ],
          },
          transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'neon-aura':
        return {
          animate: { scale: [1, 1.03, 1] },
          transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const },
        };
      default:
        return {};
    }
  })();

  return (
    <motion.span
      {...animProps}
      style={{
        backgroundColor: title.bgColor,
        color: title.textColor,
        borderColor: title.borderColor,
      }}
      className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border font-display font-bold tracking-wide shadow-sm whitespace-nowrap ${padding}`}
    >
      {(title.animation === 'shimmer' ||
        title.animation === 'gradient-sweep') && (
        <motion.span
          aria-hidden="true"
          animate={{ x: ['-120%', '220%'] }}
          transition={{
            duration: title.animation === 'gradient-sweep' ? 2.1 : 3.2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${title.textColor}45, transparent)`,
          }}
          className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12"
        />
      )}
      <span className="relative z-10">{title.name}</span>
    </motion.span>
  );
}
