'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { Division } from '@/data/division';
import { photos, type Photo } from '@/data/photos';
import { SectionHeading } from './ui';
import { EventsGraphic } from './events-graphics';
import { PlanScene, FlowScene, RackScene, InstallScene, CommissionScene } from './sketch/integration';
import { EventPlanScene, EventFlowScene, EventRackScene, EventSetupScene, ShowScene } from './sketch/events';

type Step = { title: string; text: string; scene?: ReactNode; graphic?: number; caption: string };
type Config = {
  eyebrow: string;
  title: string;
  text: string;
  steps: Step[];
  done?: { title: string; text: string; photo: Photo };
};

const config: Record<Division | 'eventsGraphics', Config> = {
  integration: {
    eyebrow: 'How we work',
    title: 'How we build a system.',
    text: 'Every project starts as a sketch. Scroll to watch one come together, from the first drawing to a room that is tested and handed over.',
    steps: [
      {
        title: 'Sketch the room',
        text: 'We start on paper: the room, the furniture, the displays, the ceiling speakers, the cameras and the microphones, each in its place before anything is bought.',
        scene: <PlanScene />,
        caption:
          'Ceiling plan of a conference room: table, chairs, displays, ceiling speakers, cameras and microphones.',
      },
      {
        title: 'Draw the signal flow',
        text: 'Every microphone, camera and screen gets a path. We map audio, video, USB and control so the system makes sense before it is built.',
        scene: <FlowScene />,
        caption:
          'Signal line diagram: microphones, DSP, amplifier and speakers; cameras, UC engine and switch to the displays.',
      },
      {
        title: 'Lay out the rack',
        text: 'The equipment rack is planned unit by unit: network switch, control processor, DSP, amplifier, power and clean cable management.',
        scene: <RackScene />,
        caption: 'Front view of an equipment rack with labeled units and cable management.',
      },
      {
        title: 'Install',
        text: 'Technicians install the system in the room: displays, ceiling speakers, cameras and microphones, wired to the plan.',
        scene: <InstallScene />,
        caption: 'Perspective drawing of the finished room with displays, ceiling speakers, a camera and a table.',
      },
      {
        title: 'Program and commission',
        text: 'We program the DSP and control, configure the cameras and displays, then test and tune everything. Programming and commissioning go hand in hand. Then we document it and hand it over.',
        scene: <CommissionScene />,
        caption:
          'A laptop with configuration software in front of a room where the display, cameras and microphone are coming alive.',
      },
    ],
    done: {
      title: 'Your system is done.',
      text: 'Tested, documented and ready for the people who use the room.',
      photo: photos.roomGrand,
    },
  },
  events: {
    eyebrow: 'How we work',
    title: 'How we run a show.',
    text: 'Every event starts as a sketch too. Scroll to follow the technical side from the venue plan to showtime.',
    steps: [
      {
        title: 'Plan the venue',
        text: 'We sketch the room: stage, screens, speakers, tables, camera and mix positions, so the layout works before load-in.',
        scene: <EventPlanScene />,
        caption:
          'Venue plan with stage, LED screens, line arrays, subs, round tables, camera and front-of-house position.',
      },
      {
        title: 'Map the signal',
        text: 'Microphones, playback, cameras, the console and the screens are laid out as one signal flow, so nothing is left to chance on the day.',
        scene: <EventFlowScene />,
        caption:
          'Signal line diagram from microphones and playback through the console and processor to line arrays and LED screens.',
      },
      {
        title: 'Build the racks',
        text: 'Equipment is racked and labeled in advance: wireless receivers, network, processing, video switching and playback.',
        scene: <EventRackScene />,
        caption:
          'Front view of a road case rack with receivers, switch, processor, video switcher, playback computer and amplifiers.',
      },
      {
        title: 'Load in and set up',
        text: 'Our crew builds the system on site: stage, screens, truss, speakers and the mix position, wired to the plan.',
        scene: <EventSetupScene />,
        caption:
          'Perspective drawing of a venue with a stage, LED wall, truss with lights, tables and a front-of-house position.',
      },
      {
        title: 'Test and run the show',
        text: 'We sound check, test every source and then run the show, so the audio and video are right when the doors open.',
        scene: <ShowScene />,
        caption: 'Stage with a LED screen, lights and speakers, an audience and the mix position with moving faders.',
      },
    ],
    done: {
      title: 'Showtime.',
      text: 'Tested, rehearsed and ready for your audience.',
      photo: photos.ballroomWide,
    },
  },
  eventsGraphics: {
    eyebrow: 'How we work',
    title: 'How we run a show.',
    text: 'Every event starts as a sketch. Scroll to watch it become a system, then a stage, then a live show.',
    steps: [
      {
        title: 'We build the sketch',
        text: 'We start with a plan of the room: stage, screens, speaker arrays, seating, camera risers and a tech platform for audio, video, graphics and lighting.',
        graphic: 0,
        caption:
          'Concept board of an event room: stage with screens and speaker arrays, audience seating, camera risers and the tech platform.',
      },
      {
        title: 'We build the signal line diagram',
        text: 'Video, audio, lighting control and wireless are mapped from every source to every screen, speaker and light, so nothing is left to chance on the day.',
        graphic: 1,
        caption:
          'Signal line diagram: video in orange, audio in blue, lighting control in white dashes and wireless in orange dashes, from cameras, laptops and microphones to screens, speakers and lights.',
      },
      {
        title: 'We build the estimate',
        text: 'Equipment, crew and services are priced line by line straight from the plan. We go through it together, adjust what you need, and once it is right you approve and sign.',
        graphic: 4,
        caption:
          'Show estimate: equipment, labor and services with quantities and prices, approved and signed by the client.',
      },
      {
        title: 'We build the stage',
        text: 'Truss, line arrays, lights, screens, the stage and the tech tables go up in order, wired to the plan, with audio, video and lighting positions ready at the back of the room.',
        graphic: 2,
        caption:
          'Concept board of the built stage seen from the tech tables: truss, lights, line arrays, three screens, camera risers and the audio, video and lighting consoles.',
      },
      {
        title: 'We run the show',
        text: 'Audio, video and lighting operators run the show live while the audience watches, so every cue lands and the screens, sound and lights stay in sync.',
        graphic: 3,
        caption:
          'A live event: a presenter at the podium, three active screens, stage lights, an audience at round tables and operators at the control positions.',
      },
    ],
  },
};

