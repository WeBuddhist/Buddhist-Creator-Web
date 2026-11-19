"use client";

import { memo, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import logoMark from "@/assets/logo-mark-white.png";
import { layOut, makeFace, makeMetal } from "./materials";
import { PASS_SECONDS, type PodiumCard, type PodiumStore } from "./store";
import { CARD } from "./tiers";

/* The bodies of the leaderboard's first three cards, drawn with three.js
   through React Three Fiber, under the cards' own markup (store.ts says
   how the two are kept together).

   It is made to cost little:
   - one canvas and one WebGL context for all three cards, kept while the
     visitor moves between the boards;
   - nothing is drawn unless something has changed (`frameloop="demand"`):
     a card lying still costs no frames at all;
   - no lights, no shadows and no post-processing: the metal mirrors a
     small studio baked once (drei's Environment) and the face is one
     material;
   - the canvas never holds more pixels than MAX_PIXELS, whatever the
     screen's density, and if frames still come slowly it is drawn at a
     lower density, and failing that given up for the plain card;
   - this file, three.js with it, is fetched only once the cards are near
     the screen (stage.tsx).

   Each card is drawn through its own camera, straight on to its middle,
   into its own part of the canvas, so each has the perspective the CSS
   gives its markup. The views of neighbours overlap, in the room each
   keeps for its corners when it turns, so a card is on a layer of its own
   and its camera sees only that layer: nothing is drawn twice. The
   cameras share one depth range, so one depth buffer serves all three. */

/** The most pixels the canvas may hold: a little over a 1440px laptop's
    row of three at a density of 2. */
const MAX_PIXELS = 3_200_000;

const DEGREES = Math.PI / 180;

export default function PodiumScene({ store, onLost }: { store: PodiumStore; onLost: () => void }) {
  // Lowered when frames come slowly; see Bodies.
  const [quality, setQuality] = useState(1);
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const area = Math.max(1, store.boxWidth * store.boxHeight);
  const density = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio, 2, Math.sqrt(MAX_PIXELS / area));
  // In quarter steps, so a small change of size does not rebuild the buffers.
  const dpr = Math.max(0.75, Math.round(density * quality * 4) / 4);

  return (
    <Canvas
      flat
      frameloop="demand"
      dpr={dpr}
      // The cards' own cameras do the work; this one is never drawn through.
      camera={{ manual: true }}
      gl={{ antialias: true, alpha: true, stencil: false, powerPreference: "default" }}
      // The canvas scrolls with the cards, so where it is on the page does not matter.
      resize={{ scroll: false, debounce: 0 }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.autoClear = false;
        // A driver that will not take a shader: back to the plain cards.
        gl.debug.onShaderError = (_context, _program, _vertex, fragment) => {
          console.error("[podium] shader failed", _context.getShaderInfoLog(fragment));
          onLost();
        };
        gl.domElement.addEventListener("webglcontextlost", onLost, { once: true });
      }}
    >
      <Suspense fallback={null}>
        <Bodies
          store={store}
          onSlow={() => {
            if (quality > 0.5) setQuality(0.5);
            else onLost();
          }}
        />
      </Suspense>
    </Canvas>
  );
}

/* What the frame loop keeps between frames: the one camera every card is
   seen through in turn, and the times between frames while something
   moves, to notice a browser that cannot keep up (more than half of the
   last sixty slower than 28 a second; the first frames after a card
   arrives are left out, since the shaders are compiled in them). */
type Loop = {
  camera: THREE.PerspectiveCamera;
  pace: { slow: number; counted: number; skip: number; moved: boolean };
};

const newLoop = (): Loop => ({
  camera: new THREE.PerspectiveCamera(),
  pace: { slow: 0, counted: 0, skip: 12, moved: false },
});

/* One frame: move each card toward where it is going, turn its body and
   its markup alike, and draw it through its own view. Asks for another
   frame only while something is still moving. */
