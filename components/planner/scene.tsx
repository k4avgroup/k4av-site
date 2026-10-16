'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Matrix4,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Analysis, CameraSpec, Plan, Vec3 } from '@/lib/planner/model';
import { presenterRange, presenterSpot, rules } from '@/lib/planner/model';

export type ViewName = 'iso' | 'top' | 'front' | 'side';
export type ViewState = { name: ViewName; nonce: number };
export type Capture = () => Promise<Blob | null>;

const COLORS = { speaker: '#3ddc84', mic: '#4cc9f0', camera: '#ffb703', plane: '#3a86ff' };

export function viewPose(plan: Pick<Plan, 'length' | 'width' | 'height'>, name: ViewName) {
  const R = Math.max(plan.length, plan.width);
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

// What the display shows: a video call with two remote people, a small self view and the logo in the corner.
function drawScreen(canvas: HTMLCanvasElement, logo: HTMLImageElement | null) {
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
}

function useScreenTexture() {
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    drawScreen(canvas, null);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      drawScreen(texture.image as HTMLCanvasElement, img);
      texture.needsUpdate = true;
      invalidate();
    };
    img.src = '/images/logo/k4av-logo-final.png';
    return () => {
      img.onload = null;
    };
  }, [texture, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Room({ plan }: { plan: Plan }) {
  const { width: W, length: L, height: H } = plan;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#42506a" roughness={0.95} />
      </mesh>
      <mesh position={[0, H / 2, -L / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#d5d9de" side={DoubleSide} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[L, H]} />
        <meshStandardMaterial color="#c4c9cf" side={DoubleSide} />
      </mesh>
      {plan.ceiling && <Ceiling width={W} length={L} height={H} />}
    </group>
  );
}

// The ceiling is drawn as an outline with a very faint fill, so the room stays readable from above.
function Ceiling({ width, length, height }: { width: number; length: number; height: number }) {
  const edges = useMemo(() => new EdgesGeometry(new PlaneGeometry(width, length)), [width, length]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[width, length]} />
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

function Table({ table }: { table: Analysis['layout']['table'] }) {
  const wood = '#b98b62';
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
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  texture: CanvasTexture;
}) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.05]} />
        <meshStandardMaterial color="#0b0d10" />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

