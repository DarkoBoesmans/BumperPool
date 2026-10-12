// Up, up, down, down, left, right, left, right, B, A. Works anywhere outside a text field.
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
  let i = 0;
  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).matches?.("input, textarea")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = k === CODE[i] ? i + 1 : k === CODE[0] ? 1 : 0;
    if (i === CODE.length) {
      i = 0;
      onUnlock();
    }
  });
}