function drawFrame(store: PodiumStore, loop: Loop, state: RootState, delta: number, onSlow: () => void) {
  const { gl, scene, size } = state;
  const { camera, pace } = loop;
  // Not before the studio is baked: metal with nothing to mirror is black.
  if (!scene.environment) {
    state.invalidate();
    return;
  }
  const dt = Math.min(delta, 0.05);
  const rem = store.rem;
  const eye = CARD.perspective * rem;
  const room = CARD.room * rem;

  /* Clear to nothing, and say so each time: whatever drew last (the
     studio's bake, for one) may have left another colour to clear to, and
     the page must show through wherever there is no card. */
  gl.setScissorTest(false);
  gl.setClearColor(0x000000, 0);
  gl.clear();

  let moving = false;
  for (const [index, card] of store.cards.entries()) {
    const parts = card.parts;
    if (!parts || card.w === 0) continue;
    if (store.step(card, dt)) moving = true;

    // The same turn the markup gets; CSS counts rx the other way round.
    parts.tilt.position.z = card.lift;
    parts.tilt.rotation.set(-card.rx * DEGREES, card.ry * DEGREES, 0);
    const face = parts.face.uniforms;
    face.uTilt.value.set(card.ry / 9, card.rx / 7);
    face.uPass.value = card.pass === null ? 9 : passAt(card.pass);
    store.pose(card);

    /* The card's view: its box and the room around it, seen from
       straight in front of its middle. Where that runs past the canvas
       only the part inside is drawn, with the view offset keeping the
       vanishing point on the card's middle. */
    const left = card.x - room;
    const top = card.y - room;
    const width = card.w + room * 2;
    const height = card.h + room * 2;
    const x0 = Math.max(left, 0);
    const y0 = Math.max(top, 0);
    const x1 = Math.min(left + width, size.width);
    const y1 = Math.min(top + height, size.height);
    if (x1 <= x0 || y1 <= y0) continue;
    camera.position.set(card.x + card.w / 2, -(card.y + card.h / 2), eye);
    camera.fov = (2 * Math.atan(height / (2 * eye))) / DEGREES;
    camera.aspect = width / height;
    camera.near = eye * 0.5;
    camera.far = eye * 1.5;
    camera.setViewOffset(width, height, x0 - left, y0 - top, x1 - x0, y1 - y0);
    camera.updateMatrixWorld();
    camera.layers.set(index + 1);
    gl.setViewport(x0, size.height - y1, x1 - x0, y1 - y0);
    gl.setScissor(x0, size.height - y1, x1 - x0, y1 - y0);
    gl.setScissorTest(true);
    gl.render(scene, camera);

    if (!card.live) {
      store.drawn(card);
      pace.skip = 12;
      moving = true;
    }
  }
  gl.setScissorTest(false);

  if (moving && pace.moved) {
    if (pace.skip > 0) pace.skip -= 1;
    else {
      pace.counted += 1;
      if (delta > 1 / 28) pace.slow += 1;
      if (pace.counted >= 60) {
        if (pace.slow > 30) onSlow();
        pace.counted = 0;
        pace.slow = 0;
        pace.skip = 12;
      }
    }
  }
  pace.moved = moving;
  if (moving) state.invalidate();
}

/* The studio the metal and the foil mirror: drei's Environment bakes
   these cards of light into an environment map once, when the canvas
   starts, and nothing is downloaded for it. A wall of soft light above
   and behind the eye, strips above and to the left, a dimmer fill to the
   right and a dark floor. The flat of the card mirrors the wall behind
   the eye, whose lower edge sits about level, so a small turn carries
   the frame and the foil from lit to shaded.

   It is memoised because it must be baked once and no more: Environment
   bakes again whenever it is rendered again, and a bake leaves the
   renderer clearing to the studio's own dark wall, which the next frame
   would then paint across the whole canvas, behind the cards. */
const Studio = memo(function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={[0.2, 0.2, 0.21]} />
      <Lightformer form="rect" intensity={2.6} position={[-2.14, 4.71, 8.56]} scale={[13, 8, 1]} />
      <Lightformer form="rect" intensity={0.9} position={[4.08, -4.08, 8.16]} scale={[9, 6, 1]} />
      <Lightformer form="rect" intensity={3.4} position={[0, 9.89, 1.48]} scale={[16, 5, 1]} />
      <Lightformer form="rect" intensity={1.7} position={[-9.84, 0.98, 1.48]} scale={[5, 12, 1]} />
      <Lightformer form="rect" intensity={1} position={[9.89, 0, 1.48]} scale={[5, 12, 1]} />
      <Lightformer form="rect" intensity={0.3} position={[0, -9.89, 1.48]} scale={[16, 6, 1]} />
    </Environment>
  );
});