// A person who can be dragged across the floor. While they are held, the camera controls step aside.
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
  const { camera, gl, get } = useThree();
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const stopDrag = useRef<(() => void) | null>(null);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const range = presenterRange(size.width, size.length);

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
          Math.min(range.x[1], Math.max(range.x[0], p.x + dx)),
          Math.min(range.z[1], Math.max(range.z[0], p.z + dz)),
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

  const lit = hover || held;
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
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 1.9, 14]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
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
    </group>
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
      <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} depthWrite={false} />
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
      <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} depthWrite={false} />
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
  const wallZ = (cam.pos[2] < 0 ? -room.length : room.length) / 2 - cam.pos[2];
  const outward = Math.sign(wallZ);
  return (
    <group position={cam.pos}>
      <mesh position={[0, -0.09, wallZ - outward * 0.007]}>
        <boxGeometry args={[0.14, 0.24, 0.014]} />
        <meshStandardMaterial color="#cfd3da" />
      </mesh>
      <mesh position={[0, -0.15, wallZ / 2]}>
        <boxGeometry args={[0.12, 0.03, Math.abs(wallZ)]} />
        <meshStandardMaterial color="#aeb4bd" />
      </mesh>
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
      {showView && (
        <group quaternion={quaternion}>
          <mesh geometry={geometry}>
            <meshBasicMaterial color={COLORS.camera} transparent opacity={0.07} side={DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color={COLORS.camera} transparent opacity={0.55} />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
function Equipment({
  plan,
  a,
  onPresenterMove,
}: {
  plan: Plan;
  a: Analysis;
  onPresenterMove: (x: number, z: number) => void;
}) {
  const { gear, displays } = a;
  const spot = presenterSpot(plan, displays);
  const ear = rules.earHeight;
  const frontZ = -plan.length / 2;
  return (
    <group>
      {/* speakers */}
      {gear.soundbar && (
        <mesh position={gear.soundbar.pos}>
          <boxGeometry args={[gear.soundbar.width, 0.07, 0.1]} />
          <meshStandardMaterial color="#14171c" />
        </mesh>
      )}
      {plan.speakers === 'front' &&
        gear.speakers.map((p, i) => (
          <group key={`sp-${i}`}>
            <mesh position={p}>
              <boxGeometry args={[0.16, 0.36, 0.14]} />
              <meshStandardMaterial color="#14171c" />
            </mesh>
            {plan.speakerCones && (
              <ConeVolume
                apex={p}
                base={gear.speakerTargets[i]}
                halfAngle={rules.speakerHalfAngle}
                color={COLORS.speaker}
                opacity={0.13}
              />
            )}
          </group>
        ))}
      {plan.speakers === 'ceiling' &&
        gear.speakers.map((p, i) => (
          <group key={`cs-${i}`}>
            <mesh position={p}>
              <cylinderGeometry args={[0.1, 0.1, 0.03, 20]} />
              <meshStandardMaterial color="#f2f4f6" />
            </mesh>
            {plan.speakerCones && (
              <>
                <ConeVolume
                  apex={p}
                  base={[p[0], ear, p[2]]}
                  halfAngle={rules.speakerHalfAngle}
                  color={COLORS.speaker}
                  opacity={0.12}
                />
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
          <meshBasicMaterial color={COLORS.plane} transparent opacity={0.12} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* microphones */}
      {plan.mics === 'ceiling' &&
        gear.mics.map((p, i) => (
          <group key={`ma-${i}`}>
            <MicArray position={p} shape={plan.micShape} />
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
            <mesh position={p}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
              <meshStandardMaterial color="#14171c" />
            </mesh>
            {plan.micCoverage && (
              <Disc position={[p[0], p[1] + 0.02, p[2]]} radius={gear.micRadius} color={COLORS.mic} opacity={0.16} />
            )}
          </group>
        ))}
      {plan.mics === 'integrated' && plan.micCoverage && (
        <mesh position={[0, ear, frontZ + 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[gear.micRadius, 48, Math.PI, Math.PI]} />
          <meshBasicMaterial color={COLORS.mic} transparent opacity={0.14} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* cameras */}
      {gear.cameras.map((c, i) => (
        <CameraBody
          key={`cam-${i}`}
          cam={c}
          room={{ width: plan.width, length: plan.length, height: plan.height }}
          showView={plan.cameraView}
        />
      ))}

      {/* table connection panels and the touch panel */}
      {gear.panels.map((p, i) => (
        <mesh key={`pn-${i}`} position={p}>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <meshStandardMaterial color="#14171c" />
        </mesh>
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
      {plan.presenter && (
        <Presenter x={spot.x} z={spot.z} size={{ width: plan.width, length: plan.length }} onMove={onPresenterMove} />
      )}
    </group>
  );
}

// One texture shared by both displays.
function Displays({ plan, displays }: { plan: Plan; displays: Analysis['displays'] }) {
  const texture = useScreenTexture();
  return (
    <>
      {displays.xs.map((x, i) => (
        <Display
          key={i}
          x={x}
          y={displays.centerY}
          w={displays.width}
          h={displays.height}
          z={-plan.length / 2 + 0.03}
          texture={texture}
        />
      ))}
    </>
  );
}

export default function PlannerScene({
  plan,
  analysis,
  view,
  onReady,
  onPresenterMove,
}: {
  plan: Plan;
  analysis: Analysis;
  view: ViewState;
  onReady: (capture: Capture) => void;
  onPresenterMove: (x: number, z: number) => void;
}) {
  const initial = viewPose(plan, 'iso');
  const { layout, displays } = analysis;
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 200, position: initial.position }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ position: 'absolute', inset: 0 }}
      aria-label="3D view of the room"
    >
      <color attach="background" args={['#14181e']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[6, 10, 8]} intensity={1.3} />
      <Room plan={plan} />
      <Table table={layout.table} />
      {layout.seats.map((s, i) => (
        <Chair key={i} x={s.x} z={s.z} rot={s.rot} />
      ))}
      <Displays plan={plan} displays={displays} />
      <Equipment plan={plan} a={analysis} onPresenterMove={onPresenterMove} />
      <Controls plan={plan} view={view} />
      <CaptureBridge onReady={onReady} />
    </Canvas>
  );
}
