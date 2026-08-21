import React, { useRef } from 'react';
import { JournalStats } from '../types';
import { BookOpen, Film, Lightbulb, CheckCircle2, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface StatsOverviewProps {
  stats: JournalStats;
}

const StatCounter: React.FC<{ value: number }> = ({ value }) => {
  const counterRef = useRef<HTMLDivElement>(null);
  const countObj = useRef({ val: 0 });

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        if (counterRef.current) {
          counterRef.current.textContent = String(value);
        }
        return;
      }

      gsap.to(countObj.current, {
        val: value,
        duration: 0.8,
        ease: EASING.smooth,
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = Math.round(countObj.current.val).toString();
          }
        },
      });
    },
    { dependencies: [value] }
  );

  return (
    <div
      ref={counterRef}
      className="mono"
      style={{
        fontSize: '28px',
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 1,
      }}
    >
      {value}
    </div>
  );
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;

      const cards = containerRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.06,
          ease: EASING.spring,
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: containerRef }
  );

  const cards = [
    {
      title: 'Watching Now',
      value: stats.activeWatching,
      icon: <Film size={18} color="#fbbf24" />,
      subtext: 'Anime series in progress',
      borderGlow: 'rgba(245, 158, 11, 0.2)',
    },
    {
      title: 'Reading Now',
      value: stats.activeReading,
      icon: <BookOpen size={18} color="#38bdf8" />,
      subtext: 'Books in progress',
      borderGlow: 'rgba(56, 189, 248, 0.2)',
    },
    {
      title: 'Lessons Logged',
      value: stats.totalLessons,
      icon: <Lightbulb size={18} color="#c0c1ff" />,
      subtext: 'Memories & takeaways',
      borderGlow: 'rgba(99, 102, 241, 0.3)',
      highlight: true,
    },
    {
      title: 'Completed',
      value: stats.totalCompleted,
      icon: <CheckCircle2 size={18} color="#34d399" />,
      subtext: 'Finished journeys',
      borderGlow: 'rgba(16, 185, 129, 0.2)',
    },
    {
      title: 'Rewatches',
      value: stats.rewatchesCount,
      icon: <RotateCcw size={18} color="#c4c1fb" />,
      subtext: 'Deepened passes',
      borderGlow: 'rgba(196, 193, 251, 0.2)',
    },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          className="glass-card stat-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderColor: card.highlight ? 'var(--color-primary-action)' : undefined,
            background: card.highlight
              ? 'linear-gradient(145deg, rgba(18, 33, 49, 0.9), rgba(99, 102, 241, 0.12))'
              : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {card.title}
            </span>
            <div
              style={{
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              {card.icon}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <StatCounter value={card.value} />
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {card.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
