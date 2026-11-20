"use client";

import { memo, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { LEAN, type MedalControl } from "./control";
import { medalGeometry } from "./geometry";

/* The awards medal, turning slowly, drawn with three.js through React
   Three Fiber (medal.tsx says when it is drawn at all).

   It is kept cheap: one mesh, no lights and no shadows (the metal mirrors
   a small studio baked once), at most twice the screen's density on a
   canvas the size of the medal. Frames run only while the medal is on
   screen and the tab is in view: nothing is drawn while either is not,
   and nothing is rebuilt when they come back. If frames come too slowly
   while it is in view, the still picture takes over again.

   The relief, the rim and the edge are polished and the field between them
   is satin (the roughness comes from the relief maps), as on the medal:
   the struck parts and the edge catch the light as it turns while the
   field holds its colour. */


const MAPS = {
  frontNormal: "/awards/medal-front-normal.webp",
  frontOrm: "/awards/medal-front-orm.webp",
  backNormal: "/awards/medal-back-normal.webp",
  backOrm: "/awards/medal-back-orm.webp",
};

/** The gold: a warm yellow gold, as the medal is plated. The edge is the
    same metal, polished. */
const GOLD = "#e0b85a";

export default function MedalScene({
  control,
  running,
  onReady,
  onLost,
}: {
  /** How it turns, on its own and by hand (control.ts). */
  control: MedalControl;
  /** Whether the medal is on screen and the tab in view, and so worth
      turning. */
  running: boolean;
  /** Called once the first finished frame is drawn. */
  onReady: () => void;
  /** Called when the scene cannot go on: a lost context, slow frames. */
  onLost: () => void;
}) {
  return (
    <Canvas
      flat
      frameloop={running ? "always" : "demand"}
      dpr={[1, 2]}
      // A long lens: the medal 2.04 across fills about 85% of the canvas,
      // with room for its edge as it turns toward the eye.
      camera={{ fov: 26, position: [0, 0, 5.05], near: 3, far: 8 }}
      gl={{ antialias: true, alpha: true, stencil: false, powerPreference: "default" }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.debug.onShaderError = (context, _program, _vertex, fragment) => {
          console.error("[medal] shader failed", context.getShaderInfoLog(fragment));
          onLost();
        };
        gl.domElement.addEventListener("webglcontextlost", onLost, { once: true });
      }}
    >
      <Suspense fallback={null}>
        <Studio />
        <Medal control={control} onReady={onReady} onSlow={onLost} />
        <Wake />
      </Suspense>
    </Canvas>
  );
}

/* What the frame loop keeps: whether the first frame has been reported,
   and how many of the recent frames came slowly (slower than 24 a
   second). The first frames, which compile the shaders, are not counted,
   nor the few after a pause. */
type Pace = { ready: boolean; skip: number; counted: number; slow: number };

/** A gap longer than this between frames is a pause (the tab was hidden,
    the medal scrolled away), not a slow browser. */
const PAUSE_SECONDS = 0.25;

function step(
  mesh: THREE.Mesh | null,
  control: MedalControl,
  state: RootState,
  delta: number,
  pace: Pace,
  onReady: () => void,
  onSlow: () => void,
) {
  // Not before the studio is baked: metal with nothing to mirror is black.
  if (!mesh || !state.scene.environment) return;
  // After a pause the medal goes on from where it stopped.
  control.step(mesh, Math.min(delta, 1 / 30), performance.now());
  if (!pace.ready) {
    pace.ready = true;
    onReady();
    return;
  }
  if (delta > PAUSE_SECONDS) {
    pace.skip = 10;
    pace.counted = 0;
    pace.slow = 0;
    return;
  }
  if (pace.skip > 0) {
    pace.skip--;
    return;
  }
  pace.counted++;
  if (delta > 1 / 24) pace.slow++;
  if (pace.counted === 90) {
    if (pace.slow > 45) onSlow();
    pace.counted = 0;
    pace.slow = 0;
  }
}

