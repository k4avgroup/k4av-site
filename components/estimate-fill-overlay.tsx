import type { CSSProperties } from 'react';
import data from '@/data/estimate-fill-coordinates.json';

// Fills the blank cells of the Show Estimate board. Every quantity, price and position comes from the JSON.

type Point = { x: number; y: number };
type Cell = { key: string; text: string; at: Point; price: boolean; start: number };

function build(base: number) {
  const a = data.animation;
  const cells: Cell[] = [];
  let t = base + a.initialDelayMs;

  for (const row of data.equipment) {
    cells.push({ key: `${row.id}-qty`, text: row.qty, at: row.qtyPosition, price: false, start: t });
    t += a.equipmentQtyDelayMs;
  }
  for (const row of data.equipment) {
    cells.push({ key: `${row.id}-price`, text: row.price, at: row.pricePosition, price: true, start: t });
    t += a.equipmentPriceDelayMs;
  }
  for (const row of data.labor) {
    cells.push({ key: `${row.id}-qty`, text: row.qty, at: row.qtyPosition, price: false, start: t });
    cells.push({ key: `${row.id}-price`, text: row.price, at: row.pricePosition, price: true, start: t + 60 });
    t += a.laborDelayMs;
  }
  for (const row of data.services) {
    cells.push({ key: `${row.id}-price`, text: row.price, at: row.pricePosition, price: true, start: t });
    t += a.servicesDelayMs;
  }

  const check = t + a.approvalPauseMs;
  const sign = check + a.checkmarkDurationMs + 120;
  const date = sign + a.signatureDurationMs + 150;
  return { cells, check, sign, date };
}

const ms = (n: number): CSSProperties => ({ '--d': `${n}ms` }) as CSSProperties;
const at = (p: Point): CSSProperties => ({ left: `${p.x}%`, top: `${p.y}%` });

export function EstimateFillOverlay({ delay = 2000 }: { delay?: number }) {
  const { cells, check, sign, date } = build(delay);
  const a = data.animation;
  const { checkbox, signature, date: dateField } = data.approval;
  return (
    <div className="ef-overlay" aria-hidden="true">
      {cells.map((c) => (
        <span key={c.key} className={c.price ? 'ef-cell ef-price' : 'ef-cell'} style={{ ...at(c.at), ...ms(c.start) }}>
          {c.text}
        </span>
      ))}
      {checkbox.value && (
        <svg
          className="ef-check"
          viewBox="0 0 24 24"
          style={{ ...at(checkbox), ...ms(check), '--dur': `${a.checkmarkDurationMs}ms` } as CSSProperties}
        >
          <path d="M4 13 L9.5 18.5 L20 5.5" pathLength={1} />
        </svg>
      )}
      {signature.value && (
        <svg
          className="ef-sign"
          viewBox="0 0 200 60"
          style={{ ...at(signature), ...ms(sign), '--dur': `${a.signatureDurationMs}ms` } as CSSProperties}
        >
          <path
            d="M8 40 C 18 8, 30 6, 34 22 C 38 40, 22 50, 26 36 C 32 18, 52 14, 56 30 C 58 40, 52 44, 60 36 C 70 24, 76 40, 84 34 C 92 28, 96 44, 104 36 C 112 26, 118 44, 128 32 C 138 20, 146 40, 156 34 L 192 26"
            pathLength={1}
          />
        </svg>
      )}
      <span className="ef-cell ef-date" style={{ ...at(dateField), ...ms(date) }}>
        {dateField.value}
      </span>
    </div>
  );
}
