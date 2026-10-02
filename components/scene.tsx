import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

// Building blocks for the Live Events boards: a plate (the empty room) with sprites placed on it in percentages.

export type Anchor = 'center' | 'bottom-center';

const move: Record<Anchor, string> = { center: 'translate(-50%, -50%)', 'bottom-center': 'translate(-50%, -100%)' };
const css = (vars: Record<string, string | number | undefined>) => vars as CSSProperties;

export function Plate({ src, delay = 0, priority = false }: { src: string; delay?: number; priority?: boolean }) {
  return (
    <div className="sc-plate" style={css({ '--d': `${delay}s` })}>
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        loading={priority ? undefined : 'eager'}
        unoptimized
        draggable={false}
      />
    </div>
  );
}

type SpriteProps = {
  src?: string;
  x: number;
  y: number;
  w: number;
  anchor?: Anchor;
  z?: number;
  flip?: boolean;
  delay?: number;
  // how the sprite comes in: a fade with a small rise (default), or no entrance at all
  enter?: 'rise' | 'none';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function Sprite({
  src,
  x,
  y,
  w,
  anchor = 'center',
  z = 10,
  flip = false,
  delay = 0,
  enter = 'rise',
  className = '',
  style,
  children,
}: SpriteProps) {
  return (
    <div
      className={`sc-sprite ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        zIndex: z,
        transform: `${move[anchor]}${flip ? ' scaleX(-1)' : ''}`,
        ...style,
      }}
    >
      <div className={enter === 'rise' ? 'sc-in' : 'sc-still'} style={css({ '--d': `${delay}s` })}>
        {src && <Image src={src} alt="" width={640} height={640} loading="eager" unoptimized draggable={false} />}
        {children}
      </div>
    </div>
  );
}

// Two poses of the same figure, swapped in turn (a walk cycle, an arm going up and down).
// `period` is the length of one full cycle in seconds.
export function Frames({ srcs, period = 0.6, delay = 0 }: { srcs: string[]; period?: number; delay?: number }) {
  return (
    <>
      {srcs.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={640}
          height={640}
          loading="eager"
          unoptimized
          draggable={false}
          className={`sc-frame sc-frame-${srcs.length}`}
          style={css({ '--n': srcs.length, '--i': i, '--period': `${period}s`, '--d': `${delay}s` })}
        />
      ))}
    </>
  );
}

// A walk cycle that runs a set number of steps and then holds its last pose (so a figure can stop walking).
export function WalkFrames({
  a,
  b,
  period = 0.6,
  cycles = 6,
  delay = 0,
}: {
  a: string;
  b: string;
  period?: number;
  cycles?: number;
  delay?: number;
}) {
  const vars = css({ '--period': `${period}s`, '--cycles': cycles, '--d': `${delay}s` });
  return (
    <>
      <Image
        src={a}
        alt=""
        width={640}
        height={640}
        loading="eager"
        unoptimized
        draggable={false}
        className="sc-pf sc-pf-a"
        style={vars}
      />
      <Image
        src={b}
        alt=""
        width={640}
        height={640}
        loading="eager"
        unoptimized
        draggable={false}
        className="sc-pf sc-pf-b"
        style={vars}
      />
    </>
  );
}