export function SketchDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="sk-defs">
      <defs>
        {/* a small wobble for the hand-drawn look, smoothed so lines stay clean */}
        <filter id="sk-rough" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="wobble" />
          <feGaussianBlur in="wobble" stdDeviation="0.35" />
        </filter>
        {/* a pencil drawing: clean dark outlines over light pastel color on paper */}
        <filter id="sk-pencil" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="soft" />
          <feColorMatrix
            in="soft"
            type="matrix"
            values="0.3 0.6 0.1 0 0  0.3 0.6 0.1 0 0  0.3 0.6 0.1 0 0  0 0 0 1 0"
            result="gray"
          />
          <feConvolveMatrix
            in="gray"
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            preserveAlpha="true"
            result="edge"
          />
          <feColorMatrix
            in="edge"
            type="matrix"
            values="-11 0 0 0 1.1  0 -11 0 0 1.1  0 0 -11 0 1.1  0 0 0 1 0"
            result="lines0"
          />
          <feGaussianBlur in="lines0" stdDeviation="0.45" result="lines" />
          <feComponentTransfer in="soft" result="pastel">
            <feFuncR type="linear" slope="0.5" intercept="0.48" />
            <feFuncG type="linear" slope="0.5" intercept="0.48" />
            <feFuncB type="linear" slope="0.5" intercept="0.48" />
          </feComponentTransfer>
          <feBlend in="pastel" in2="lines" mode="multiply" result="drawn" />
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.7" numOctaves="2" seed="5" result="streak" />
          <feColorMatrix
            in="streak"
            type="matrix"
            values="0 0 0 0 0.97  0 0 0 0 0.96  0 0 0 0 0.93  0 0 0 0.45 0.62"
            result="paper"
          />
          <feBlend in="drawn" in2="paper" mode="multiply" />
        </filter>
      </defs>
    </svg>
  );
}
// `?how=svg` shows the line-drawn version of the Live Events sketches instead of the concept boards.
const noop = () => () => {};
function useEventsVariant(): 'graphics' | 'svg' {
  return useSyncExternalStore(
    noop,
    () => (new URLSearchParams(window.location.search).get('how') === 'svg' ? 'svg' : 'graphics'),
    () => 'graphics',
  );
}

// Phones get an auto-playing carousel instead of the scroll-driven layout.
const MOBILE = '(max-width: 900px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// How long each step stays on screen in the carousel, by Live Events board (sketch, signal, stage, show, estimate).
const GRAPHIC_MS = [8000, 6500, 9500, 7500, 9500];
const SCENE_MS = 8000;
const DONE_MS = 6000;

