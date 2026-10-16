'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  analyze,
  applyPreset,
  decodePlan,
  defaultPlan,
  encodePlan,
  formatLength,
  fromUnit,
  limits,
  normalizePlan,
  planSummary,
  rules,
  tableSize,
  toUnit,
  type Plan,
  type Preset,
} from '@/lib/planner/model';
import PlannerScene, { type Capture, type ViewName, type ViewState } from './scene';

const steps = ['Room', 'Layout', 'Display', 'Audio', 'Video', 'Control', 'Summary'] as const;

type Option<T> = { value: T; label: string };

function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="planner-field">
      <legend>{label}</legend>
      <div className="planner-seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="planner-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

// A length in the chosen unit. The text is kept as typed until the field loses focus.
function Length({
  label,
  metres,
  unit,
  onChange,
}: {
  label: string;
  metres: number;
  unit: Plan['unit'];
  onChange: (m: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = String(Math.round(toUnit(metres, unit) * 10) / 10);
  const commit = () => {
    if (draft !== null) {
      const n = parseFloat(draft.replace(',', '.'));
      if (Number.isFinite(n)) onChange(fromUnit(n, unit));
      setDraft(null);
    }
  };
  const bump = (dir: number) => onChange(metres + dir * (unit === 'ft' ? 1 / 3.28084 : 0.5));
  return (
    <div className="planner-field">
      <label htmlFor={id}>
        {label} <span className="planner-unit">({unit})</span>
      </label>
      <div className="planner-num">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-1)}>
          −
        </button>
        <input
          id={id}
          inputMode="decimal"
          value={draft ?? shown}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Count({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="planner-field">
      <span className="planner-label">{label}</span>
      <div className="planner-num">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

const presetText: Record<Preset, string> = {
  essential: 'Soundbar, built-in microphones, one PTZ camera',
  standard: 'Wall speakers, ceiling microphones, two PTZ cameras, touch panel',
  premium: 'Two displays, ceiling audio, three PTZ cameras, touch panel',
};

// A plan can arrive in the address (#p=...), for example from a shared link. This component only runs in the browser.
function planFromAddress(): Plan {
  if (typeof window === 'undefined') return defaultPlan;
  const m = /[#&]p=([^&]+)/.exec(window.location.hash);
  return (m && decodePlan(m[1])) || defaultPlan;
}

export default function RoomPlanner() {
  const [plan, setPlan] = useState<Plan>(planFromAddress);
  const [step, setStep] = useState(0);
  const [view, setView] = useState<ViewState>({ name: 'iso', nonce: 0 });
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  const capture = useRef<Capture | null>(null);

  useEffect(() => {
    const t = setTimeout(() => history.replaceState(null, '', `#p=${encodePlan(plan)}`), 400);
    return () => clearTimeout(t);
  }, [plan]);

  const set = useCallback(
    <K extends keyof Plan>(key: K, value: Plan[K]) => setPlan((p) => normalizePlan({ ...p, [key]: value })),
    [],
  );
  const analysis = useMemo(() => analyze(plan), [plan]);
  // Coverage overlays belong to their own step; the other steps and the summary show a clean room.
  const scenePlan = useMemo<Plan>(
    () => ({
      ...plan,
      speakerCones: plan.speakerCones && step === 3,
      listeningPlane: plan.listeningPlane && step === 3,
      micCoverage: plan.micCoverage && step === 3,
      cameraView: plan.cameraView && step === 4,
    }),
    [plan, step],
  );
  const movePresenter = useCallback(
    (x: number, z: number) => setPlan((p) => normalizePlan({ ...p, presenterX: x, presenterZ: z })),
    [],
  );
  const onReady = useCallback((fn: Capture) => {
    capture.current = fn;
  }, []);
  const show = (name: ViewName) => setView((v) => ({ name, nonce: v.nonce + 1 }));

  const u = plan.unit;
  const { layout, displays, gear, items, warnings } = analysis;
  const link =
    typeof window === 'undefined' ? '' : `${window.location.origin}/integration/planner#p=${encodePlan(plan)}`;
  const requestHref = `/integration/quote?service=${encodeURIComponent('Commercial AV')}&context=${encodeURIComponent(planSummary(plan, link))}`;

  const download = async () => {
    const blob = await capture.current?.();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'k4av-room-plan.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    setTimeout(() => setCopied(null), 3000);
  };

  const tableDim = tableSize(plan.shape, plan.seats, layout.endChairs);

  return (
    <section className="planner" aria-label="Room planner">
      <div className="planner-panel">
        <ol className="planner-steps" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                aria-current={i === step ? 'step' : undefined}
                data-done={i < step || undefined}
                onClick={() => setStep(i)}
              >
                <span>{i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>

        <div className="planner-body">
          {step === 0 && (
            <>
              <h2>Your room</h2>
              <div className="planner-field">
                <span className="planner-label">Start from a package</span>
                <div className="planner-presets">
                  {(['essential', 'standard', 'premium'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setPlan((cur) => applyPreset(cur, p))}>
                      <strong>{p[0].toUpperCase() + p.slice(1)}</strong>
                      <small>{presetText[p]}</small>
                    </button>
                  ))}
                </div>
              </div>
              <Seg
                label="Units"
                value={plan.unit}
                options={[
                  { value: 'm', label: 'Metres' },
                  { value: 'ft', label: 'Feet' },
                ]}
                onChange={(v) => set('unit', v)}
              />
              <Length label="Length" metres={plan.length} unit={u} onChange={(m) => set('length', m)} />
              <Length label="Width" metres={plan.width} unit={u} onChange={(m) => set('width', m)} />
              <Length label="Ceiling height" metres={plan.height} unit={u} onChange={(m) => set('height', m)} />
              <Check label="Show the ceiling" checked={plan.ceiling} onChange={(v) => set('ceiling', v)} />
              <p className="planner-hint">
                Up to {limits.length[1]} m ({Math.round(limits.length[1] * 3.28)} ft). The display is on the wall at the
                far end.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Table and seats</h2>
              <Seg
                label="Table shape"
                value={plan.shape}
                options={[
                  { value: 'rect', label: 'Rectangular' },
                  { value: 'round', label: 'Round' },
                ]}
                onChange={(v) => set('shape', v)}
              />
              <Count
                label="Seats"
                value={plan.seats}
                min={plan.shape === 'round' ? 3 : limits.seats[0]}
                max={plan.shape === 'round' ? 14 : limits.seats[1]}
                onChange={(n) => set('seats', n)}
              />
              <Seg
                label="Table position"
                value={plan.position}
                options={[
                  { value: 'center', label: 'Centered' },
                  { value: 'back', label: 'Towards the back' },
                  { value: 'front', label: 'Towards the display' },
                ]}
                onChange={(v) => set('position', v)}
              />
              {plan.shape === 'rect' && (
                <Check
                  label="Chairs at the ends of the table"
                  checked={plan.endChairs}
                  onChange={(v) => set('endChairs', v)}
                />
              )}
              <Check label="Show a presenter" checked={plan.presenter} onChange={(v) => set('presenter', v)} />
              {plan.presenter && (
                <p className="planner-hint">
                  Drag the presenter in the 3D view to move them.{' '}
                  {(plan.presenterX !== null || plan.presenterZ !== null) && (
                    <button
                      type="button"
                      className="planner-link"
                      onClick={() => setPlan((p) => normalizePlan({ ...p, presenterX: null, presenterZ: null }))}
                    >
                      Back to the display
                    </button>
                  )}
                </p>
              )}
              <p className="planner-hint">
                The table is sized for you: {formatLength(tableDim.length, u)} × {formatLength(tableDim.width, u)}.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Display</h2>
              <Seg
                label="Number of displays"
                value={plan.displays}
                options={[
                  { value: 1, label: 'One' },
                  { value: 2, label: 'Two' },
                ]}
                onChange={(v) => set('displays', v)}
              />
              <div className="planner-field">
                <label htmlFor="planner-size">Display size</label>
                <select
                  id="planner-size"
                  value={plan.displaySize ?? ''}
                  onChange={(e) => set('displaySize', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{displays.recommended}&quot; (recommended)</option>
                  {rules.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}&quot;
                    </option>
                  ))}
                </select>
              </div>
              <div className="planner-field">
                <label htmlFor="planner-read">Small text matters</label>
                <input
                  id="planner-read"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={plan.readability}
                  onChange={(e) => set('readability', Number(e.target.value))}
                />
                <div className="planner-range-labels">
                  <span>Less</span>
                  <span>More</span>
                </div>
              </div>
              <p className="planner-hint">
                Farthest seat: {formatLength(displays.farthest, u)}. With these settings, small text stays readable up
                to {formatLength(displays.maxDistance, u)}.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Audio</h2>
              <Seg
                label="Speakers"
                value={plan.speakers}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'soundbar', label: 'Soundbar' },
                  { value: 'front', label: 'Wall pair' },
                  { value: 'ceiling', label: 'Ceiling' },
                ]}
                onChange={(v) => set('speakers', v)}
              />
              <Check
                label="Show where the sound reaches"
                checked={plan.speakerCones}
                onChange={(v) => set('speakerCones', v)}
              />
              <Check
                label="Show the listening level"
                checked={plan.listeningPlane}
                onChange={(v) => set('listeningPlane', v)}
                hint="Seated head height"
              />
              <Seg
                label="Microphones"
                value={plan.mics}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'integrated', label: 'Built-in' },
                  { value: 'table', label: 'Table' },
                  { value: 'ceiling', label: 'Ceiling' },
                ]}
                onChange={(v) => set('mics', v)}
              />
              {plan.mics === 'ceiling' && (
                <Seg
                  label="Array shape"
                  value={plan.micShape}
                  options={[
                    { value: 'square', label: 'Square' },
                    { value: 'round', label: 'Round' },
                  ]}
                  onChange={(v) => set('micShape', v)}
                />
              )}
              <Check
                label="Show where voices are picked up"
                checked={plan.micCoverage}
                onChange={(v) => set('micCoverage', v)}
              />
              <p className="planner-hint">
                {plan.speakers === 'ceiling' && `${gear.speakers.length} ceiling speakers. `}
                {plan.mics === 'ceiling' &&
                  `${gear.mics.length} microphone array${gear.mics.length > 1 ? 's' : ''}, ${plan.micShape === 'round' ? 'round 25 in (635 mm)' : 'square 24 in (604 mm)'}, sized like the Shure MXA920. `}
                {plan.mics === 'table' && `${gear.mics.length} table microphones. `}
                Coverage is a simplified sketch, not an acoustic simulation.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Video</h2>
              <Seg
                label="PTZ cameras"
                value={plan.cameras}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'one', label: 'One' },
                  { value: 'two', label: 'Two' },
                  { value: 'three', label: 'Three' },
                ]}
                onChange={(v) => set('cameras', v)}
              />
              {plan.cameras === 'one' && (
                <Seg
                  label="Camera position"
                  value={plan.cameraSpot}
                  options={[
                    { value: 'above', label: 'Above the display' },
                    { value: 'below', label: 'Below the display' },
                  ]}
                  onChange={(v) => set('cameraSpot', v)}
                />
              )}
              <Check
                label="Show what the cameras see"
                checked={plan.cameraView}
                onChange={(v) => set('cameraView', v)}
              />
              <p className="planner-hint">
                {plan.cameras === 'none' && 'No camera: the room is not seen by remote people.'}
                {plan.cameras === 'one' &&
                  (plan.cameraSpot === 'above'
                    ? 'One PTZ camera on the centre line above the display: the usual choice, and it works for most rooms.'
                    : 'One PTZ camera on the centre line below the display, close to seated eye level. The display is mounted higher to make room for it.')}
                {plan.cameras === 'two' &&
                  'Two PTZ cameras on both sides of the display, aimed across the table so the system can pick the face-on view of whoever speaks.'}
                {plan.cameras === 'three' &&
                  'Two PTZ cameras beside the display and a third at the back of the room that follows the presenter. Show a presenter on the Layout step and drag them to see the camera turn.'}
                {plan.cameras !== 'none' && ' Sized like the Q-SYS NC-12x80: 170 × 201 × 142 mm.'}{' '}
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Control and platform</h2>
              <Check
                label="Connection panels in the table"
                checked={plan.tablePanels}
                onChange={(v) => set('tablePanels', v)}
                hint="Power and cables for laptops"
              />
              <Seg
                label="Touch panel"
                value={plan.control}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'table', label: 'On the table' },
                  { value: 'wall', label: 'On the wall' },
                ]}
                onChange={(v) => set('control', v)}
              />
              <Seg
                label="Meeting platform"
                value={plan.system}
                options={[
                  { value: 'byod', label: 'Bring your own' },
                  { value: 'teams', label: 'Teams' },
                  { value: 'zoom', label: 'Zoom' },
                  { value: 'webex', label: 'Webex' },
                  { value: 'meet', label: 'Meet' },
                ]}
                onChange={(v) => set('system', v)}
              />
            </>
          )}

          {step === 6 && (
            <>
              <h2>Your plan</h2>
              <p className="planner-hint">
                {formatLength(plan.length, u)} × {formatLength(plan.width, u)}, ceiling {formatLength(plan.height, u)}.{' '}
                {plan.seats} seats at a {plan.shape === 'round' ? 'round' : 'rectangular'} table.
              </p>
              <ul className="planner-items">
                {items.map((i) => (
                  <li key={i.name}>
                    <b>{i.qty}×</b>
                    <span>
                      {i.name}
                      {i.note && <small>{i.note}</small>}
                    </span>
                  </li>
                ))}
              </ul>
              {warnings.length > 0 && (
                <ul className="planner-warnings" aria-label="Things to check">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <div className="planner-actions">
                <a className="button" href={requestHref}>
                  Ask K4 AV Group for a quote
                </a>
                <button type="button" className="button secondary" onClick={download}>
                  Download the picture
                </button>
                <button type="button" className="button secondary" onClick={copy}>
                  {copied === 'done'
                    ? 'Link copied'
                    : copied === 'failed'
                      ? 'Copy it from the address bar'
                      : 'Copy the link to this plan'}
                </button>
              </div>
              <p className="planner-hint">
                This is a sketch to start the conversation. We confirm dimensions, equipment and price after looking at
                the room.
              </p>
            </>
          )}
        </div>

        <div className="planner-nav">
          <button
            type="button"
            className="button secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="button" onClick={() => setStep((s) => s + 1)}>
              Next: {steps[step + 1]}
            </button>
          ) : (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setPlan(defaultPlan);
                setStep(0);
              }}
            >
              Start over
            </button>
          )}
        </div>
      </div>

      <div className="planner-stage">
        <PlannerScene
          plan={scenePlan}
          analysis={analysis}
          view={view}
          onReady={onReady}
          onPresenterMove={movePresenter}
        />
        <div className="planner-views" role="group" aria-label="Camera view">
          <button type="button" onClick={() => show('iso')}>
            3D
          </button>
          <button type="button" onClick={() => show('top')}>
            Top
          </button>
          <button type="button" onClick={() => show('front')}>
            Front
          </button>
          <button type="button" onClick={() => show('side')}>
            Side
          </button>
        </div>
        <p className="planner-disclaimer">Indicative sketch. Check dimensions on site.</p>
      </div>
    </section>
  );
}
