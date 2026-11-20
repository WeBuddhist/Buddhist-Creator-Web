/* Whether this browser should be asked to draw a WebGL scene at all: the
   leaderboard's podium cards and the awards medal are enhancements, left
   out where they would be unkind or unreadable: a visitor saving data, a
   device with little memory or few cores, a forced-colours theme (which
   recolours the text but not a canvas). Browser only. */
export function worthDrawing() {
  if (typeof WebGL2RenderingContext === "undefined") return false;
  if (window.matchMedia("(forced-colors: active)").matches) return false;
  const device = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (device.connection?.saveData) return false;
  if (device.deviceMemory !== undefined && device.deviceMemory < 4) return false;
  if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4) return false;
  return true;
}