function Bodies({ store, onSlow }: { store: PodiumStore; onSlow: () => void }) {
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const invalidate = useThree((state) => state.invalidate);

  // The lion's outline: only its alpha is read.
  const logo = useTexture(logoMark.src);

  useEffect(() => store.attachScene(invalidate), [store, invalidate]);

  const loop = useRef<Loop>(null);
  // Above zero, so the canvas leaves the drawing to this.
  useFrame((state, delta) => drawFrame(store, (loop.current ??= newLoop()), state, delta, onSlow), 1);

  return (
    <>
      <Studio />
      {store.cards.map((card, index) =>
        card.w > 0 ? (
          <Body
            key={card.key}
            store={store}
            card={card}
            layer={index + 1}
            logo={logo}
            rem={store.rem}
            // Halves of a pixel are near enough: a geometry is not rebuilt for less.
            w={Math.round(card.w * 2) / 2}
            h={Math.round(card.h * 2) / 2}
            px={Math.round(card.px * 2) / 2}
            py={Math.round(card.py * 2) / 2}
            pr={Math.round(card.pr * 2) / 2}
            x={card.x}
            y={card.y}
          />
        ) : null,
      )}
    </>
  );
}

/** Where the passing light is, `seconds` into its pass: from off the
    card's top-left corner to off its bottom-right, slowing as it goes. */
function passAt(seconds: number) {
  if (seconds < 0) return 9;
  const t = seconds / PASS_SECONDS;
  return -0.3 + (1 - Math.pow(1 - t, 3)) * 1.75;
}

function roundedRect(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.max(0, Math.min(radius, w, h));
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

/* One card's body, all of which turns: the frame, a flat band of metal
   with no bevel; the face, set a hair into it; and the flat ring round the
   photo, standing off the face as the photo does. Everything is in CSS
   pixels, with the front of the frame at z = 0, where the markup is. */
function Body({
  store,
  card,
  layer,
  logo,
  rem,
  w,
  h,
  px,
  py,
  pr,
  x,
  y,
}: {
  store: PodiumStore;
  card: PodiumCard;
  /** The layer its camera sees. */
  layer: number;
  logo: THREE.Texture;
  rem: number;
  w: number;
  h: number;
  px: number;
  py: number;
  pr: number;
  x: number;
  y: number;
}) {
  const unit = rem / 16;
  const radius = CARD.radius * rem;
  const frame = CARD.frame * rem;
  const depth = CARD.depth * rem;

  const materials = useMemo(
    () => ({ face: makeFace(card.tier, logo), metal: makeMetal(card.tier) }),
    [card.tier, logo],
  );
  useEffect(
    () => () => {
      materials.face.dispose();
      materials.metal.dispose();
    },
    [materials],
  );

  const shapes = useMemo(() => {
    const outline = roundedRect(w, h, radius);
    outline.holes.push(roundedRect(w - frame * 2, h - frame * 2, radius - frame));
    const frameGeometry = new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 10 });
    frameGeometry.translate(0, 0, -depth);
    return {
      frame: frameGeometry,
      face: new THREE.ShapeGeometry(roundedRect(w - frame * 2, h - frame * 2, radius - frame), 10),
    };
  }, [w, h, radius, frame, depth]);
  useEffect(
    () => () => {
      shapes.frame.dispose();
      shapes.face.dispose();
    },
    [shapes],
  );

  // A flat band, as the frame is, from just under the photo's edge outward.
  const ring = useMemo(() => new THREE.RingGeometry(pr - unit, pr + 3.5 * unit, 96), [pr, unit]);
  useEffect(() => () => ring.dispose(), [ring]);

  const tilt = useRef<THREE.Group>(null);
  useEffect(() => {
    layOut(materials.face, { w, h, px, py, pr, rem });
    if (tilt.current) store.setParts(card, { tilt: tilt.current, face: materials.face });
    return () => store.setParts(card, null);
  }, [store, card, materials, w, h, px, py, pr, rem]);

  return (
    <group position={[x + w / 2, -(y + h / 2), 0]}>
      <group ref={tilt}>
        <mesh geometry={shapes.frame} material={materials.metal} layers={layer} />
        <mesh geometry={shapes.face} material={materials.face} position-z={-0.5 * unit} layers={layer} />
        {pr > 0 && (
          <mesh
            geometry={ring}
            material={materials.metal}
            position={[px - w / 2, h / 2 - py, CARD.photoLift * rem]}
            layers={layer}
          />
        )}
      </group>
    </group>
  );
}
