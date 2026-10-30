'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Line,
  LineDashedMaterial,
  Matrix4,
  type Mesh,
  MOUSE,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TOUCH,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Analysis, Cable, CameraSpec, Plan, RackKind, RoomSystem, Vec3 } from '@/lib/planner/model';
import { presenterRange, presenterSpot, rules } from '@/lib/planner/model';

export type ViewName = 'iso' | 'top' | 'front' | 'side';
export type ViewState = { name: ViewName; nonce: number };
export type Capture = () => Promise<Blob | null>;

const COLORS = { speaker: '#3ddc84', mic: '#4cc9f0', camera: '#ffb703', plane: '#3a86ff' };

// Sound, voices and what the cameras see stop at the walls: their materials are clipped to the room box.
const ClipContext = createContext<Plane[]>([]);
function Clipped({ color, opacity }: { color: string; opacity: number }) {
  const clip = useContext(ClipContext);
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      side={DoubleSide}
      depthWrite={false}
      clippingPlanes={clip}
    />
  );
}
export function viewPose(plan: Pick<Plan, 'length' | 'width' | 'height' | 'rack'>, name: ViewName) {
  const R = Math.max(plan.length, plan.width + (plan.rack === 'outside' ? 3 : 0));
  const H = plan.height;
  const poses: Record<ViewName, { position: Vec3; target: Vec3 }> = {
    top: { position: [0, R * 1.5 + H, 0.001], target: [0, 0, 0] },
    front: { position: [0, H * 0.55, plan.length / 2 + R * 1.1], target: [0, H * 0.45, 0] },
    side: { position: [plan.width / 2 + R * 1.2, H * 0.55, 0], target: [0, H * 0.45, 0] },
    iso: { position: [R * 0.55, H + R * 0.55, plan.length / 2 + R * 0.85], target: [0, H * 0.3, 0] },
  };
  return poses[name];
}

// A quaternion that turns an object's +Z axis from `from` towards `to`.
function facing(from: Vec3, to: Vec3) {
  const m = new Matrix4().lookAt(new Vector3(...to), new Vector3(...from), new Vector3(0, 1, 0));
  return new Quaternion().setFromRotationMatrix(m);
}

function Controls({ plan, view }: { plan: Plan; view: ViewState }) {
  const { camera, gl, invalidate, set } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const planRef = useRef(plan);
  useEffect(() => {
    planRef.current = plan;
  });

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.maxPolarAngle = Math.PI / 2 - 0.02;
    c.minDistance = 1.5;
    c.maxDistance = 60;
    const onChange = () => invalidate();
    c.addEventListener('change', onChange);
    controls.current = c;
    set({ controls: c });
    const pose = viewPose(planRef.current, 'iso');
    camera.position.set(...pose.position);
    c.target.set(...pose.target);
    c.update();
    invalidate();
    return () => {
      c.removeEventListener('change', onChange);
      c.dispose();
      controls.current = null;
      set({ controls: null });
    };
  }, [camera, gl, invalidate, set]);

  useEffect(() => {
    const c = controls.current;
    if (!c || view.nonce === 0) return;
    const pose = viewPose(planRef.current, view.name);
    camera.position.set(...pose.position);
    c.target.set(...pose.target);
    c.update();
    invalidate();
  }, [view, camera, invalidate]);

  // Top, Front and Side keep their direction: dragging moves the picture, the wheel zooms, nothing turns. Only 3D rotates.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const flat = view.name !== 'iso';
    c.enableRotate = !flat;
    c.mouseButtons = {
      LEFT: flat ? MOUSE.PAN : MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    };
    c.touches = { ONE: flat ? TOUCH.PAN : TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
  }, [view.name]);

  // A bigger or smaller room (or another kind of room) is framed again, so it never looks lost in the picture.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const pose = viewPose(planRef.current, view.name);
    camera.position.set(...pose.position);
    c.target.set(...pose.target);
    c.update();
    invalidate();
  }, [plan.length, plan.width, plan.height, plan.rack, view.name, camera, invalidate]);

  return null;
}

// Hands the page a function that renders the scene once and returns it as a PNG.
function CaptureBridge({ onReady }: { onReady: (capture: Capture) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    onReady(
      () =>
        new Promise<Blob | null>((resolve) => {
          gl.render(scene, camera);
          gl.domElement.toBlob(resolve, 'image/png');
        }),
    );
  }, [gl, scene, camera, onReady]);
  return null;
}

// The badge of the meeting platform in the corner of the display: nothing for a bring-your-own-device room.
const BADGES: Record<
  Exclude<RoomSystem, 'byod'>,
  { name: string; colour: string; ink: string; glyph: 'T' | 'W' | 'camera' }
> = {
  teams: { name: 'Microsoft Teams', colour: '#5059C9', ink: '#ffffff', glyph: 'T' },
  zoom: { name: 'Zoom', colour: '#0B5CFF', ink: '#ffffff', glyph: 'camera' },
  webex: { name: 'Webex', colour: '#00A86B', ink: '#ffffff', glyph: 'W' },
  meet: { name: 'Google Meet', colour: '#ffffff', ink: '#00832d', glyph: 'camera' },
};

function drawBadge(g: CanvasRenderingContext2D, system: RoomSystem) {
  if (system === 'byod') return;
  const b = BADGES[system];
  const x = 56;
  const y = 56;
  const s = 112;
  g.fillStyle = b.colour;
  g.beginPath();
  g.roundRect(x, y, s, s, 24);
  g.fill();
  g.fillStyle = b.ink;
  if (b.glyph === 'camera') {
    g.beginPath();
    g.roundRect(x + 22, y + 36, 46, 40, 8);
    g.fill();
    g.beginPath();
    g.moveTo(x + 72, y + 50);
    g.lineTo(x + 92, y + 38);
    g.lineTo(x + 92, y + 74);
    g.lineTo(x + 72, y + 62);
    g.closePath();
    g.fill();
  } else {
    g.font = 'bold 76px Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText(b.glyph, x + s / 2, y + 82);
    g.textAlign = 'start';
  }
  g.font = 'bold 30px Arial, sans-serif';
  g.fillStyle = '#ffffff';
  g.shadowColor = 'rgba(0,0,0,0.7)';
  g.shadowBlur = 6;
  g.fillText(b.name, x + s + 18, y + 70);
  g.shadowBlur = 0;
}

