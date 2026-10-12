// Tabs: all panels share one grid cell (o-stack), so the box never changes size. Arrow keys move between tabs.
export function initTabs(list: HTMLElement, onSelect?: (tab: HTMLElement) => void): (tab: HTMLElement) => void {
  const btns = [...list.querySelectorAll<HTMLElement>("[role=tab]")];
  const sel = (b: HTMLElement) => {
    for (const x of btns) {
      const on = x === b,
        id = x.getAttribute("aria-controls"),
        p = id ? document.getElementById(id) : null;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      if (p) {
        p.classList.toggle("is-off", !on);
        p.inert = !on;
      }
    }
    onSelect?.(b);
  };
  for (const b of btns) b.addEventListener("click", () => sel(b));
  list.addEventListener("keydown", (e) => {
    const d = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[e.key];
    if (!d) return;
    const i = (btns.findIndex((b) => b.getAttribute("aria-selected") === "true") + d + btns.length) % btns.length;
    sel(btns[i]);
    btns[i].focus();
    e.preventDefault();
  });
  sel(btns.find((b) => b.getAttribute("aria-selected") === "true") || btns[0]);
  return sel;
}
