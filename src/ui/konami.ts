// Up, up, down, down, left, right, left, right, B, A. Works anywhere outside a text field. On a touch screen the
// arrows are swipes and B and A are two taps.
const CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function initKonami(onUnlock: () => void): void {
  let i = 0,
    sx = 0,
    sy = 0;
  const step = (k: string) => {
    i = k === CODE[i] ? i + 1 : k === CODE[0] ? 1 : 0;
    if (i === CODE.length) {
      i = 0;
      onUnlock();
    }
  };
  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).matches?.("input, textarea")) return;
    step(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  document.addEventListener("pointerdown", (e) => {
    sx = e.clientX;
    sy = e.clientY;
  });
  document.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "touch" || (e.target as HTMLElement).matches?.("input, textarea")) return;
    const dx = e.clientX - sx,
      dy = e.clientY - sy;
    if (Math.hypot(dx, dy) < 12) step(CODE[i] === "b" || CODE[i] === "a" ? CODE[i] : "tap");
    else if (Math.hypot(dx, dy) > 40)
      step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp");
  });
}