// What the display shows: a video call with two remote people, a small self view, the logo in the corner and the badge
// of the meeting platform.
function drawScreen(canvas: HTMLCanvasElement, logo: HTMLImageElement | null, system: RoomSystem) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const W = canvas.width;
  const H = canvas.height;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0e1722');
  bg.addColorStop(1, '#1d2c40');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const tile = (x: number, y: number, w: number, h: number, hue: string, name: string) => {
    g.fillStyle = '#16212e';
    g.beginPath();
    g.roundRect(x, y, w, h, 18);
    g.fill();
    g.fillStyle = hue;
    g.beginPath();
    g.arc(x + w / 2, y + h * 0.4, Math.min(w, h) * 0.17, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x + w / 2, y + h * 0.92, w * 0.26, h * 0.3, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    g.roundRect(x + 14, y + h - 44, 150, 30, 8);
    g.fill();
    g.fillStyle = '#e8eef5';
    g.font = '20px Arial, sans-serif';
    g.fillText(name, x + 26, y + h - 22);
  };
  tile(40, 40, 600, 520, '#4f8cff', 'Alex');
  tile(660, 40, 580, 520, '#ff8a4c', 'Maya');
  tile(980, 440, 240, 160, '#47c28b', 'You');
  g.fillStyle = 'rgba(8,12,18,0.85)';
  g.fillRect(0, H - 90, W, 90);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = i === 2 ? '#d64545' : '#2b3a4d';
    g.beginPath();
    g.arc(W / 2 - 70 + i * 70, H - 45, 22, 0, Math.PI * 2);
    g.fill();
  }
  if (logo) {
    const w = 230;
    g.drawImage(logo, 40, H - 82, w, (w * logo.naturalHeight) / logo.naturalWidth);
  } else {
    g.fillStyle = '#e8eef5';
    g.font = 'bold 34px Arial, sans-serif';
    g.fillText('K4 AV Group', 40, H - 36);
  }
  drawBadge(g, system);
}

function useScreenTexture(system: RoomSystem) {
  const invalidate = useThree((s) => s.invalidate);
  // a new picture for each platform: its badge is part of the screen
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    drawScreen(canvas, null, system);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [system]);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      drawScreen(texture.image as HTMLCanvasElement, img, system);
      texture.needsUpdate = true;
      invalidate();
    };
    img.src = '/images/logo/k4av-logo-final.png';
    return () => {
      img.onload = null;
    };
  }, [texture, system, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Room({ plan }: { plan: Plan }) {
  const { width: W, length: L, height: H } = plan;
  // The camera's distance beyond each wall: positive when the wall stands between the camera and the room.
  const walls = [
    {
      key: 'front',
      position: [0, H / 2, -L / 2],
      rotation: [0, 0, 0],
      size: [W, H],
      color: '#d5d9de',
      beyond: (p: Vector3) => -p.z - L / 2,
    },
    {
      key: 'back',
      position: [0, H / 2, L / 2],
      rotation: [0, 0, 0],
      size: [W, H],
      color: '#cfd3d9',
      beyond: (p: Vector3) => p.z - L / 2,
    },
    {
      key: 'left',
      position: [-W / 2, H / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [L, H],
      color: '#c4c9cf',
      beyond: (p: Vector3) => -p.x - W / 2,
    },
    {
      key: 'right',
      position: [W / 2, H / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [L, H],
      color: '#c9ced4',
      beyond: (p: Vector3) => p.x - W / 2,
    },
  ] as const;
  const meshes = useRef<(Mesh | null)[]>([]);
  useFrame(({ camera }) => {
    walls.forEach((w, i) => {
      const m = meshes.current[i];
      if (m) m.visible = w.beyond(camera.position) <= 0.05;
    });
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#42506a" roughness={0.95} />
      </mesh>
      {walls.map((w, i) => (
        <group key={w.key}>
          <mesh
            ref={(m) => {
              meshes.current[i] = m;
            }}
            position={w.position as unknown as Vec3}
            rotation={w.rotation as unknown as Vec3}
          >
            <planeGeometry args={w.size as unknown as [number, number]} />
            <meshStandardMaterial color={w.color} side={DoubleSide} />
          </mesh>
          <Outline
            size={w.size as unknown as [number, number]}
            position={w.position as unknown as Vec3}
            rotation={w.rotation as unknown as Vec3}
          />
        </group>
      ))}
      {plan.ceiling && <Outline size={[W, L]} position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} />}
    </group>
  );
}

// A plane drawn as an outline with a very faint fill, so the room stays readable from every side.
function Outline({ size, position, rotation }: { size: [number, number]; position: Vec3; rotation: Vec3 }) {
  const edges = useMemo(() => new EdgesGeometry(new PlaneGeometry(size[0], size[1])), [size]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial color="#e9eef3" transparent opacity={0.04} side={DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#aeb8c6" transparent opacity={0.75} />
      </lineSegments>
    </group>
  );
}
function Chair({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.46]} />
        <meshStandardMaterial color="#68717f" />
      </mesh>
      <mesh position={[0, 0.76, -0.2]}>
        <boxGeometry args={[0.46, 0.5, 0.06]} />
        <meshStandardMaterial color="#68717f" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
        <meshStandardMaterial color="#a3a9b3" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.03, 16]} />
        <meshStandardMaterial color="#a3a9b3" />
      </mesh>
    </group>
  );
}

