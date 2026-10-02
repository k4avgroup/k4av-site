'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import data from '@/data/signal-diagram-labels.json';

// Labels and legend for the Signal Line Diagram board, laid over the image in percentages of the image box.
// Leader lines are measured from the rendered labels, so they stay attached when the board scales.

type Style = { label: string; color: string; lineStyle: string };
const styles = data.signalStyles as Record<string, Style>;
const NEUTRAL = 'rgba(255, 255, 255, 0.88)';

const toneColor = (tone: string) => styles[tone]?.color ?? NEUTRAL;

type Leader = { id: string; x1: number; y1: number; x2: number; y2: number; color: string };

export function SignalDiagramOverlay({ delay = 3.2 }: { delay?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const next: Leader[] = [];
      for (const label of data.labels) {
        const node = labelRefs.current[label.id];
        if (!node || label.targetX === undefined || label.targetY === undefined) continue;
        const r = node.getBoundingClientRect();
        if (!r.width) continue; // hidden at this size
        const left = r.left - box.left;
        const right = r.right - box.left;
        const top = r.top - box.top;
        const bottom = r.bottom - box.top;
        const tx = (label.targetX / 100) * box.width;
        const ty = (label.targetY / 100) * box.height;
        let sx = Math.min(Math.max(tx, left), right);
        let sy = Math.min(Math.max(ty, top), bottom);
        // Leave a small gap between the text and the line, and start at the text edge facing the target.
        if (sy === ty) sy = ty < top ? top : bottom;
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.hypot(dx, dy) || 1;
        sx += (dx / len) * 3;
        sy += (dy / len) * 3;
        next.push({ id: label.id, x1: sx, y1: sy, x2: tx, y2: ty, color: toneColor(label.tone) });
      }
      setSize({ w: box.width, h: box.height });
      setLeaders(next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // Measure once right away and again when the fonts are ready, so the lines match the final text widths.
    const first = setTimeout(measure, 0);
    void document.fonts?.ready.then(measure);
    return () => {
      clearTimeout(first);
      observer.disconnect();
    };
  }, []);

  const { legend } = data;
  return (
    <div className="sd-overlay" ref={root} style={{ '--d': `${delay}s` } as CSSProperties} aria-hidden="true">
      {size.w > 0 && (
        <svg className="sd-leaders" viewBox={`0 0 ${size.w} ${size.h}`}>
          {leaders.map((l) => (
            <g key={l.id} stroke={l.color} fill={l.color}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={1.25} strokeLinecap="round" />
              <circle cx={l.x2} cy={l.y2} r={2.4} stroke="none" />
            </g>
          ))}
        </svg>
      )}
      {data.labels.map((label) => (
        <span
          key={label.id}
          ref={(node) => {
            labelRefs.current[label.id] = node;
          }}
          className="sd-label"
          data-align={label.align}
          data-priority={label.priority}
          style={{ left: `${label.x}%`, top: `${label.y}%`, color: toneColor(label.tone) }}
        >
          {label.text}
        </span>
      ))}
      <div className="sd-legend">
        <div className="sd-legend-title">{legend.title}</div>
        {legend.items.map((item) => (
          <div className="sd-legend-row" key={item.id}>
            <svg viewBox="0 0 28 6" width="26" height="6">
              <line
                x1="1"
                y1="3"
                x2="27"
                y2="3"
                stroke={item.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={item.lineStyle === 'dashed' ? '4 3.5' : undefined}
              />
            </svg>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