function StageCard({ c, active, visible, run }: { c: Config; active: number; visible: boolean; run: number }) {
  const step = c.steps[active];
  const graphic = step?.graphic !== undefined;
  return (
    <div className={graphic ? 'sketch-card graphic-card' : 'sketch-card'}>
      {!visible ? null : step && graphic ? (
        <EventsGraphic key={`${run}-${active}`} index={step.graphic as number} label={step.caption} />
      ) : step ? (
        <svg
          key={`${run}-${active}`}
          className="sketch"
          viewBox="0 0 800 560"
          role="img"
          aria-label={step.caption}
          data-step={active}
        >
          <g filter="url(#sk-rough)">{step.scene}</g>
        </svg>
      ) : c.done ? (
        <figure key={`done-${run}`} className="done-photo" aria-label={c.done.photo.alt}>
          <Image
            src={c.done.photo.src}
            alt={c.done.photo.alt}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            className="done-img"
          />
          <figcaption>{c.done.title}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}

export function HowItWorks({ division, id }: { division: Division; id?: string }) {
  const variant = useEventsVariant();
  const mobile = useMedia(MOBILE);
  const c = division === 'events' && variant === 'graphics' ? config.eventsGraphics : config[division];
  return mobile ? <HowMobile division={division} id={id} c={c} /> : <HowDesktop division={division} id={id} c={c} />;
}

function HowMobile({ division, id, c }: { division: Division; id?: string; c: Config }) {
  const items = [
    ...c.steps.map((s, i) => ({ num: String(i + 1).padStart(2, '0'), title: s.title, text: s.text })),
    ...(c.done ? [{ num: '✓', title: c.done.title, text: c.done.text }] : []),
  ];
  const total = items.length;
  const reduced = useMedia(REDUCED);
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setRun((r) => r + 1);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The text slides out to the right, then the next step slides in from the left together with its drawing.
  function goTo(next: number) {
    if (next === active) return;
    window.clearTimeout(timer.current);
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setActive(next);
      setLeaving(false);
    }, 240);
  }

  const step = c.steps[active];
  const ms = step ? (step.graphic !== undefined ? GRAPHIC_MS[step.graphic] : SCENE_MS) : DONE_MS;

  return (
    <section className="section container how how-mobile" id={id} data-how={division}>
      <SectionHeading eyebrow={c.eyebrow} title={c.title} text={c.text} />

      <SketchDefs />

      <div className="hm" ref={root}>
        <div className={leaving ? 'hm-text is-leaving' : 'hm-text'} aria-live="polite">
          {items.map((it, i) => (
            <article
              key={it.title}
              className={i === active ? 'hm-slide is-active' : 'hm-slide'}
              aria-hidden={i !== active}
            >
              <span className="how-num">{it.num}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </article>
          ))}
        </div>

        <div className="hm-meta" aria-hidden="true">
          <span className="hm-count">
            {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="hm-bar">
            <span
              key={`${run}-${active}`}
              className={reduced ? 'hm-fill is-static' : visible && !leaving ? 'hm-fill' : 'hm-fill is-paused'}
              style={{ '--ms': `${ms}ms` } as CSSProperties}
              onAnimationEnd={() => goTo((active + 1) % total)}
            />
          </div>
        </div>

        <StageCard c={c} active={active} visible={visible} run={run} />

        <div className="hm-dots">
          {items.map((it, i) => (
            <button
              key={it.title}
              type="button"
              className={i === active ? 'on' : undefined}
              aria-label={`Step ${i + 1}: ${it.title}`}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowDesktop({ division, id, c }: { division: Division; id?: string; c: Config }) {
  const [active, setActive] = useState(0);
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0);
  const total = c.steps.length + (c.done ? 1 : 0);

  // Draw only while the sketch is on screen, and draw it again every time the visitor comes back to it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setRun((r) => r + 1);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    );
    blocks.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [total, c]);

  return (
    <section className="section container how" id={id} data-how={division}>
      <SectionHeading eyebrow={c.eyebrow} title={c.title} text={c.text} />

      <SketchDefs />

      <div className="how-grid">
        <div className="how-steps">
          {c.steps.map((s, i) => (
            <article
              key={s.title}
              ref={(el) => {
                blocks.current[i] = el;
              }}
              data-i={i}
              className={active === i ? 'how-step is-active' : 'how-step'}
              aria-current={active === i ? 'step' : undefined}
            >
              <span className="how-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
          {c.done && (
            <article
              ref={(el) => {
                blocks.current[c.steps.length] = el;
              }}
              data-i={c.steps.length}
              className={active === c.steps.length ? 'how-step is-active how-done' : 'how-step how-done'}
            >
              <span className="how-num">✓</span>
              <h3>{c.done.title}</h3>
              <p>{c.done.text}</p>
            </article>
          )}
        </div>

        <div className="how-stage" ref={stage}>
          <StageCard c={c} active={active} visible={visible} run={run} />
          <div className="how-progress" aria-hidden="true">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={i === active ? 'on' : i < active ? 'past' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