// A boat-shaped table: a long top with half-round ends, on a plinth.
function BoatTable({ table, wood }: { table: Analysis['layout']['table']; wood: string }) {
  const geometry = useMemo(() => {
    const r = table.width / 2;
    const straight = Math.max(0, table.length - table.width) / 2;
    const outline = new Shape();
    outline.moveTo(-r, -straight);
    outline.lineTo(-r, straight);
    outline.absarc(0, straight, r, Math.PI, 0, true);
    outline.lineTo(r, -straight);
    outline.absarc(0, -straight, r, 0, Math.PI, true);
    const g = new ExtrudeGeometry(outline, { depth: 0.04, bevelEnabled: false, curveSegments: 28 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [table.width, table.length]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[table.x, 0, table.z]}>
      <mesh geometry={geometry} position={[0, 0.72, 0]}>
        <meshStandardMaterial color={wood} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[table.width * 0.45, 0.72, Math.max(0.6, table.length * 0.6)]} />
        <meshStandardMaterial color="#222831" />
      </mesh>
    </group>
  );
}

function Table({ table }: { table: Analysis['layout']['table'] }) {
  const wood = '#b98b62';
  if (table.shape === 'boat') return <BoatTable table={table} wood={wood} />;
  if (table.shape === 'semi') {
    const r = table.length;
    return (
      <group position={[table.x, 0, table.z - r / 2]}>
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[r, r, 0.04, 48, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        <mesh position={[0, 0.37, r * 0.45]}>
          <cylinderGeometry args={[0.08, 0.08, 0.74, 12]} />
          <meshStandardMaterial color="#222831" />
        </mesh>
        <mesh position={[0, 0.01, r * 0.45]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
          <meshStandardMaterial color="#222831" />
        </mesh>
      </group>
    );
  }
  if (table.shape === 'round') {
    return (
      <group position={[table.x, 0, table.z]}>
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[table.width / 2, table.width / 2, 0.04, 48]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        <mesh position={[0, 0.37, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.74, 12]} />
          <meshStandardMaterial color="#222831" />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
          <meshStandardMaterial color="#222831" />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[table.x, 0, table.z]}>
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[table.width, 0.04, table.length]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (table.width / 2 - 0.12), 0.36, 0]}>
          <boxGeometry args={[0.05, 0.72, table.length - 0.4]} />
          <meshStandardMaterial color="#222831" />
        </mesh>
      ))}
    </group>
  );
}

function Display({
  x,
  y,
  w,
  h,
  z,
  texture,
  frame = '#0b0d10',
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  texture: CanvasTexture;
  frame?: string;
}) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.05]} />
        <meshStandardMaterial color={frame} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Something that can be dragged across the floor: the presenter, the cabinet with the microphones, the rack. While it
// is held, the camera controls step aside. `bounds` is how far it may go; the owner snaps it to a wall if it wants to.
function Draggable({
  x,
  z,
  bounds,
  onMove,
  hitRadius = 0.36,
  hitHeight = 1.9,
  children,
}: {
  x: number;
  z: number;
  bounds: { x: readonly [number, number]; z: readonly [number, number] };
  onMove: (x: number, z: number) => void;
  hitRadius?: number;
  hitHeight?: number;
  children: (lit: boolean) => ReactNode;
}) {
  const { camera, gl, get } = useThree();
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const stopDrag = useRef<(() => void) | null>(null);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

  useEffect(
    () => () => {
      stopDrag.current?.();
    },
    [],
  );

  const grab = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const ray = new Raycaster();
    const ndc = new Vector2();
    const hit = new Vector3();
    const floor = (ev: { clientX: number; clientY: number }) => {
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.ray.intersectPlane(plane, hit);
    };
    const orbit = get().controls as OrbitControls | null;
    const start = floor(e.nativeEvent);
    if (!start) return;
    const dx = x - start.x;
    const dz = z - start.z;
    const move = (ev: PointerEvent) => {
      const p = floor(ev);
      if (p)
        onMove(
          Math.min(bounds.x[1], Math.max(bounds.x[0], p.x + dx)),
          Math.min(bounds.z[1], Math.max(bounds.z[0], p.z + dz)),
        );
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (orbit) orbit.enabled = true;
      get().gl.domElement.style.cursor = '';
      stopDrag.current = null;
      setHeld(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    stopDrag.current = end;
    if (orbit) orbit.enabled = false;
    get().gl.domElement.style.cursor = 'grabbing';
    setHeld(true);
  };

  return (
    <group
      position={[x, 0, z]}
      onPointerDown={grab}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        if (!stopDrag.current) get().gl.domElement.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        setHover(false);
        if (!stopDrag.current) get().gl.domElement.style.cursor = '';
      }}
    >
      <mesh position={[0, hitHeight / 2, 0]}>
        <cylinderGeometry args={[hitRadius, hitRadius, hitHeight, 14]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children(hover || held)}
    </group>
  );
}

// A person who can be dragged across the floor.
function Presenter({
  x,
  z,
  size,
  onMove,
}: {
  x: number;
  z: number;
  size: { width: number; length: number };
  onMove: (x: number, z: number) => void;
}) {
  return (
    <Draggable x={x} z={z} bounds={presenterRange(size.width, size.length)} onMove={onMove}>
      {(lit) => (
        <>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.37, 40]} />
            <meshBasicMaterial
              color="#6aa5ff"
              transparent
              opacity={lit ? 0.95 : 0.5}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <capsuleGeometry args={[0.18, 0.9, 6, 12]} />
            <meshStandardMaterial color={lit ? '#6aa5ff' : '#3a86ff'} />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshStandardMaterial color="#e6c3a3" />
          </mesh>
        </>
      )}
    </Draggable>
  );
}

// A ceiling microphone array hanging flush with the ceiling, sized like the Shure MXA920 (square or round).
function MicArray({ position, shape }: { position: Vec3; shape: Plan['micShape'] }) {
  const { size, depth } = rules.micArray[shape];
  const y = position[1] + 0.02 - depth / 2; // the array's top is at the ceiling
  const dark = '#2a2f37';
  return (
    <group position={[position[0], y, position[2]]}>
      {shape === 'square' ? (
        <>
          <mesh>
            <boxGeometry args={[size, depth, size]} />
            <meshStandardMaterial color="#f5f7f9" />
          </mesh>
          <mesh position={[0, -depth / 2 - 0.001, 0]}>
            <boxGeometry args={[size * 0.6, 0.004, size * 0.6]} />
            <meshStandardMaterial color={dark} />
          </mesh>
        </>
      ) : (
        <>
          <mesh>
            <cylinderGeometry args={[size / 2, size / 2, depth, 48]} />
            <meshStandardMaterial color="#f5f7f9" />
          </mesh>
          <mesh position={[0, -depth / 2 - 0.001, 0]}>
            <cylinderGeometry args={[size * 0.3, size * 0.3, 0.004, 40]} />
            <meshStandardMaterial color={dark} />
          </mesh>
        </>
      )}
    </group>
  );
}

