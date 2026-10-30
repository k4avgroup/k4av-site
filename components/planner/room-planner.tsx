'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  analyze,
  applyPreset,
  applyRoomType,
  applyScenario,
  computeLayout,
  decodePlan,
  defaultPlan,
  coverageNote,
  displaySizes,
  encodePlan,
  formatLength,
  fromUnit,
  keepClear,
  limitsFor,
  moveRack,
  normalizePlan,
  planSummary,
  presetText,
  roomTypes,
  rules,
  scenarios,
  seatLimits,
  snapToWall,
  tableShapes,
  toUnit,
  type Plan,
  type RoomType,
} from '@/lib/planner/model';
import PlannerScene, { type Capture, type ViewName, type ViewState } from './scene';
import PlanDrawings from './plan-drawings';
import SignalFlow from './signal-flow';

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
  const [sheet, setSheet] = useState<'flow' | 'plans' | null>(null);
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
    (x: number, z: number) =>
      setPlan((p) => {
        const spot = keepClear(p, computeLayout(p), x, z);
        return normalizePlan({ ...p, presenterX: spot.x, presenterZ: spot.z });
      }),
    [],
  );
  // the cabinet with the wireless microphones and the rack stand against a wall (the rack may also stand outside)
  const moveCredenza = useCallback(
    (x: number, z: number) =>
      setPlan((p) => {
        const s = snapToWall(p, x, z, rules.credenza.depth);
        return normalizePlan({ ...p, credenzaX: s.x, credenzaZ: s.z });
      }),
    [],
  );
  const moveRackTo = useCallback(
    (x: number, z: number) =>
      setPlan((p) => {
        const s = moveRack(p, x, z);
        return normalizePlan({ ...p, rackX: s.x, rackZ: s.z });
      }),
    [],
  );
  const onReady = useCallback((fn: Capture) => {
    capture.current = fn;
  }, []);
  const show = (name: ViewName) => {
    setSheet(null);
    setView((v) => ({ name, nonce: v.nonce + 1 }));
  };

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

  const shapes = roomTypes[plan.roomType].shapes;
  // the ready-made room this plan still is, if it has not been changed since
  const ready = useMemo(
    () => scenarios.find((s) => encodePlan(applyScenario(plan, s.id)) === encodePlan(plan)),
    [plan],
  );
  const [minSeats, maxSeats] = seatLimits(plan.roomType, plan.shape);

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
                <span className="planner-label">Start from a ready-made room</span>
                <div className="planner-scenarios" role="group" aria-label="Ready-made rooms">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={ready?.id === s.id}
                      onClick={() => setPlan((cur) => applyScenario(cur, s.id))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="planner-hint">
                  {ready ? ready.about : 'Pick one to start. Everything can be changed afterwards.'}
                </p>
              </div>
              <Seg
                label="Kind of room"
                value={plan.roomType}
                options={(Object.keys(roomTypes) as RoomType[]).map((t) => ({ value: t, label: roomTypes[t].label }))}
                onChange={(t) => setPlan((cur) => applyRoomType(cur, t))}
              />
              <p className="planner-hint">{roomTypes[plan.roomType].about}</p>
              <div className="planner-field">
                <span className="planner-label">Start from a package</span>
                <div className="planner-presets">
                  {(['essential', 'standard', 'premium'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setPlan((cur) => applyPreset(cur, p))}>
                      <strong>{p[0].toUpperCase() + p.slice(1)}</strong>
                      <small>{presetText[plan.roomType][p]}</small>
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
                Up to {limitsFor(plan.roomType).length[1]} m ({Math.round(limitsFor(plan.roomType).length[1] * 3.28)}{' '}
                ft) for this kind of room. The display is on the wall at the far end.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2>{plan.roomType === 'training' ? 'Desks and seats' : 'Table and seats'}</h2>
              {shapes.length > 1 && (
                <Seg
                  label="Table"
                  value={plan.shape}
                  options={shapes.map((s) => ({ value: s, label: tableShapes[s].label }))}
                  onChange={(v) => set('shape', v)}
                />
              )}
              {shapes.length > 1 && <p className="planner-hint">{tableShapes[plan.shape].about}</p>}
              <Count label="Seats" value={plan.seats} min={minSeats} max={maxSeats} onChange={(n) => set('seats', n)} />
              {plan.roomType !== 'training' && plan.shape !== 'semi' && (
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
              )}
              {(plan.roomType === 'conference' || plan.roomType === 'boardroom') &&
                (plan.shape === 'rect' || plan.shape === 'boat') && (
                  <Check
                    label="Chairs at the ends of the table"
                    checked={plan.endChairs}
                    onChange={(v) => set('endChairs', v)}
                  />
                )}
              {plan.roomType === 'huddle' && plan.shape === 'rect' && (
                <Check
                  label="A chair at the end of the table, facing the display"
                  checked={plan.endChairs}
                  onChange={(v) => set('endChairs', v)}
                  hint="Seats an extra person, so the table has people on three sides"
                />
              )}
              {plan.roomType !== 'huddle' && (
                <Check label="Show a presenter" checked={plan.presenter} onChange={(v) => set('presenter', v)} />
              )}
              {plan.presenter && plan.roomType !== 'huddle' && (
                <p className="planner-hint">
                  Drag the presenter in the 3D view to move them. A camera at the back of the room follows them, and
                  they get a wireless microphone.{' '}
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
                {layout.rows
                  ? `${layout.rows.count} row${layout.rows.count > 1 ? 's' : ''} of up to ${layout.rows.perRow} seats at two-seat desks, ${formatLength(layout.tables[0].width, u)} × ${formatLength(layout.tables[0].length, u)} each.`
                  : `The table is sized for you: ${formatLength(layout.table.length, u)} × ${formatLength(layout.table.width, u)}.`}
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Display</h2>
              {plan.roomType !== 'huddle' && (
                <Seg
                  label="Kind of display"
                  value={plan.displayType}
                  options={[
                    { value: 'flat', label: 'Flat panel' },
                    { value: 'led', label: 'LED wall' },
                    { value: 'projector', label: 'Projector and screen' },
                  ]}
                  onChange={(v) => set('displayType', v)}
                />
              )}
              {plan.roomType !== 'huddle' && plan.displayType !== 'led' && (
                <Seg
                  label="Number of displays"
                  value={plan.displays}
                  options={[
                    { value: 1, label: 'One' },
                    { value: 2, label: 'Two' },
                  ]}
                  onChange={(v) => set('displays', v)}
                />
              )}
              <div className="planner-field">
                <label htmlFor="planner-size">
                  {plan.displayType === 'projector'
                    ? 'Screen size'
                    : plan.displayType === 'led'
                      ? 'Wall size'
                      : 'Display size'}
                </label>
                <select
                  id="planner-size"
                  value={plan.displaySize ?? ''}
                  onChange={(e) => set('displaySize', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{displays.recommended}&quot; (recommended)</option>
                  {displaySizes(plan.displayType).map((s) => (
                    <option key={s} value={s}>
                      {s}&quot;
                    </option>
                  ))}
                </select>
              </div>
              {plan.roomType === 'training' && (
                <Check
                  label="Interactive whiteboard"
                  checked={plan.whiteboard}
                  onChange={(v) => set('whiteboard', v)}
                  hint="On the wall beside the display"
                />
              )}
              <Seg
                label="Sharing from laptops"
                value={plan.sharing}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'cable', label: 'On a cable' },
                  { value: 'wireless', label: 'Wireless' },
                  { value: 'both', label: 'Both' },
                ]}
                onChange={(v) => set('sharing', v)}
              />
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
                to {formatLength(displays.maxDistance, u)}.{' '}
                {plan.displayType === 'led' &&
                  'An LED wall is built to the room from cabinets, so the sizes here are steps along the way. '}
                {displays.projector &&
                  (displays.projector.short
                    ? 'The room is short, so the projector has a short-throw lens and hangs close to the screen. '
                    : `The projector hangs ${formatLength(displays.projector.throw, u)} in front of the screen. `)}
                {plan.sharing === 'wireless' || plan.sharing === 'both'
                  ? 'A wireless gateway lets people share a laptop without a cable.'
                  : ''}
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Audio</h2>
              {plan.bar !== 'none' && (
                <p className="planner-hint">
                  The video bar has microphones and speakers of its own. Add more below if the room needs them.
                </p>
              )}
              <Seg
                label="Speakers"
                value={plan.speakers}
                options={[
                  { value: 'none', label: plan.bar !== 'none' ? 'Bar only' : 'None' },
                  { value: 'display', label: 'In the display' },
                  { value: 'front', label: 'Slim wall pair' },
                  ...(plan.roomType === 'huddle'
                    ? []
                    : [
                        { value: 'ceiling' as const, label: 'Ceiling' },
                        { value: 'both' as const, label: 'Wall and ceiling' },
                      ]),
                ]}
                onChange={(v) => set('speakers', v)}
              />
              {(plan.speakers === 'ceiling' || plan.speakers === 'both') && (
                <>
                  <Seg
                    label="Ceiling speaker size"
                    value={plan.speakerSize}
                    options={[
                      { value: 4, label: '4 to 5 in' },
                      { value: 7, label: '7 in' },
                      { value: 8, label: '8 in' },
                      { value: 10, label: '10 in' },
                    ]}
                    onChange={(v) => set('speakerSize', v)}
                  />
                  <Seg
                    label="Ceiling speaker mounting"
                    value={plan.speakerMount}
                    options={[
                      { value: 'flush', label: 'In the ceiling' },
                      { value: 'pendant', label: 'On cords' },
                    ]}
                    onChange={(v) => set('speakerMount', v)}
                  />
                  <Seg
                    label="Ceiling speaker coverage"
                    value={plan.speakerCoverage}
                    options={[
                      { value: 'basic', label: 'Basic' },
                      { value: 'good', label: 'Good' },
                      { value: 'full', label: 'Full' },
                    ]}
                    onChange={(v) => set('speakerCoverage', v)}
                  />
                </>
              )}
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
                  { value: 'none', label: plan.bar !== 'none' ? 'Bar only' : 'None' },
                  ...(plan.roomType === 'training' ? [] : [{ value: 'table' as const, label: 'Table' }]),
                  ...(plan.roomType === 'huddle'
                    ? []
                    : [
                        { value: 'ceiling' as const, label: 'Ceiling' },
                        { value: 'pendant' as const, label: 'On cords' },
                        { value: 'gooseneck' as const, label: 'Gooseneck' },
                      ]),
                ]}
                onChange={(v) => set('mics', v)}
              />
              {(plan.mics === 'ceiling' || plan.mics === 'pendant') && (
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
              {plan.roomType !== 'huddle' && (
                <>
                  <Seg
                    label="Wireless microphones"
                    value={plan.wireless}
                    options={[
                      { value: 0, label: 'None' },
                      { value: 2, label: 'Two' },
                      { value: 4, label: 'Four' },
                    ]}
                    onChange={(v) => set('wireless', v)}
                  />
                  <Check
                    label="Audio processor"
                    checked={plan.dsp}
                    onChange={(v) => set('dsp', v)}
                    hint="Echo cancellation and mixing"
                  />
                </>
              )}
              <p className="planner-hint">
                {gear.speakers.length > 0 &&
                  `${gear.speakers.length} ceiling speakers. ${coverageNote[plan.speakerCoverage]} `}
                {(plan.mics === 'ceiling' || plan.mics === 'pendant') &&
                  `${gear.mics.length} microphone array${gear.mics.length > 1 ? 's' : ''}, ${plan.micShape === 'round' ? 'round 25 in (635 mm)' : 'square 24 in (604 mm)'}, sized like the Shure MXA920. `}
                {plan.mics === 'table' && `${gear.mics.length} table microphone${gear.mics.length > 1 ? 's' : ''}. `}
                {plan.mics === 'gooseneck' && `${gear.mics.length} gooseneck microphones, one for every two seats. `}
                {plan.presenter && 'The presenter always has a wireless microphone. '}
                Coverage is a simplified sketch, not an acoustic simulation.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Video</h2>
              <Seg
                label="All-in-one video bar"
                value={plan.bar}
                options={[
                  { value: 'none', label: 'No bar' },
                  { value: 'compact', label: 'Compact' },
                  { value: 'large', label: 'Large' },
                ]}
                onChange={(v) => set('bar', v)}
              />
              {plan.bar !== 'none' && (
                <>
                  <Seg
                    label="Bar position"
                    value={plan.cameraSpot}
                    options={[
                      { value: 'above', label: 'Above the display' },
                      { value: 'below', label: 'Below the display' },
                    ]}
                    onChange={(v) => set('cameraSpot', v)}
                  />
                  {plan.system !== 'byod' && (
                    <Check
                      label="Separate room computer"
                      checked={plan.engine}
                      onChange={(v) => set('engine', v)}
                      hint="Otherwise the bar runs the meeting platform itself"
                    />
                  )}
                </>
              )}
              {plan.bar === 'none' && (
                <Seg
                  label="Cameras at the display"
                  value={plan.cameras}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'one', label: 'One' },
                    { value: 'two', label: 'Two' },
                    { value: 'pairs', label: 'Two pairs' },
                  ]}
                  onChange={(v) => set('cameras', v)}
                />
              )}
              {plan.bar === 'none' && plan.cameras === 'one' && (
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
              {plan.bar === 'none' && plan.cameras === 'two' && (
                <Seg
                  label="Camera positions"
                  value={plan.cameraSpot}
                  options={[
                    { value: 'sides', label: 'Either side of the display' },
                    { value: 'both', label: 'Above and below the display' },
                  ]}
                  onChange={(v) => set('cameraSpot', v)}
                />
              )}
              {plan.roomType !== 'training' && (
                <Check
                  label="Camera on the table"
                  checked={plan.tableCamera}
                  onChange={(v) => set('tableCamera', v)}
                  hint="Small and round: close-up faces around the table"
                />
              )}
              {plan.roomType !== 'huddle' && (
                <>
                  <Count
                    label="Cameras on the side walls"
                    value={plan.wallCameras}
                    min={0}
                    max={4}
                    onChange={(n) => set('wallCameras', n)}
                  />
                  <Count
                    label="Cameras at the back"
                    value={plan.backCameras}
                    min={plan.presenter ? 1 : 0}
                    max={2}
                    onChange={(n) => set('backCameras', n)}
                  />
                </>
              )}
              <Check
                label="Show what the cameras see"
                checked={plan.cameraView}
                onChange={(v) => set('cameraView', v)}
              />
              <p className="planner-hint">
                {plan.bar !== 'none' &&
                  `One bar ${plan.cameraSpot === 'below' ? 'below' : 'above'} the display, with the camera, microphones and speakers in it. ${plan.bar === 'compact' ? 'The compact one suits a huddle room.' : 'The large one suits a medium room.'}`}
                {plan.bar === 'none' &&
                  plan.cameras === 'none' &&
                  'No camera at the display: remote people do not see the room.'}
                {plan.bar === 'none' &&
                  plan.cameras === 'one' &&
                  (plan.cameraSpot === 'above'
                    ? 'One PTZ camera on the centre line above the display: the usual choice, and it works for most rooms.'
                    : 'One PTZ camera on the centre line below the display, close to seated eye level. The display is mounted higher to make room for it.')}
                {plan.bar === 'none' &&
                  plan.cameras === 'two' &&
                  (plan.cameraSpot === 'both'
                    ? 'Two PTZ cameras on the centre line, one above the display and one below it, close to seated eye level. The display is mounted higher.'
                    : 'Two PTZ cameras on both sides of the display, aimed across the table so the system can pick the face-on view of whoever speaks.')}
                {plan.bar === 'none' &&
                  plan.cameras === 'pairs' &&
                  'Two PTZ cameras on each side of the display. The system switches between them without a visible cut.'}
                {plan.bar === 'none' &&
                  plan.cameras !== 'none' &&
                  ' PTZ cameras are sized like the Q-SYS NC-12x80: 170 × 201 × 142 mm.'}{' '}
                {plan.wallCameras > 0 && 'Side-wall cameras look across the table. '}
                {plan.presenter &&
                  'The presenter has a camera of their own at the back of the room, added automatically; it follows them.'}
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Control and platform</h2>
              {plan.roomType !== 'training' && (
                <Check
                  label="Connection panels in the table"
                  checked={plan.tablePanels}
                  onChange={(v) => set('tablePanels', v)}
                  hint="Power and cables for laptops"
                />
              )}
              <Seg
                label="Touch panel"
                value={plan.control}
                options={[
                  { value: 'none', label: 'None' },
                  ...(plan.roomType === 'training' ? [] : [{ value: 'table' as const, label: 'On the table' }]),
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
              <Seg
                label="Where the equipment is"
                value={plan.rack}
                options={[
                  { value: 'none', label: 'Not shown' },
                  { value: 'behind', label: 'Behind the display' },
                  { value: 'room', label: 'Rack in the room' },
                  { value: 'outside', label: 'Rack outside' },
                ]}
                onChange={(v) => setPlan((p) => normalizePlan({ ...p, rack: v, rackX: null, rackZ: null }))}
              />
              <p className="planner-hint">
                {plan.rack === 'behind' &&
                  'The equipment sits in a box on the wall behind the display; turn the room around to see it.'}
                {plan.rack === 'room' && 'A rack stands against a wall. Drag it in the 3D view to another wall.'}
                {plan.rack === 'outside' &&
                  'The rack stands outside the room, location to be confirmed. Drag it to another side.'}
                {plan.rack !== 'none' && gear.rack
                  ? ` ${gear.rack.items.length} devices: ${gear.rack.items.map((i) => i.name.replace(/ \(.*\)$/, '').toLowerCase()).join(', ')}.`
                  : ''}
                {(plan.sharing === 'cable' || plan.sharing === 'both' || plan.control === 'table') &&
                  ' Dashed lines are the cables from the table.'}
              </p>
            </>
          )}

          {step === 6 && (
            <>
              <h2>Your plan</h2>
              <p className="planner-hint">
                {formatLength(plan.length, u)} × {formatLength(plan.width, u)}, ceiling {formatLength(plan.height, u)}.{' '}
                {roomTypes[plan.roomType].noun}, {plan.seats} seats{' '}
                {plan.roomType === 'training'
                  ? 'in rows of desks'
                  : `at a ${plan.shape === 'u' ? 'U-shaped' : tableShapes[plan.shape].label.toLowerCase()} table`}
                .
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
          onCredenzaMove={moveCredenza}
          onRackMove={moveRackTo}
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
          <button
            type="button"
            aria-pressed={sheet === 'flow'}
            onClick={() => setSheet((s) => (s === 'flow' ? null : 'flow'))}
          >
            Flow
          </button>
          <button
            type="button"
            aria-pressed={sheet === 'plans'}
            onClick={() => setSheet((s) => (s === 'plans' ? null : 'plans'))}
          >
            Plans
          </button>
        </div>
        {sheet === 'flow' && (
          <div className="planner-flow-sheet">
            <SignalFlow plan={plan} analysis={analysis} />
          </div>
        )}
        {sheet === 'plans' && (
          <div className="planner-plans-sheet">
            <PlanDrawings plan={plan} analysis={analysis} />
          </div>
        )}
        <p className="planner-disclaimer">Indicative sketch. Check dimensions on site.</p>
      </div>
    </section>
  );
}