/* The maps come in as data, not colour, and are sharpened for the angle
   the faces are seen at as the medal turns. */
function makeMaterials(maps: THREE.Texture[], anisotropy: number) {
  for (const map of maps) {
    map.colorSpace = THREE.NoColorSpace;
    map.anisotropy = anisotropy;
  }
  const [frontNormal, frontOrm, backNormal, backOrm] = maps;
  const face = (normalMap: THREE.Texture, orm: THREE.Texture) =>
    new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 1,
      metalnessMap: orm,
      // Multiplied by the map's G: about 0.2 on the polished relief and
      // rim, 0.42 to 0.58 on the grained field.
      roughness: 1,
      roughnessMap: orm,
      aoMap: orm,
      aoMapIntensity: 1,
      normalMap,
      normalScale: new THREE.Vector2(1, 1),
    });
  return [
    face(frontNormal, frontOrm),
    // The edge is turned and polished: a clear reflection, not a satin one.
    new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.16 }),
    face(backNormal, backOrm),
  ];
}

function Medal({ control, onReady, onSlow }: { control: MedalControl; onReady: () => void; onSlow: () => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const pace = useRef<Pace>({ ready: false, skip: 20, counted: 0, slow: 0 });
  const anisotropy = useThree((state) => Math.min(8, state.gl.capabilities.getMaxAnisotropy()));
  const maps = useTexture([MAPS.frontNormal, MAPS.frontOrm, MAPS.backNormal, MAPS.backOrm]);
  const geometry = useMemo(() => medalGeometry(), []);
  const materials = useMemo(() => makeMaterials(maps, anisotropy), [maps, anisotropy]);

  useFrame((state, delta) => step(mesh.current, control, state, delta, pace.current, onReady, onSlow));

  return <mesh ref={mesh} geometry={geometry} material={materials} rotation={[LEAN, 0, 0]} />;
}

/* Coming back to the tab. A browser may let go of a hidden canvas's last
   picture, and the first frame after the tab shows again is drawn only
   at the next animation frame, so for a moment the medal's place would be
   empty: the flicker of switching tabs. It is drawn at once instead, in
   the event that says the tab is back, before the page is shown. A
   subscription to the document, which no element here could carry. */
function Wake() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    const shown = () => {
      if (document.visibilityState === "visible" && scene.environment) gl.render(scene, camera);
    };
    document.addEventListener("visibilitychange", shown);
    return () => document.removeEventListener("visibilitychange", shown);
  }, [gl, scene, camera]);
  return null;
}

/* The studio the gold mirrors: a broad soft light above and to the left,
   a warm one low on the right, a soft one behind the viewer, cooler strips at the sides for the edge to
   catch as it turns, and dark below. Baked once (memoised, since drei's
   Environment bakes again whenever it re-renders). */
const Studio = memo(function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      {/* The room itself, warm and dim: what polished gold mirrors between
          the lights, so it reads as gold rather than black. */}
      <color attach="background" args={["#4a4036"]} />
      <Lightformer form="rect" intensity={2.4} color="#fff6e6" position={[-3, 4.5, 6]} scale={[10, 7, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#ffe6bf" position={[5, -2, 5]} scale={[6, 6, 1]} />
      {/* Behind the viewer: what the medal mirrors face-on, its first pose. */}
      <Lightformer form="rect" intensity={0.9} color="#fff4e0" position={[0.5, 1, 9]} scale={[9, 9, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#d8f1f8" position={[-8, 0, 0]} scale={[4, 12, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#d8f1f8" position={[8, 0, 0]} scale={[4, 12, 1]} />
      <Lightformer form="rect" intensity={1.8} position={[0, 9, 1]} scale={[14, 4, 1]} />
      <Lightformer form="rect" intensity={0.25} position={[0, -9, 1]} scale={[14, 5, 1]} />
    </Environment>
  );
});