// A translucent cone with its apex at `apex`, opening towards `base`.
function ConeVolume({
  apex,
  base,
  halfAngle,
  color,
  opacity,
}: {
  apex: Vec3;
  base: Vec3;
  halfAngle: number;
  color: string;
  opacity: number;
}) {
  const { position, quaternion, radius, length } = useMemo(() => {
    const a = new Vector3(...apex);
    const b = new Vector3(...base);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), dir.clone().normalize());
    return {
      position: a.clone().add(b).multiplyScalar(0.5).toArray() as Vec3,
      quaternion: q,
      radius: length * Math.tan((halfAngle * Math.PI) / 180),
      length,
    };
  }, [apex, base, halfAngle]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[radius, length, 40, 1, true]} />
      <Clipped color={color} opacity={opacity} />
    </mesh>
  );
}

function Disc({
  position,
  radius,
  color,
  opacity,
}: {
  position: Vec3;
  radius: number;
  color: string;
  opacity: number;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <Clipped color={color} opacity={opacity} />
    </mesh>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// A pyramid for what a camera sees. Its far corners are clamped to the room box, so it never leaves the walls.
function CameraBody({
  cam,
  room,
  showView,
}: {
  cam: CameraSpec;
  room: { width: number; length: number; height: number };
  showView: boolean;
}) {
  const quaternion = useMemo(() => facing(cam.pos, cam.target), [cam]);
  const geometry = useMemo(() => {
    const origin = new Vector3(...cam.pos);
    const d = Math.min(origin.distanceTo(new Vector3(...cam.target)), 9);
    const hw = d * Math.tan((cam.hfov * Math.PI) / 360);
    const hh = d * Math.tan((cam.vfov * Math.PI) / 360);
    const inverse = quaternion.clone().invert();
    const corner = (x: number, y: number) => {
      const p = new Vector3(x, y, d).applyQuaternion(quaternion).add(origin);
      p.set(
        clamp(p.x, -room.width / 2, room.width / 2),
        clamp(p.y, 0, room.height),
        clamp(p.z, -room.length / 2, room.length / 2),
      );
      return p.sub(origin).applyQuaternion(inverse).toArray();
    };
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new Float32BufferAttribute(
        [0, 0, 0, ...corner(-hw, hh), ...corner(hw, hh), ...corner(hw, -hh), ...corner(-hw, -hh)],
        3,
      ),
    );
    g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 4, 3, 1, 3, 2]);
    return g;
  }, [cam, quaternion, room.width, room.length, room.height]);
  const edges = useMemo(() => new EdgesGeometry(geometry, 1), [geometry]);
  useEffect(
    () => () => {
      geometry.dispose();
      edges.dispose();
    },
    [geometry, edges],
  );
  // PTZ camera sized like the Q-SYS NC-12x80: 170 x 201 x 142 mm. The head pans and tilts towards the target;
  // the base sits on a wall bracket (the supplied PTZ-WMB1 is a shelf-type wall mount).
  const dx = cam.target[0] - cam.pos[0];
  const dy = cam.target[1] - cam.pos[1];
  const dz = cam.target[2] - cam.pos[2];
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.asin(-dy / Math.hypot(dx, dy, dz));
  // the wall it hangs on: the bracket reaches from the camera to that wall, whichever wall it is
  const toWall =
    cam.wall === 'front'
      ? [0, -room.length / 2 - cam.pos[2]]
      : cam.wall === 'back'
        ? [0, room.length / 2 - cam.pos[2]]
        : cam.wall === 'left'
          ? [-room.width / 2 - cam.pos[0], 0]
          : [room.width / 2 - cam.pos[0], 0];
  const reachWall = Math.hypot(toWall[0], toWall[1]);
  const bracketYaw = Math.atan2(toWall[0], toWall[1]);
  const view = showView && (
    <group quaternion={quaternion}>
      <mesh geometry={geometry}>
        <Clipped color={COLORS.camera} opacity={0.07} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={COLORS.camera} transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
  // a video bar draws itself; only what its camera sees belongs here
  if (cam.kind === 'bar') return <group position={cam.pos}>{view}</group>;
  // a small round camera standing on the table: four lenses, so it sees all round
  if (cam.kind === 'table') {
    return (
      <group position={cam.pos}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 28]} />
          <meshStandardMaterial color="#2b3038" roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            <mesh position={[0, 0.04, 0.047]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshStandardMaterial color="#05070b" roughness={0.2} metalness={0.6} />
            </mesh>
          </group>
        ))}
        {showView && (
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[3, 3, 1.1, 48, 1, true]} />
            <Clipped color={COLORS.camera} opacity={0.16} />
          </mesh>
        )}
      </group>
    );
  }
  return (
    <group position={cam.pos}>
      <group rotation={[0, bracketYaw, 0]}>
        <mesh position={[0, -0.09, reachWall - 0.007]}>
          <boxGeometry args={[0.14, 0.24, 0.014]} />
          <meshStandardMaterial color="#cfd3da" />
        </mesh>
        <mesh position={[0, -0.15, reachWall / 2]}>
          <boxGeometry args={[0.12, 0.03, reachWall]} />
          <meshStandardMaterial color="#aeb4bd" />
        </mesh>
      </group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.17, 0.07, 0.142]} />
        <meshStandardMaterial color="#2b3038" roughness={0.6} />
      </mesh>
      <group rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.17, 0.13, 0.112]} />
            <meshStandardMaterial color="#1c2026" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.071]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.05, 0.03, 28]} />
            <meshStandardMaterial color="#0c0f14" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.0865]}>
            <circleGeometry args={[0.034, 28]} />
            <meshStandardMaterial color="#05070b" roughness={0.15} metalness={0.7} />
          </mesh>
          <mesh position={[0.06, 0.05, 0.057]}>
            <sphereGeometry args={[0.006, 10, 8]} />
            <meshBasicMaterial color="#3ddc84" />
          </mesh>
        </group>
      </group>
      {view}
    </group>
  );
}
const WALL_ANGLE = 45; // degrees: half the angle a wall speaker covers
const SPEAKER_RADIUS: Record<number, number> = { 4: 0.09, 7: 0.13, 8: 0.15, 10: 0.18 }; // baffle radius by cone size
const BAR_PICKUP = 4.5; // how far a video bar's own microphones hear, in metres

