// The signs: the neon marquee over the door, the regular of the month (or you, at home), the photo wall and the clock.
import { paintPortrait } from "../people/portrait";
import { t } from "../i18n";
import { POSTER, fit, type BoardCtx } from "./boards-draw";

export function drawMarquee(c: CanvasRenderingContext2D | null, { G, venue }: BoardCtx): string | void {
  if (!c) return (G ? G.names.join("|") + G.manche : "none") + venue.id;
  const w = c.canvas.width;
  c.fillStyle = "#0a0605";
  c.fillRect(0, 0, w, c.canvas.height);
  const neon = (txt: string, y: number, size: number, col: string) => {
    c.font = `${size}px ${POSTER}`;
    c.textAlign = "center";
    c.shadowColor = col;
    c.shadowBlur = 18;
    c.fillStyle = col;
    c.fillText(txt, w / 2, y);
    c.shadowBlur = 0;
    c.fillStyle = "#fff4e0";
    c.globalAlpha = 0.55;
    c.fillText(txt, w / 2, y);
    c.globalAlpha = 1;
  };
  const sign = t(venue.marquee);
  fit(c, sign, (s) => `${s}px ${POSTER}`, 34, w - 40);
  neon(sign, 40, parseInt(c.font), venue.neon);
  if (G) {
    const vs = t("{a}  vs  {b}", { a: G.names[0], b: G.names[1] }).toUpperCase();
    fit(c, vs, (s) => `${s}px ${POSTER}`, 44, w - 40);
    neon(vs, 92, parseInt(c.font), "#ff4a6a");
  }
}

export function drawRegular(c: CanvasRenderingContext2D | null, { opp, host }: BoardCtx): string | void {
  if (!c) return opp ? opp.id : host ? host.name + JSON.stringify(host.look) : "none";
  const w = c.canvas.width,
    h = c.canvas.height,
    who = opp || (host && { look: host.look, name: host.name });
  c.fillStyle = "#1a120c";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#c9a35b";
  c.font = `17px ${POSTER}`;
  c.textAlign = "center";
  c.fillText(opp ? t("REGULAR OF THE MONTH") : t("THE LANDLORD"), w / 2, 24);
  if (!who) return;
  const p = document.createElement("canvas");
  p.width = p.height = 64;
  paintPortrait(p, who);
  c.imageSmoothingEnabled = false;
  c.drawImage(p, 16, 34, w - 32, w - 32);
  c.fillStyle = "#efe4c8";
  fit(c, who.name.toUpperCase(), (s) => `${s}px ${POSTER}`, 26, w - 16);
  c.fillText(who.name.toUpperCase(), w / 2, h - 18);
}

/** the photo wall: a snapshot of every regular you have beaten, an empty frame for the rest */
export function drawPhotoWall(c: CanvasRenderingContext2D | null, { regulars }: BoardCtx): string | void {
  if (!c) return regulars.map((r) => +r.beaten).join("");
  const w = c.canvas.width,
    h = c.canvas.height,
    cols = 6,
    rows = Math.ceil(regulars.length / cols),
    cw = (w - 24) / cols,
    ch = (h - 52) / rows,
    ps = Math.min(cw - 14, ch - 26);
  c.fillStyle = "#3a2416";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#efe4c8";
  c.textAlign = "center";
  c.font = `26px ${POSTER}`;
  c.fillText(t("THE REGULARS"), w / 2, 34);
  const p = document.createElement("canvas");
  p.width = p.height = 64;
  c.imageSmoothingEnabled = false;
  regulars.forEach(({ o, beaten }, i) => {
    const x = 12 + (i % cols) * cw + (cw - ps) / 2,
      y = 46 + Math.floor(i / cols) * ch;
    c.save();
    c.translate(x + ps / 2, y + ps / 2);
    c.rotate(((i * 37) % 7) / 100 - 0.03); // pinned up by hand, never quite straight
    c.fillStyle = "#f4ead2";
    c.fillRect(-ps / 2 - 4, -ps / 2 - 4, ps + 8, ps + 18); // a white photo border, wider at the bottom
    if (beaten) {
      paintPortrait(p, o);
      c.drawImage(p, -ps / 2, -ps / 2, ps, ps);
    } else {
      c.fillStyle = "#2a1c14";
      c.fillRect(-ps / 2, -ps / 2, ps, ps);
      c.fillStyle = "#6a5a48";
      c.font = `${ps * 0.6}px ${POSTER}`;
      c.fillText("?", 0, ps * 0.22);
    }
    c.fillStyle = "#2a1c14";
    c.font = `11px ${POSTER}`;
    if (beaten) c.fillText(o.name.split(" ")[0].toUpperCase(), 0, ps / 2 + 11);
    c.restore();
  });
}

export function drawClock(c: CanvasRenderingContext2D | null): string | void {
  const d = new Date(),
    key = d.getHours() + ":" + d.getMinutes();
  if (!c) return key;
  const w = c.canvas.width,
    r = w / 2 - 6;
  c.fillStyle = "#efe4c8";
  c.beginPath();
  c.arc(w / 2, w / 2, r, 0, 7);
  c.fill();
  c.strokeStyle = "#1d140c";
  c.lineWidth = 6;
  c.stroke();
  c.save();
  c.translate(w / 2, w / 2);
  for (let i = 0; i < 12; i++) {
    c.rotate(Math.PI / 6);
    c.fillStyle = "#1d140c";
    c.fillRect(-2, -r + 8, 4, 12);
  }
  const hand = (a: number, len: number, wd: number) => {
    c.save();
    c.rotate(a);
    c.fillRect(-wd / 2, -len, wd, len + 8);
    c.restore();
  };
  hand((((d.getHours() % 12) + d.getMinutes() / 60) * Math.PI) / 6, r * 0.5, 7);
  hand((d.getMinutes() * Math.PI) / 30, r * 0.78, 4);
  c.restore();
}
