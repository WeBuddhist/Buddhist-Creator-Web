import type * as THREE from "three";

/* How the awards medal turns: on its own, slowly and clockwise seen from
   above, the way one walks round a stupa or a shrine with it on one's
   right (pradakshina); and by hand, when someone drags it.

   A drag moves where the medal is headed; the medal follows with damping,
   so it never jumps under the pointer. Let go, and it carries on at the
   speed it was flicked, easing back into its own slow turn; the tilt a
   drag gave it springs back. The page's handlers feed the pointer in
   (medal.tsx); the scene's frame loop calls `step` (scene.tsx). One per
   medal, kept in state and changed only through these methods. */

/** One turn in this long, on its own. */
const TURN_SECONDS = 20;
/** Its own speed, in radians a second. Negative is clockwise from above:
    the near side of the medal moves to the viewer's left. */
export const OWN_SPEED = -(Math.PI * 2) / TURN_SECONDS;
/** The medal leans back a little, so its top edge catches the light. */
export const LEAN = 0.08;
/** A drag across the medal's whole width turns it this far. */
const TURN_PER_WIDTH = Math.PI * 1.1;
const TILT_PER_HEIGHT = Math.PI * 0.5;
const MAX_TILT = 0.5;
const MAX_SPEED = 14;
/** How quickly each thing settles, per second: the medal toward where it
    is headed, a flick's speed back to its own, the tilt back to level. */
const FOLLOW = 12;
const EASE_BACK = 1.4;
const LEVEL = 4;

const settle = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

export class MedalControl {
  /** Where the medal is headed, and how fast that is moving. */
  private heading = 0;
  private speed = OWN_SPEED;
  private tilt = 0;
  private dragging = false;
  private last = { x: 0, y: 0, time: 0 };
  private size = { width: 1, height: 1 };

  press(x: number, y: number, time: number, width: number, height: number) {
    this.dragging = true;
    this.last = { x, y, time };
    this.size = { width: Math.max(1, width), height: Math.max(1, height) };
    this.speed = 0;
  }

  move(x: number, y: number, time: number) {
    if (!this.dragging) return;
    const turn = ((x - this.last.x) / this.size.width) * TURN_PER_WIDTH;
    const seconds = Math.max(1, time - this.last.time) / 1000;
    this.heading += turn;
    // The flick's speed, smoothed over the last few moves.
    this.speed += (Math.max(-MAX_SPEED, Math.min(MAX_SPEED, turn / seconds)) - this.speed) * 0.5;
    this.tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, this.tilt + ((y - this.last.y) / this.size.height) * TILT_PER_HEIGHT));
    this.last = { x, y, time };
  }

  release() {
    this.dragging = false;
  }

  /** One frame: move the heading on, and the medal toward it. */
  step(mesh: THREE.Mesh, dt: number, now: number) {
    if (this.dragging) {
      // Held still, it stops: a flick is only what the last moves were.
      if (now - this.last.time > 60) this.speed *= 1 - settle(20, dt);
    } else {
      this.speed += (OWN_SPEED - this.speed) * settle(EASE_BACK, dt);
      this.heading += this.speed * dt;
      this.tilt -= this.tilt * settle(LEVEL, dt);
    }
    mesh.rotation.y += (this.heading - mesh.rotation.y) * settle(FOLLOW, dt);
    mesh.rotation.x += (LEAN + this.tilt - mesh.rotation.x) * settle(FOLLOW, dt);
  }
}