// An all-in-one video bar: a speaker grille along the front with the camera lens in the middle.
function VideoBar({ bar }: { bar: NonNullable<Analysis['gear']['bar']> }) {
  return (
    <group position={bar.pos}>
      <mesh>
        <boxGeometry args={[bar.width, bar.height, bar.depth]} />
        <meshStandardMaterial color="#1a1d23" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, bar.depth / 2 + 0.001]}>
        <boxGeometry args={[bar.width * 0.94, bar.height * 0.72, 0.002]} />
        <meshStandardMaterial color="#303640" />
      </mesh>
      <mesh position={[0, 0, bar.depth / 2 + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[bar.height * 0.3, bar.height * 0.3, 0.008, 24]} />
        <meshStandardMaterial color="#05070b" roughness={0.2} metalness={0.6} />
      </mesh>
    </group>
  );
}

// Thin cords from something hung below the ceiling up to the ceiling. `top` is the height of the thing's top face.
function Cords({ x, z, top, ceiling, spread }: { x: number; z: number; top: number; ceiling: number; spread: number }) {
  const length = Math.max(0.01, ceiling - top);
  return (
    <group position={[x, top + length / 2, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * spread, 0, 0]}>
          <cylinderGeometry args={[0.004, 0.004, length, 6]} />
          <meshStandardMaterial color="#8b929c" />
        </mesh>
      ))}
    </group>
  );
}

// A gooseneck microphone: a small base on the table, a thin stalk and the capsule at the top.
function Gooseneck({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.045, 0.03, 16]} />
        <meshStandardMaterial color="#14171c" />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.3, 8]} />
        <meshStandardMaterial color="#14171c" />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <capsuleGeometry args={[0.012, 0.04, 4, 8]} />
        <meshStandardMaterial color="#14171c" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[0.03, 0.004, 8, 20]} />
        <meshBasicMaterial color="#3ddc84" />
      </mesh>
    </group>
  );
}

// A ceiling speaker hung on cords: a short drum with a dark grille underneath.
function PendantSpeaker({ position, radius, ceiling }: { position: Vec3; radius: number; ceiling: number }) {
  return (
    <group>
      <group position={position}>
        <mesh>
          <cylinderGeometry args={[radius, radius, 0.16, 24]} />
          <meshStandardMaterial color="#f2f4f6" />
        </mesh>
        <mesh position={[0, -0.081, 0]}>
          <cylinderGeometry args={[radius * 0.85, radius * 0.85, 0.004, 24]} />
          <meshStandardMaterial color="#2b3038" />
        </mesh>
      </group>
      <Cords x={position[0]} z={position[2]} top={position[1] + 0.08} ceiling={ceiling} spread={radius * 0.6} />
    </group>
  );
}

const RACK_COLOURS: Record<RackKind, string> = {
  control: '#ffb703',
  video: '#4f8cff',
  audio: '#3ddc84',
  network: '#9aa5b1',
  compute: '#c7cdd6',
  laptop: '#e8dcc6',
  power: '#ff6b6b',
  blank: '#2c333c',
};
const CABLE_COLOURS: Record<Cable['kind'], string> = { laptop: '#6aa5ff', control: '#ffb703', display: '#6aa5ff' };

// A label that always faces the viewer, for things that are not in the room (the rack outside it).
function Label({ text, position }: { text: string; position: Vec3 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 72;
    const g = canvas.getContext('2d');
    if (g) {
      g.fillStyle = 'rgba(20,24,30,0.85)';
      g.beginPath();
      g.roundRect(2, 2, 508, 68, 14);
      g.fill();
      g.fillStyle = '#e8eef5';
      g.font = 'bold 32px Arial, sans-serif';
      g.textAlign = 'center';
      g.fillText(text, 256, 47);
    }
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[1.7, 0.24, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

// A cable run, dashed, as if under the floor: furniture in front of it hides it.
function CableLine({ points, color }: { points: Vec3[]; color: string }) {
  const line = useMemo(() => {
    const geometry = new BufferGeometry().setFromPoints(points.map((p) => new Vector3(...p)));
    const l = new Line(geometry, new LineDashedMaterial({ color, dashSize: 0.07, gapSize: 0.05 }));
    l.computeLineDistances();
    return l;
  }, [points, color]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineDashedMaterial).dispose();
    },
    [line],
  );
  return <primitive object={line} />;
}

// A laptop cable lying on the table: it leaves the panel, makes a half-round loop and ends in a plug.
function TableCable({ position }: { position: Vec3 }) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.07, 0, 0.1),
      new Vector3(0.19, 0, 0.17),
      new Vector3(0.31, 0, 0.1),
      new Vector3(0.37, 0, -0.02),
    ]);
    return new TubeGeometry(curve, 24, 0.006, 6, false);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[position[0], position[1] + 0.012, position[2]]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#1d2733" />
      </mesh>
      <mesh position={[0.37, 0, -0.04]}>
        <boxGeometry args={[0.03, 0.012, 0.045]} />
        <meshStandardMaterial color="#8d97a3" />
      </mesh>
    </group>
  );
}

// A wireless sharing button on the table: a small puck with a ring of light.
function Puck({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.055, 0.02, 24]} />
        <meshStandardMaterial color="#f2f4f6" />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.036, 24]} />
        <meshBasicMaterial color="#4f8cff" />
      </mesh>
    </group>
  );
}

// A table microphone: a light puck with a dark top and a ring of light, so it reads as a microphone on the table.
function TableMic({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.075, 0.08, 0.03, 28]} />
        <meshStandardMaterial color="#e6e9ee" />
      </mesh>
      <mesh position={[0, 0.016, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.004, 24]} />
        <meshStandardMaterial color="#2b3038" />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.056, 0.066, 28]} />
        <meshBasicMaterial color="#3ddc84" />
      </mesh>
    </group>
  );
}

// The cabinet for the wireless microphones: a charger on top, with the handhelds and lapels in it.
function Credenza({ credenza }: { credenza: NonNullable<Analysis['gear']['credenza']> }) {
  const c = rules.credenza;
  const n = credenza.mics.length;
  return (
    <group rotation={[0, credenza.rot, 0]}>
      <mesh position={[0, c.height / 2, 0]}>
        <boxGeometry args={[c.width, c.height, c.depth]} />
        <meshStandardMaterial color="#8a6f55" />
      </mesh>
      <mesh position={[0, c.height + 0.015, 0]}>
        <boxGeometry args={[c.width, 0.03, c.depth + 0.02]} />
        <meshStandardMaterial color="#6c5540" />
      </mesh>
      <mesh position={[0, c.height + 0.06, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.24]} />
        <meshStandardMaterial color="#1b2027" />
      </mesh>
      {credenza.mics.map((kind, i) => {
        const x = (i - (n - 1) / 2) * 0.13;
        return kind === 'handheld' ? (
          <group key={i} position={[x, c.height + 0.09, 0.02]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.017, 0.015, 0.2, 12]} />
              <meshStandardMaterial color="#c9ced6" />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.032, 14, 10]} />
              <meshStandardMaterial color="#2b3038" />
            </mesh>
          </group>
        ) : (
          <group key={i} position={[x, c.height + 0.09, 0.02]}>
            <mesh position={[0, 0.045, 0]}>
              <boxGeometry args={[0.05, 0.09, 0.016]} />
              <meshStandardMaterial color="#2b3038" />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.009, 8, 6]} />
              <meshStandardMaterial color="#c9ced6" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// The rack: a dark cabinet with a faceplate for every unit, coloured by what it does. In the wall behind the display it
// is the same, only smaller. The front looks along +z.
function RackBody({ rack }: { rack: NonNullable<Analysis['gear']['rack']> }) {
  const unit = rules.rackUnit;
  const base = rack.mode === 'behind' ? 0 : rack.height / 2;
  let y = (rack.u * unit) / 2; // the faceplates fill the middle of the cabinet, top to bottom
  const used = rack.items.reduce((sum, i) => sum + i.u, 0);
  const faces = [
    ...rack.items,
    ...(rack.u > used ? [{ name: 'Blank', u: rack.u - used, kind: 'blank' as const }] : []),
  ];
  return (
    <group position={[0, base, 0]}>
      <mesh>
        <boxGeometry args={[rack.width, rack.height, rack.depth]} />
        <meshStandardMaterial color="#1b2027" />
      </mesh>
      {faces.map((item, i) => {
        const h = item.u * unit - 0.006;
        const centre = y - (item.u * unit) / 2;
        y -= item.u * unit;
        return (
          <mesh key={i} position={[0, centre, rack.depth / 2 + 0.004]}>
            <boxGeometry args={[rack.width * 0.86, h, 0.008]} />
            <meshStandardMaterial color={RACK_COLOURS[item.kind]} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function Equipment({
  plan,
  a,
  onPresenterMove,
  onCredenzaMove,
  onRackMove,
}: {
  plan: Plan;
  a: Analysis;
  onPresenterMove: (x: number, z: number) => void;
  onCredenzaMove: (x: number, z: number) => void;
  onRackMove: (x: number, z: number) => void;
}) {
  const { gear, displays, layout } = a;
  const spot = presenterSpot(plan, displays);
  const ear = rules.earHeight;
  const frontZ = -plan.length / 2;
  const angle = rules.speakerAngle[plan.speakerSize];
  const baffle = SPEAKER_RADIUS[plan.speakerSize];
  const slim = rules.wallSpeaker;
  const room = {
    x: [-plan.width / 2 + 0.3, plan.width / 2 - 0.3],
    z: [-plan.length / 2 + 0.3, plan.length / 2 - 0.3],
  } as const;
  const around = {
    x: [-plan.width / 2 - 3, plan.width / 2 + 3],
    z: [-plan.length / 2 - 3, plan.length / 2 + 3],
  } as const;
  const rack = gear.rack;
  return (
    <group>
      {/* the video bar and its microphones; a bar, or the display's own speakers, also sends sound into the room */}
      {gear.bar && <VideoBar bar={gear.bar} />}
      {gear.bar && plan.micCoverage && (
        <mesh position={[0, ear, frontZ + 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[BAR_PICKUP, 48, Math.PI, Math.PI]} />
          <Clipped color={COLORS.mic} opacity={0.14} />
        </mesh>
      )}
      {plan.speakerCones && (gear.bar || plan.speakers === 'display') && (
        <>
          <ConeVolume
            apex={gear.bar ? gear.bar.pos : [0, displays.centerY, frontZ + 0.05]}
            base={[0, ear, layout.table.z]}
            halfAngle={55}
            color={COLORS.speaker}
            opacity={0.12}
          />
          <Disc position={[0, ear + 0.005, layout.table.z]} radius={2.4} color={COLORS.speaker} opacity={0.1} />
        </>
      )}

      {/* speakers: a pair of slim columns beside the display, and ceiling speakers, flush or hung on cords */}
      {gear.wallSpeakers.map((p, i) => (
        <group key={`sp-${i}`}>
          <mesh position={p}>
            <boxGeometry args={[slim.width, slim.height, slim.depth]} />
            <meshStandardMaterial color="#14171c" />
          </mesh>
          <mesh position={[p[0], p[1], p[2] + slim.depth / 2 + 0.001]}>
            <boxGeometry args={[slim.width * 0.5, slim.height * 0.92, 0.002]} />
            <meshStandardMaterial color="#3a414b" />
          </mesh>
          {plan.speakerCones && (
            <ConeVolume
              apex={p}
              base={gear.wallTargets[i]}
              halfAngle={WALL_ANGLE}
              color={COLORS.speaker}
              opacity={0.13}
            />
          )}
        </group>
      ))}
      {gear.speakers.map((p, i) => (
        <group key={`cs-${i}`}>
          {plan.speakerMount === 'pendant' ? (
            <PendantSpeaker position={p} radius={baffle} ceiling={plan.height} />
          ) : (
            <mesh position={p}>
              <cylinderGeometry args={[baffle, baffle, 0.03, 24]} />
              <meshStandardMaterial color="#f2f4f6" />
            </mesh>
          )}
          {plan.speakerCones && (
            <>
              <ConeVolume apex={p} base={[p[0], ear, p[2]]} halfAngle={angle} color={COLORS.speaker} opacity={0.12} />
              <Disc
                position={[p[0], ear + 0.005, p[2]]}
                radius={gear.speakerRadius}
                color={COLORS.speaker}
                opacity={0.1}
              />
            </>
          )}
        </group>
      ))}
      {plan.listeningPlane && (
        <mesh position={[0, ear, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[plan.width - 0.1, plan.length - 0.1]} />
          <Clipped color={COLORS.plane} opacity={0.12} />
        </mesh>
      )}

      {/* microphones: ceiling arrays, arrays on cords, on the table, or gooseneck */}
      {(plan.mics === 'ceiling' || plan.mics === 'pendant') &&
        gear.mics.map((p, i) => (
          <group key={`ma-${i}`}>
            <MicArray position={p} shape={plan.micShape} />
            {plan.mics === 'pendant' && (
              <Cords
                x={p[0]}
                z={p[2]}
                top={p[1] + 0.02}
                ceiling={plan.height}
                spread={rules.micArray[plan.micShape].size * 0.35}
              />
            )}
            {plan.micCoverage && (
              <>
                <ConeVolume
                  apex={p}
                  base={[p[0], ear, p[2]]}
                  halfAngle={rules.ceilingMicHalfAngle}
                  color={COLORS.mic}
                  opacity={0.14}
                />
                <Disc position={[p[0], ear + 0.005, p[2]]} radius={gear.micRadius} color={COLORS.mic} opacity={0.12} />
              </>
            )}
          </group>
        ))}
      {plan.mics === 'table' &&
        gear.mics.map((p, i) => (
          <group key={`mt-${i}`}>
            <TableMic position={p} />
            {plan.micCoverage && (
              <Disc position={[p[0], p[1] + 0.02, p[2]]} radius={gear.micRadius} color={COLORS.mic} opacity={0.16} />
            )}
          </group>
        ))}
      {plan.mics === 'gooseneck' &&
        gear.mics.map((p, i) => (
          <group key={`mg-${i}`}>
            <Gooseneck position={p} />
            {plan.micCoverage && (
              <Disc position={[p[0], p[1] + 0.02, p[2]]} radius={gear.micRadius} color={COLORS.mic} opacity={0.16} />
            )}
          </group>
        ))}

      {/* cameras */}
      {gear.cameras.map((c, i) => (
        <CameraBody
          key={`cam-${i}`}
          cam={c}
          room={{ width: plan.width, length: plan.length, height: plan.height }}
          showView={plan.cameraView}
        />
      ))}

      {/* table connection panels, laptop cables, wireless sharing buttons and the touch panel */}
      {gear.panels.map((p, i) => (
        <mesh key={`pn-${i}`} position={p}>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <meshStandardMaterial color="#14171c" />
        </mesh>
      ))}
      {gear.laptopInputs.map((p, i) => (
        <TableCable key={`tc-${i}`} position={p} />
      ))}
      {gear.pucks.map((p, i) => (
        <Puck key={`pk-${i}`} position={p} />
      ))}
      {gear.control && plan.control === 'table' && (
        <mesh position={gear.control} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.24, 0.02, 0.16]} />
          <meshStandardMaterial color="#14171c" />
        </mesh>
      )}
      {gear.control && plan.control === 'wall' && (
        <mesh position={gear.control}>
          <boxGeometry args={[0.02, 0.22, 0.16]} />
          <meshStandardMaterial color="#14171c" />
        </mesh>
      )}

      {/* the cables from the table to the equipment, dashed */}
      {gear.cables.map((c, i) => (
        <CableLine key={`cb-${i}`} points={c.points} color={CABLE_COLOURS[c.kind]} />
      ))}

      {/* the equipment: behind the display, or in a rack that can be moved */}
      {rack && rack.mode === 'behind' && (
        <group position={rack.pos} rotation={[0, rack.rot, 0]}>
          <RackBody rack={rack} />
        </group>
      )}
      {rack && rack.mode !== 'behind' && (
        <>
          <Draggable
            x={rack.pos[0]}
            z={rack.pos[2]}
            bounds={rack.mode === 'room' ? room : around}
            onMove={onRackMove}
            hitRadius={0.5}
            hitHeight={rack.height}
          >
            {() => (
              <group rotation={[0, rack.rot, 0]}>
                <RackBody rack={rack} />
              </group>
            )}
          </Draggable>
          {rack.outside && (
            <Label text="AV rack (location TBD)" position={[rack.pos[0], rack.height + 0.3, rack.pos[2]]} />
          )}
        </>
      )}
      {gear.credenza && (
        <Draggable
          x={gear.credenza.pos[0]}
          z={gear.credenza.pos[2]}
          bounds={room}
          onMove={onCredenzaMove}
          hitRadius={0.5}
          hitHeight={1.2}
        >
          {() => <Credenza credenza={gear.credenza as NonNullable<Analysis['gear']['credenza']>} />}
        </Draggable>
      )}
      {plan.presenter && (
        <Presenter x={spot.x} z={spot.z} size={{ width: plan.width, length: plan.length }} onMove={onPresenterMove} />
      )}
    </group>
  );
}

// The grid of cabinets that an LED wall is built from (600 x 337.5 mm), laid over the picture.
function LedGrid({ w, h, z }: { w: number; h: number; z: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 36;
    const g = canvas.getContext('2d');
    if (g) {
      g.strokeStyle = 'rgba(0,0,0,0.55)';
      g.lineWidth = 2;
      g.strokeRect(0, 0, 64, 36);
    }
    const t = new CanvasTexture(canvas);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(w / 0.6, h / 0.3375);
    return t;
  }, [w, h]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

// A projector on a pole from the ceiling, and the cone of light down to the screen.
function ProjectorUnit({
  x,
  y,
  z,
  ceiling,
  screen,
  screenZ,
}: {
  x: number;
  y: number;
  z: number;
  ceiling: number;
  screen: { y: number; w: number; h: number };
  screenZ: number;
}) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const lens = [0, -0.02, -0.18];
    const dz = screenZ - z - lens[2];
    g.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          ...lens,
          -screen.w / 2,
          screen.y + screen.h / 2 - y,
          dz,
          screen.w / 2,
          screen.y + screen.h / 2 - y,
          dz,
          screen.w / 2,
          screen.y - screen.h / 2 - y,
          dz,
          -screen.w / 2,
          screen.y - screen.h / 2 - y,
          dz,
        ],
        3,
      ),
    );
    g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1]);
    return g;
  }, [y, z, screen.y, screen.w, screen.h, screenZ]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.4, 0.14, 0.32]} />
        <meshStandardMaterial color="#e4e7ea" />
      </mesh>
      <mesh position={[0, -0.02, -0.165]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.03, 20]} />
        <meshStandardMaterial color="#0c0f14" roughness={0.3} />
      </mesh>
      <mesh position={[0, (ceiling - y) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, ceiling - y, 8]} />
        <meshStandardMaterial color="#8b929c" />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#fff6d6" transparent opacity={0.07} side={DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// An interactive whiteboard: a flat panel with a few marker strokes on it.
function Whiteboard({ wb, z }: { wb: NonNullable<Analysis['displays']['whiteboard']>; z: number }) {
  const strokes: [number, number, number, string][] = [
    [-0.45, 0.28, 0.7, '#3a86ff'],
    [-0.3, 0.12, 0.95, '#ff8a4c'],
    [0.35, -0.08, 0.6, '#47c28b'],
  ];
  return (
    <group position={[wb.x, wb.centerY, z]}>
      <mesh>
        <boxGeometry args={[wb.width + 0.06, wb.height + 0.06, 0.05]} />
        <meshStandardMaterial color="#20242a" />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[wb.width, wb.height]} />
        <meshStandardMaterial color="#eef1f5" />
      </mesh>
      {strokes.map(([sx, sy, len, color]) => (
        <mesh key={color} position={[sx, sy, 0.027]}>
          <planeGeometry args={[len, 0.025]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// One texture shared by the displays. A projector comes with its screen in a case under the ceiling, an LED wall with
// a grid of cabinets, and a classroom may have a whiteboard beside it.
function Displays({ plan, displays }: { plan: Plan; displays: Analysis['displays'] }) {
  const texture = useScreenTexture(plan.system);
  const z = -plan.length / 2 + 0.03;
  const top = displays.centerY + displays.height / 2;
  const projector = displays.type === 'projector';
  return (
    <>
      {displays.xs.map((x, i) => (
        <group key={i}>
          <Display
            x={x}
            y={displays.centerY}
            w={displays.width}
            h={displays.height}
            z={z}
            texture={texture}
            frame={projector ? '#d9dce0' : '#0b0d10'}
          />
          {displays.type === 'led' && (
            <group position={[x, displays.centerY, z + 0.027]}>
              <LedGrid w={displays.width} h={displays.height} z={0.001} />
            </group>
          )}
          {projector && (
            <>
              <mesh position={[x, plan.height - 0.06, z + 0.05]}>
                <boxGeometry args={[displays.width + 0.12, 0.12, 0.12]} />
                <meshStandardMaterial color="#cfd3d8" />
              </mesh>
              <mesh position={[x, (plan.height - 0.12 + top) / 2, z + 0.01]}>
                <boxGeometry args={[displays.width * 0.96, Math.max(0.01, plan.height - 0.12 - top), 0.006]} />
                <meshStandardMaterial color="#e6e8eb" />
              </mesh>
              {displays.projector && (
                <ProjectorUnit
                  x={x}
                  y={displays.projector.pos[1]}
                  z={displays.projector.pos[2]}
                  ceiling={plan.height}
                  screen={{ y: displays.centerY, w: displays.width, h: displays.height }}
                  screenZ={z + 0.03}
                />
              )}
            </>
          )}
        </group>
      ))}
      {displays.whiteboard && <Whiteboard wb={displays.whiteboard} z={z} />}
    </>
  );
}

export default function PlannerScene({
  plan,
  analysis,
  view,
  onReady,
  onPresenterMove,
  onCredenzaMove,
  onRackMove,
}: {
  plan: Plan;
  analysis: Analysis;
  view: ViewState;
  onReady: (capture: Capture) => void;
  onPresenterMove: (x: number, z: number) => void;
  onCredenzaMove: (x: number, z: number) => void;
  onRackMove: (x: number, z: number) => void;
}) {
  const initial = viewPose(plan, 'iso');
  const { layout, displays } = analysis;
  const clip = useMemo(
    () => [
      new Plane(new Vector3(1, 0, 0), plan.width / 2),
      new Plane(new Vector3(-1, 0, 0), plan.width / 2),
      new Plane(new Vector3(0, 0, 1), plan.length / 2),
      new Plane(new Vector3(0, 0, -1), plan.length / 2),
      new Plane(new Vector3(0, 1, 0), 0),
      new Plane(new Vector3(0, -1, 0), plan.height),
    ],
    [plan.width, plan.length, plan.height],
  );
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 200, position: initial.position }}
      gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
      style={{ position: 'absolute', inset: 0 }}
      aria-label="3D view of the room"
    >
      <color attach="background" args={['#14181e']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[6, 10, 8]} intensity={1.3} />
      <ClipContext.Provider value={clip}>
        <Room plan={plan} />
        {layout.tables.map((t, i) => (
          <Table key={i} table={t} />
        ))}
        {layout.seats.map((s, i) => (
          <Chair key={i} x={s.x} z={s.z} rot={s.rot} />
        ))}
        <Displays plan={plan} displays={displays} />
        <Equipment
          plan={plan}
          a={analysis}
          onPresenterMove={onPresenterMove}
          onCredenzaMove={onCredenzaMove}
          onRackMove={onRackMove}
        />
      </ClipContext.Provider>
      <Controls plan={plan} view={view} />
      <CaptureBridge onReady={onReady} />
    </Canvas>
  );
}
