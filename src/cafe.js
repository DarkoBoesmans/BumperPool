// The Golden Cue: the room, the bar, booths, lamps, live boards on the walls, people, smoke,
// and the cigar and whisky that belong to each player. Low poly, vertex lit, PS2 chic.
import {
  THREE,
  S,
  M,
  FLOOR,
  lam,
  basic,
  phong,
  facet,
  canvasTex,
  add,
  camS,
  toScreen,
} from "./scene.js";
import { COLORS, home, R } from "./game.js";
import { paintPortrait } from "./opponents.js";

export const C = { boards: [], figs: {}, props: {}, say: () => {} };
const WX = 5,
  WZ = 3.8,
  H = 3.1;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

// ---------- build ----------
export function buildCafe(scene) {
  const room = new THREE.Group();
  scene.add(room);
  // floor: burgundy and cream tiles, worn
  const floorTex = canvasTex(
    128,
    128,
    (c, w) => {
      const n = 4,
        s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const v = rnd(-8, 8);
          c.fillStyle =
            (i + j) % 2
              ? `rgb(${104 + v},${28 + v / 2},${30 + v / 2})`
              : `rgb(${214 + v},${196 + v},${160 + v})`;
          c.fillRect(i * s, j * s, s, s);
        }
      c.fillStyle = "rgba(30,14,8,.5)";
      for (let i = 0; i <= n; i++) {
        c.fillRect(i * s - 1, 0, 2, w);
        c.fillRect(0, i * s - 1, w, 2);
      }
      for (let k = 0; k < 400; k++) {
        c.fillStyle = `rgba(40,20,10,${rnd(0.02, 0.08)})`;
        c.fillRect(rnd(0, w), rnd(0, w), rnd(1, 4), rnd(1, 3));
      }
    },
    { repeat: [6.25, 4.75], pixel: true },
  );
  add(
    room,
    new THREE.PlaneGeometry(2 * WX, 2 * WZ, 40, 30),
    lam(0xffffff, { map: floorTex }),
    0,
    FLOOR,
    0,
  ).rotation.x = -Math.PI / 2;
  // walls: bottle-green damask above mahogany panels, a brass rail between
  const wallTex = canvasTex(
    128,
    128,
    (c, w, h) => {
      c.fillStyle = "#1b3324";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(120,150,90,.12)";
      for (let y = 8; y < 64; y += 32)
        for (let x = 16; x < w; x += 32) {
          const o = ((y / 32) | 0) % 2 ? 16 : 0;
          c.beginPath();
          c.ellipse(x + o, y + 6, 5, 9, 0, 0, 7);
          c.fill();
        }
      const wy = 64;
      c.fillStyle = "#4a1d10";
      c.fillRect(0, wy, w, h - wy);
      c.strokeStyle = "rgba(0,0,0,.5)";
      c.lineWidth = 3;
      c.strokeRect(8, wy + 10, w - 16, h - wy - 20);
      c.strokeStyle = "rgba(255,190,140,.1)";
      c.lineWidth = 1;
      c.strokeRect(12, wy + 14, w - 24, h - wy - 28);
      c.fillStyle = "#c99a4c";
      c.fillRect(0, wy - 3, w, 4);
    },
    { pixel: true },
  );
  const wall = (len, x, z, ry) => {
    const t = wallTex.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(len / 1.3, 1);
    const m = add(
      room,
      new THREE.PlaneGeometry(len, 2.6, Math.round(len * 2), 6),
      lam(0xffffff, { map: t }),
      x,
      FLOOR + 1.3,
      z,
    );
    m.rotation.y = ry;
    add(
      room,
      new THREE.PlaneGeometry(len, H - 2.6, 2, 1),
      lam(0x14251a),
      x,
      FLOOR + 2.6 + (H - 2.6) / 2,
      z,
    ).rotation.y = ry;
  };
  wall(2 * WX, 0, -WZ, 0);
  wall(2 * WX, 0, WZ, Math.PI);
  wall(2 * WZ, -WX, 0, Math.PI / 2);
  wall(2 * WZ, WX, 0, -Math.PI / 2);
  const over = (C.overhead = new THREE.Group());
  room.add(over); // ceiling and beams: hidden with the lamps when the camera looks straight down
  add(
    over,
    new THREE.PlaneGeometry(2 * WX, 2 * WZ),
    lam(0x120b08),
    0,
    FLOOR + H,
    0,
  ).rotation.x = Math.PI / 2;
  for (let x = -4; x <= 4; x += 2)
    add(
      over,
      new THREE.BoxGeometry(0.18, 0.16, 2 * WZ),
      lam(0x2a140a),
      x,
      FLOOR + H - 0.08,
      0,
    );
  // light: a dim warm room, three pools over the table
  scene.add(new THREE.HemisphereLight(0xffd9b0, 0x2a140a, 0.34));
  // brass picture lights over the chalkboards and two sconces between the booths
  for (const [x, y, z, ry] of [
    [WX - 0.12, 1.08, 0, -Math.PI / 2],
    [-WX + 0.12, 1.08, 0, Math.PI / 2],
    [-0.9, 1.35, WZ - 0.12, Math.PI],
    [0.9, 1.35, WZ - 0.12, Math.PI],
  ]) {
    const l = add(
      room,
      new THREE.BoxGeometry(0.5, 0.05, 0.08),
      S.brass,
      x,
      y,
      z,
    );
    l.rotation.y = ry;
    const b = add(
      room,
      new THREE.BoxGeometry(0.44, 0.012, 0.03),
      basic(0xfff1c8),
      x,
      y - 0.03,
      z,
    );
    b.rotation.y = ry;
    const p = new THREE.PointLight(0xffd9a0, 0.7, 2.6, 1.5);
    p.position.set(x * 0.97, y - 0.15, z * 0.97);
    scene.add(p);
  }
  for (const x of [-0.6, 0, 0.6]) {
    const sp = new THREE.SpotLight(0xffe4b8, 1.35, 4.2, 0.85, 0.65, 1.2);
    sp.position.set(x, 0.86, 0);
    sp.target.position.set(x, -0.5, 0);
    scene.add(sp, sp.target);
  }
  buildLamps(scene);
  for (const h of [-1, 1]) {
    // a pendant over each player's spot, so the players are not just silhouettes
    const g = new THREE.Group();
    g.position.set(h * 1.9, FLOOR + 2.25, -h * 1.05);
    scene.add(g);
    add(
      g,
      facet(new THREE.CylinderGeometry(0.04, 0.13, 0.12, 8, 1, true)),
      lam(0x0d7a3e, { emissive: 0x05301a }),
      0,
      0,
      0,
    );
    add(g, new THREE.SphereGeometry(0.03, 6, 4), basic(0xfff1c8), 0, -0.04, 0);
    add(
      g,
      new THREE.CylinderGeometry(0.003, 0.003, 0.9, 4),
      S.brass,
      0,
      0.5,
      0,
    );
    const p = new THREE.PointLight(0xffd8a8, 0.9, 3.4, 1.4);
    p.position.set(h * 1.9, FLOOR + 2.1, -h * 1.05);
    scene.add(p);
  }
  buildBar(room, scene);
  buildBooths(room, scene);
  buildJukebox(room, scene);
  buildBoards(room);
  buildSmoke(scene);
  buildProps(scene);
  buildViewmodel(scene);
  C.bartender = figure(
    {
      skin: "#e5b08e",
      shirt: "#f1ece0",
      trim: "#1a1a1a",
      pants: "#1a1a1a",
      hair: "#1c1410",
      hat: "none",
      stache: true,
      build: 1.05,
    },
    "stand",
  );
  C.bartender.g.position.set(1.1, FLOOR, -3.15);
  room.add(C.bartender.g);
  C.bartender.hold("glass");
  C.bartender.glass.liquid.visible = false;
  const p1 = figure(
    {
      skin: "#d9a07c",
      shirt: "#3d5a46",
      trim: "#e0d6c0",
      pants: "#2a2622",
      hair: "#9a948a",
      hat: "flatcap",
      hatColor: "#3a3028",
      stache: true,
      build: 1.1,
    },
    "sit",
  );
  p1.g.position.set(-2.95, FLOOR, 2.95);
  p1.g.rotation.y = Math.PI / 2;
  room.add(p1.g);
  p1.hold("cigar");
  const p2 = figure(
    {
      skin: "#efc2a4",
      shirt: "#7a2433",
      trim: "#f0d8c8",
      pants: "#2a2228",
      hair: "#5a2a18",
      hat: "bun",
      hatColor: "#5a2a18",
      lips: true,
      build: 0.9,
    },
    "sit",
  );
  p2.g.position.set(-1.85, FLOOR, 2.95);
  p2.g.rotation.y = -Math.PI / 2;
  room.add(p2.g);
  p2.hold("glass");
  C.patrons = [p1, p2];
}

function buildLamps(scene) {
  const g = (C.lamps = new THREE.Group());
  scene.add(g);
  const brass = S.brass;
  add(
    g,
    new THREE.CylinderGeometry(0.01, 0.01, 1.5, 6),
    brass,
    0,
    1.02,
    0,
  ).rotation.z = Math.PI / 2;
  for (const x of [-0.7, 0.7])
    add(g, new THREE.CylinderGeometry(0.004, 0.004, 1.4, 4), brass, x, 1.72, 0);
  const shade = facet(new THREE.CylinderGeometry(0.06, 0.2, 0.18, 10, 1, true));
  const out = lam(0x0d7a3e, { emissive: 0x05301a, side: THREE.FrontSide });
  const inner = basic(0xfff1c8, { side: THREE.BackSide });
  const rim = basic(0x7dffa6);
  const haze = basic(0xffe6b0, {
    transparent: true,
    opacity: 0.022,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const x of [-0.6, 0, 0.6]) {
    add(g, shade, out, x, 0.89, 0);
    add(g, shade, inner, x, 0.89, 0).scale.setScalar(0.98);
    add(
      g,
      new THREE.TorusGeometry(0.2, 0.006, 3, 20),
      rim,
      x,
      0.8,
      0,
    ).rotation.x = Math.PI / 2;
    add(g, new THREE.SphereGeometry(0.035, 6, 4), basic(0xfffbe8), x, 0.86, 0);
    add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), brass, x, 1.0, 0);
    add(g, new THREE.ConeGeometry(0.62, 0.8, 12, 1, true), haze, x, 0.4, 0);
    S.flares.push({
      pos: new THREE.Vector3(x, 0.86, 0),
      k: 1,
      vis: () => g.visible,
    });
  }
}

function bottle(g, x, y, z, col, kind) {
  const m = lam(col, {
    emissive: new THREE.Color(col).multiplyScalar(0.25),
    transparent: kind === "clear",
    opacity: 0.6,
  });
  const tall = kind === "tall" ? 0.34 : kind === "squat" ? 0.2 : 0.27,
    r = kind === "squat" ? 0.05 : 0.038;
  add(
    g,
    facet(new THREE.CylinderGeometry(r, r, tall * 0.68, 6)),
    m,
    x,
    y + tall * 0.34,
    z,
  );
  add(
    g,
    facet(new THREE.CylinderGeometry(0.013, r * 0.8, tall * 0.14, 6)),
    m,
    x,
    y + tall * 0.75,
    z,
  );
  add(
    g,
    new THREE.CylinderGeometry(0.012, 0.012, tall * 0.18, 5),
    m,
    x,
    y + tall * 0.9,
    z,
  );
  add(
    g,
    new THREE.BoxGeometry(r * 1.5, tall * 0.18, 0.004),
    lam(["#efe2c0", "#d8c38a", "#f4f0e6", "#c9302c"][(Math.random() * 4) | 0]),
    x,
    y + tall * 0.33,
    z + r * 0.98,
  );
}

function buildBar(room, scene) {
  const g = new THREE.Group();
  room.add(g);
  const front = canvasTex(
    64,
    64,
    (c, w, h) => {
      c.fillStyle = "#52200f";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(0,0,0,.55)";
      c.lineWidth = 3;
      c.strokeRect(6, 8, w - 12, h - 16);
      c.strokeStyle = "rgba(255,190,130,.14)";
      c.lineWidth = 1;
      c.strokeRect(9, 11, w - 18, h - 22);
    },
    { repeat: [7, 1], pixel: true },
  );
  const zf = -2.75,
    len = 5.4;
  add(
    g,
    new THREE.BoxGeometry(len, 1.04, 0.5),
    lam(0xffffff, { map: front }),
    0,
    FLOOR + 0.52,
    zf - 0.25,
  );
  add(
    g,
    new THREE.BoxGeometry(len + 0.1, 0.05, 0.62),
    phong(0x2a0f07, { specular: 0x553322, shininess: 30 }),
    0,
    FLOOR + 1.065,
    zf - 0.27,
  );
  add(
    g,
    new THREE.CylinderGeometry(0.018, 0.018, len, 6),
    S.brass,
    0,
    FLOOR + 0.2,
    zf + 0.12,
  ).rotation.z = Math.PI / 2;
  add(
    g,
    new THREE.CylinderGeometry(0.012, 0.012, len, 6),
    S.brass,
    0,
    FLOOR + 1.0,
    zf + 0.04,
  ).rotation.z = Math.PI / 2;
  // taps, glasses and a bottle on the counter
  for (const x of [-0.5, -0.38, -0.26]) {
    add(
      g,
      new THREE.CylinderGeometry(0.02, 0.025, 0.24, 6),
      S.brass,
      x,
      FLOOR + 1.21,
      zf - 0.33,
    );
    add(
      g,
      new THREE.BoxGeometry(0.025, 0.12, 0.025),
      lam(0x0e0e10),
      x,
      FLOOR + 1.39,
      zf - 0.33,
    );
  }
  bottle(g, 1.6, FLOOR + 1.09, zf - 0.3, 0xb8661a, "tall");
  const tumbler = lam(0xe8f0f0, { transparent: true, opacity: 0.35 });
  for (const x of [1.75, 1.88, -1.2]) {
    add(
      g,
      facet(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 7)),
      tumbler,
      x,
      FLOOR + 1.13,
      zf - 0.2,
    );
    add(
      g,
      new THREE.CylinderGeometry(0.031, 0.028, 0.035, 7),
      lam(0xc8761e, { emissive: 0x3a1a04 }),
      x,
      FLOOR + 1.11,
      zf - 0.2,
    );
  }
  ashtray(g, -1.05, FLOOR + 1.09, zf - 0.22, true);
  // back bar: mirror, shelves with bottles, a warm strip of light under each shelf
  const mirror = canvasTex(64, 32, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#2a2018");
    gr.addColorStop(0.5, "#4a3626");
    gr.addColorStop(1, "#1a120c");
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,230,200,.06)";
    for (let i = 0; i < 6; i++) c.fillRect(i * 12, 0, 4, h);
  });
  add(
    g,
    new THREE.PlaneGeometry(4.8, 1.2),
    basic(0xffffff, { map: mirror }),
    0,
    FLOOR + 1.78,
    -WZ + 0.02,
  );
  add(
    g,
    new THREE.BoxGeometry(5, 1.5, 0.08),
    lam(0x3a160a),
    0,
    FLOOR + 1.75,
    -WZ + 0.01,
  ).position.z = -WZ + 0.005;
  for (const y of [FLOOR + 1.3, FLOOR + 1.68, FLOOR + 2.06]) {
    add(
      g,
      new THREE.BoxGeometry(4.8, 0.035, 0.26),
      lam(0x3a160a),
      0,
      y,
      -WZ + 0.15,
    );
    add(
      g,
      new THREE.BoxGeometry(4.7, 0.012, 0.02),
      basic(0xffb85a),
      0,
      y - 0.024,
      -WZ + 0.2,
    );
    for (let x = -2.25; x <= 2.25; x += rnd(0.13, 0.22))
      bottle(
        g,
        x,
        y + 0.018,
        -WZ + 0.14,
        [0xb8661a, 0x7a3a10, 0x1f4a2a, 0xd8e2d8, 0x8a1a1a, 0xc89a3a][
          (Math.random() * 6) | 0
        ],
        ["", "tall", "squat", "clear"][(Math.random() * 4) | 0],
      );
  }
  add(
    g,
    new THREE.BoxGeometry(5, 0.08, 0.12),
    lam(0x2a0f07),
    0,
    FLOOR + 2.55,
    -WZ + 0.06,
  );
  for (const x of [-1.6, 0, 1.6]) {
    const p = new THREE.PointLight(0xffb468, 0.55, 3.2, 1.5);
    p.position.set(x, FLOOR + 2.1, -WZ + 0.9);
    scene.add(p);
  }
  // stools
  const seat = lam(0x8a1f1a),
    chrome = phong(0xcfd3d8, { specular: 0xffffff, shininess: 80 });
  for (let i = 0; i < 6; i++) {
    const x = -2.1 + i * 0.84;
    add(
      g,
      facet(new THREE.CylinderGeometry(0.19, 0.17, 0.08, 8)),
      seat,
      x,
      FLOOR + 0.78,
      zf + 0.42,
    );
    add(
      g,
      new THREE.CylinderGeometry(0.025, 0.025, 0.72, 6),
      chrome,
      x,
      FLOOR + 0.38,
      zf + 0.42,
    );
    add(
      g,
      new THREE.TorusGeometry(0.15, 0.01, 4, 10),
      chrome,
      x,
      FLOOR + 0.28,
      zf + 0.42,
    ).rotation.x = Math.PI / 2;
    add(
      g,
      facet(new THREE.CylinderGeometry(0.17, 0.2, 0.03, 8)),
      chrome,
      x,
      FLOOR + 0.015,
      zf + 0.42,
    );
    blob(g, x, zf + 0.42, 0.55);
  }
}

function buildBooths(room, scene) {
  const leather = lam(0x1d3d2a),
    frame = S.mahog;
  const globe = basic(0xfff0d0);
  for (const bx of [-2.4, 2.4]) {
    const g = new THREE.Group();
    g.position.set(bx, FLOOR, WZ - 0.85);
    room.add(g);
    for (const s of [-1, 1]) {
      add(g, new THREE.BoxGeometry(0.5, 0.46, 1.5), leather, s * 0.55, 0.23, 0);
      add(
        g,
        new THREE.BoxGeometry(0.14, 1.25, 1.5),
        leather,
        s * 0.86,
        0.62,
        0,
      );
      add(g, new THREE.BoxGeometry(0.06, 1.32, 1.56), frame, s * 0.95, 0.66, 0);
      for (let z = -0.55; z <= 0.55; z += 0.37)
        add(
          g,
          new THREE.BoxGeometry(0.02, 0.9, 0.012),
          lam(0x12281b),
          s * 0.78,
          0.72,
          z,
        ); // tufted pleats
    }
    const top = add(
      g,
      new THREE.CylinderGeometry(0.36, 0.36, 0.035, 8),
      basic(0xf3dfb0),
      0,
      0.74,
      0,
    );
    top.rotation.y = Math.PI / 8;
    add(
      g,
      new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6),
      lam(0x141414),
      0,
      0.37,
      0,
    );
    add(
      g,
      new THREE.CylinderGeometry(0.2, 0.22, 0.02, 8),
      lam(0x141414),
      0,
      0.01,
      0,
    );
    add(g, new THREE.SphereGeometry(0.14, 8, 6), globe, 0, 2.15, 0);
    add(
      g,
      new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4),
      S.brass,
      0,
      2.6,
      0,
    );
    const p = new THREE.PointLight(0xffd29a, 0.75, 3.6, 1.6);
    p.position.set(bx, FLOOR + 1.95, WZ - 0.85);
    scene.add(p);
    S.flares.push({
      pos: new THREE.Vector3(bx, FLOOR + 2.15, WZ - 0.85),
      k: 0.75,
      vis: () => true,
    });
    ashtray(g, 0.12, 0.76, 0.08, bx < 0);
  }
  // red lantern in the corner
  add(
    room,
    facet(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 8)),
    basic(0xff6a3a),
    -WX + 0.45,
    1.25,
    -WZ + 0.5,
  );
  const red = new THREE.PointLight(0xff3a20, 1.1, 5, 1.6);
  red.position.set(-WX + 0.7, 1.2, -WZ + 0.8);
  scene.add(red);
  S.flares.push({
    pos: new THREE.Vector3(-WX + 0.45, 1.25, -WZ + 0.5),
    k: 0.55,
    vis: () => true,
  });
}

function buildJukebox(room, scene) {
  const g = new THREE.Group();
  g.position.set(WX - 0.5, FLOOR, WZ - 0.55);
  g.rotation.y = -Math.PI * 0.75;
  room.add(g);
  const face = canvasTex(
    64,
    96,
    (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, 0);
      ["#ff9a2a", "#ffd25a", "#ff5a7a", "#7affc0", "#ff9a2a"].forEach(
        (col, i) => gr.addColorStop(i / 4, col),
      );
      c.fillStyle = "#1a0d08";
      c.fillRect(0, 0, w, h);
      c.fillStyle = gr;
      c.beginPath();
      c.arc(w / 2, 34, 30, Math.PI, 0);
      c.lineTo(w - 2, h - 2);
      c.lineTo(2, h - 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#2a1408";
      c.beginPath();
      c.arc(w / 2, 36, 22, Math.PI, 0);
      c.lineTo(w - 10, 60);
      c.lineTo(10, 60);
      c.closePath();
      c.fill();
      c.fillStyle = "#d8d0c0";
      for (let y = 64; y < 90; y += 4) c.fillRect(12, y, w - 24, 2);
    },
    { pixel: true },
  );
  add(g, new THREE.BoxGeometry(0.7, 1.3, 0.45), lam(0x3a1a0c), 0, 0.65, 0);
  add(
    g,
    new THREE.PlaneGeometry(0.66, 1.0),
    basic(0xffffff, { map: face }),
    0,
    0.82,
    0.226,
  );
  const p = new THREE.PointLight(0xff7a5a, 0.9, 3.4, 1.6);
  p.position.set(WX - 0.9, FLOOR + 1.0, WZ - 0.95);
  scene.add(p);
}

function blob(parent, x, z, size) {
  const m = add(
    parent,
    new THREE.PlaneGeometry(size, size),
    S.blobMat,
    x,
    0.003,
    z,
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
function ashtray(parent, x, y, z, lit) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  add(
    g,
    facet(new THREE.CylinderGeometry(0.05, 0.045, 0.02, 8)),
    lam(0x5a2a10, { emissive: 0x1a0802 }),
    0,
    0.01,
    0,
  );
  const cig = new THREE.Group();
  cig.position.set(0.03, 0.026, 0);
  cig.rotation.z = -0.12;
  g.add(cig);
  add(
    cig,
    new THREE.CylinderGeometry(0.008, 0.008, 0.11, 6),
    lam(0x6b4423),
    0.03,
    0,
    0,
  ).rotation.z = Math.PI / 2;
  add(
    cig,
    new THREE.CylinderGeometry(0.0085, 0.0085, 0.012, 6),
    lam(0xb8b0a0),
    0.09,
    0,
    0,
  ).rotation.z = Math.PI / 2;
  const tip = add(
    cig,
    new THREE.CylinderGeometry(0.0082, 0.0082, 0.004, 6),
    basic(0xff6a1a),
    0.097,
    0,
    0,
  );
  tip.rotation.z = Math.PI / 2;
  const t = { g, tip, lit: !!lit, litUntil: lit ? Infinity : 0, next: 0 };
  tip.visible = !!lit;
  (C.ashtrays || (C.ashtrays = [])).push(t);
  return t;
}

// ---------- people ----------
function faceTex(L) {
  return canvasTex(
    64,
    32,
    (c, w, h) => {
      c.fillStyle = L.skin;
      c.fillRect(0, 0, w, h);
      c.fillStyle = L.hair;
      c.fillRect(0, 0, w, 7);
      c.fillRect(32, 0, 32, 20);
      const fx = 16;
      c.fillStyle = "#1a120c";
      c.fillRect(fx - 5, 12, 3, 3);
      c.fillRect(fx + 2, 12, 3, 3);
      c.fillStyle = "rgba(0,0,0,.25)";
      c.fillRect(fx - 1, 15, 2, 3);
      c.fillStyle = L.lips ? "#b51f2a" : "#7a3a2a";
      c.fillRect(fx - 3, 20, 6, 1);
      if (L.stache) {
        c.fillStyle = L.hair;
        c.fillRect(fx - 4, 18, 8, 2);
      }
      if (L.beard) {
        c.fillStyle = L.hair;
        c.fillRect(fx - 7, 19, 14, 6);
        c.fillStyle = "#7a3a2a";
        c.fillRect(fx - 3, 20, 6, 1);
      }
      if (L.glasses) {
        c.strokeStyle = "#222";
        c.lineWidth = 1;
        c.strokeRect(fx - 6.5, 11.5, 5, 4);
        c.strokeRect(fx + 1.5, 11.5, 5, 4);
      }
      if (L.blush) {
        c.fillStyle = "rgba(215,60,55,.55)";
        c.fillRect(fx - 8, 16, 3, 2);
        c.fillRect(fx + 5, 16, 3, 2);
        c.fillRect(fx - 1, 15, 2, 2);
      }
    },
    { pixel: true },
  );
}
function hat(L, head) {
  const m = lam(L.hatColor || L.hair),
    y = 0.08;
  switch (L.hat) {
    case "cap":
      add(
        head,
        facet(
          new THREE.SphereGeometry(0.118, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        ),
        m,
        0,
        0.01,
        0,
      );
      add(head, new THREE.BoxGeometry(0.15, 0.012, 0.12), m, 0, 0.02, -0.14);
      break;
    case "flatcap":
      add(
        head,
        facet(
          new THREE.SphereGeometry(
            0.122,
            7,
            3,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2.6,
          ),
        ),
        m,
        0,
        0.03,
        0.01,
      ).scale.set(1, 0.6, 1.1);
      add(head, new THREE.BoxGeometry(0.15, 0.012, 0.07), m, 0, 0.045, 0.12);
      break;
    case "fedora":
      add(
        head,
        facet(new THREE.CylinderGeometry(0.09, 0.105, 0.11, 7)),
        m,
        0,
        y + 0.04,
        0,
      );
      add(
        head,
        facet(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 9)),
        m,
        0,
        y - 0.01,
        0,
      );
      add(
        head,
        new THREE.CylinderGeometry(0.106, 0.106, 0.025, 7),
        lam(0x5a1a1a),
        0,
        y + 0.0,
        0,
      );
      break;
    case "beret":
      add(
        head,
        facet(
          new THREE.SphereGeometry(
            0.13,
            7,
            3,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2.4,
          ),
        ),
        m,
        0.02,
        0.04,
        0,
      ).scale.set(1.1, 0.45, 1.1);
      break;
    case "perm":
      add(
        head,
        facet(new THREE.IcosahedronGeometry(0.135, 0)),
        m,
        0,
        0.05,
        -0.02,
      ).scale.set(1.05, 0.85, 1);
      break;
    case "bun":
      add(
        head,
        facet(
          new THREE.SphereGeometry(0.115, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        ),
        m,
        0,
        0.01,
        -0.005,
      );
      add(
        head,
        facet(new THREE.IcosahedronGeometry(0.055, 0)),
        m,
        0,
        0.1,
        -0.08,
      );
      break;
    case "cowboy": {
      add(
        head,
        facet(new THREE.CylinderGeometry(0.075, 0.1, 0.11, 7)),
        m,
        0,
        y + 0.05,
        0,
      ).scale.z = 0.85;
      add(
        head,
        new THREE.CylinderGeometry(0.101, 0.101, 0.022, 7),
        lam(0x3a2414),
        0,
        y + 0.005,
        0,
      ).scale.z = 0.86;
      const brim = add(
        head,
        facet(new THREE.CylinderGeometry(0.23, 0.21, 0.012, 10)),
        m,
        0,
        y - 0.012,
        0,
      );
      brim.scale.z = 0.85;
      for (const s of [-1, 1])
        add(
          head,
          new THREE.BoxGeometry(0.07, 0.012, 0.26),
          m,
          s * 0.2,
          y + 0.012,
          0,
        ).rotation.z = s * 0.6; // curled sides
      break;
    }
    case "beanie":
      add(
        head,
        facet(
          new THREE.SphereGeometry(0.122, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        ),
        m,
        0,
        0.02,
        0,
      ).scale.y = 1.25;
      add(
        head,
        new THREE.CylinderGeometry(0.124, 0.124, 0.04, 8),
        lam(new THREE.Color(L.hatColor || L.hair).multiplyScalar(1.35)),
        0,
        0.03,
        0,
      );
      break;
    case "pony": {
      add(
        head,
        facet(
          new THREE.SphereGeometry(0.116, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        ),
        lam(L.hair),
        0,
        0.012,
        -0.004,
      );
      const tail = add(
        head,
        facet(new THREE.CylinderGeometry(0.032, 0.012, 0.2, 5)),
        lam(L.hair),
        0,
        -0.04,
        -0.13,
      );
      tail.rotation.x = 0.45;
      break;
    }
  }
}
const CIGAR = () => {
  const g = new THREE.Group();
  add(
    g,
    new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6),
    lam(0x6b4423),
    0,
    0.06,
    0,
  );
  g.tip = add(
    g,
    new THREE.CylinderGeometry(0.0082, 0.0082, 0.006, 6),
    basic(0xff5a10),
    0,
    0.122,
    0,
  );
  return g;
};
const GLASS = () => {
  const g = new THREE.Group();
  add(
    g,
    facet(new THREE.CylinderGeometry(0.036, 0.031, 0.085, 7)),
    lam(0xf4fbff, {
      emissive: 0x202628,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
    0,
    0.0425,
    0,
  );
  add(
    g,
    new THREE.CylinderGeometry(0.031, 0.031, 0.006, 7),
    lam(0xf4fbff, { transparent: true, opacity: 0.6 }),
    0,
    0.003,
    0,
  );
  g.liquid = add(
    g,
    new THREE.CylinderGeometry(0.032, 0.029, 0.05, 7),
    basic(0xd9852a, { transparent: true, opacity: 0.9 }),
    0,
    0.027,
    0,
  );
  add(
    g,
    new THREE.BoxGeometry(0.025, 0.025, 0.025),
    lam(0xeef6ff, { transparent: true, opacity: 0.5 }),
    0.005,
    0.045,
    0,
  );
  return g;
};
export function figure(L, pose = "stand") {
  const g = new THREE.Group(),
    b = L.build || 1,
    shirt = lam(L.shirt),
    pants = lam(L.pants),
    skin = lam(L.skin);
  const sit = pose === "sit",
    hipY = sit ? 0.46 : 0.86,
    hips = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.1 * b, hipY, 0);
    g.add(hip);
    hips.push(hip);
    add(hip, new THREE.BoxGeometry(0.14 * b, 0.44, 0.16), pants, 0, -0.22, 0);
    if (sit) {
      hip.rotation.x = -Math.PI / 2;
      const knee = new THREE.Group();
      knee.position.set(0, -0.44, 0);
      hip.add(knee);
      knee.rotation.x = Math.PI / 2;
      add(
        knee,
        new THREE.BoxGeometry(0.13 * b, 0.44, 0.15),
        pants,
        0,
        -0.22,
        0,
      );
      add(
        knee,
        new THREE.BoxGeometry(0.13, 0.06, 0.24),
        lam(0x141010),
        0,
        -0.44,
        0.05,
      );
    } else {
      add(hip, new THREE.BoxGeometry(0.13 * b, 0.44, 0.15), pants, 0, -0.64, 0);
      add(
        hip,
        new THREE.BoxGeometry(0.13, 0.06, 0.25),
        lam(0x141010),
        0,
        -0.84,
        0.05,
      );
    }
  }
  const torso = new THREE.Group();
  torso.position.y = hipY;
  g.add(torso);
  add(
    torso,
    facet(
      new THREE.CylinderGeometry(
        0.21 * b,
        0.17 * b * (b > 1.1 ? 1.25 : 1),
        0.6,
        6,
      ),
    ),
    shirt,
    0,
    0.3,
    0,
  ).scale.z = 0.62;
  add(
    torso,
    new THREE.BoxGeometry(0.1, 0.18, 0.02),
    lam(L.trim),
    0,
    0.5,
    0.11 * b,
  );
  add(
    torso,
    new THREE.CylinderGeometry(0.05, 0.055, 0.08, 6),
    skin,
    0,
    0.63,
    0,
  );
  const head = new THREE.Group();
  head.position.y = 0.76;
  torso.add(head);
  const hm = add(
    head,
    facet(new THREE.SphereGeometry(0.11, 8, 6)),
    lam(0xffffff, { map: faceTex(L) }),
    0,
    0,
    0,
  );
  hm.scale.set(0.95, 1.08, 1);
  hat(L, head);
  const arm = (s) => {
    const sh = new THREE.Group();
    sh.position.set(s * 0.25 * b, 0.56, 0);
    torso.add(sh);
    add(sh, new THREE.BoxGeometry(0.1, 0.3, 0.11), shirt, 0, -0.15, 0);
    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);
    add(el, new THREE.BoxGeometry(0.09, 0.28, 0.1), shirt, 0, -0.14, 0);
    const hand = new THREE.Group();
    hand.position.y = -0.3;
    el.add(hand);
    add(hand, new THREE.BoxGeometry(0.08, 0.09, 0.07), skin, 0, -0.02, 0);
    sh.rotation.z = s * 0.08;
    return { sh, el, hand };
  };
  const A = {
    g,
    L,
    head,
    torso,
    hips,
    r: arm(-1),
    l: arm(1),
    anim: null,
    phase: Math.random() * 6,
    sit,
  };
  if (sit) {
    A.r.sh.rotation.x = -0.9;
    A.r.el.rotation.x = -0.6;
    A.l.sh.rotation.x = -0.9;
    A.l.el.rotation.x = -0.6;
  }
  blob(g, 0, 0.02, 0.7);
  A.hold = (kind) => {
    for (const k of ["cigar", "glass"]) if (A[k]) A[k].visible = k === kind;
    if (kind && !A[kind]) {
      A[kind] = kind === "cigar" ? CIGAR() : GLASS();
      A[kind].position.set(0, -0.06, 0.04);
      if (kind === "cigar") A[kind].rotation.x = Math.PI / 2;
      A.r.hand.add(A[kind]);
    }
  };
  return A;
}
function animateFigure(A, dt, now) {
  A.phase += dt;
  A.torso.scale.y = 1 + Math.sin(A.phase * 1.6) * 0.008;
  A.head.rotation.y = Math.sin(A.phase * 0.4) * 0.25;
  const base = A.sit ? [-0.9, -0.6] : [0, 0];
  let up = 0;
  if (A.anim) {
    const t = (now - A.anim.t0) / 1000;
    up = t < 0.5 ? ease(t / 0.5) : t < 1.6 ? 1 : ease((2.1 - t) / 0.5);
    if (A.anim.kind === "cigar" && A.cigar)
      A.cigar.tip.scale.setScalar(
        t > 0.5 && t < 1.6 ? 1.6 + Math.sin(t * 30) * 0.3 : 1,
      );
    if (A.anim.kind === "glass" && A.glass) A.glass.rotation.x = up * -0.6;
    if (t > 1.65 && !A.anim.puffed && A.anim.kind === "cigar") {
      A.anim.puffed = true;
      const p = A.head.getWorldPosition(new THREE.Vector3());
      const f = new THREE.Vector3(0, 0, 1).applyQuaternion(A.g.quaternion);
      puff(p.addScaledVector(f, 0.12), f, 22, 0.35);
    }
    if (t > 2.2) {
      A.anim = null;
      if (!A.keep) A.hold(null);
    }
  } else if (A.idleKind && Math.random() < dt * 0.06)
    A.anim = { kind: A.idleKind, t0: now };
  A.r.sh.rotation.x = base[0] + (-2.15 - base[0]) * up;
  A.r.el.rotation.x = base[1] + (-1.55 - base[1]) * up;
  A.r.sh.rotation.z = -0.08 - up * 0.35;
}

// The two players: a figure at each home end. In player view your own figure is behind the camera.
const DEFAULT_LOOKS = [
  {
    skin: "#e2ae8c",
    shirt: "#26262c",
    trim: "#c9a35b",
    pants: "#17171b",
    hair: "#2a1a12",
    hat: "none",
    build: 1,
  },
  {
    skin: "#d9a585",
    shirt: "#36533f",
    trim: "#e9dfc8",
    pants: "#221d19",
    hair: "#4a3020",
    hat: "flatcap",
    hatColor: "#4a3a2a",
    stache: true,
    build: 1.05,
  },
];
export function setPlayers(looks) {
  for (const c of COLORS) {
    if (C.figs[c]) {
      C.figs[c].g.parent.remove(C.figs[c].g);
      delete C.figs[c];
    }
  }
  C.looks = looks.map((l, i) => l || DEFAULT_LOOKS[i]);
}
function playerFig(c, colorOf) {
  const p = colorOf.indexOf(c),
    key = c + p;
  let F = C.figs[c];
  if (!F || F.key !== key) {
    if (F) F.g.parent.remove(F.g);
    F = C.figs[c] = figure(C.looks?.[p] || DEFAULT_LOOKS[p], "stand");
    F.key = key;
    S.scene.add(F.g);
    F.g.traverse((o) => {
      if (o.material) o.material = o.material.clone();
    }); // own materials, so this figure can fade on its own
    F.cue = S.cue.clone();
    F.cue.visible = true;
    F.cue.traverse((o) => {
      if (o.material) o.material = o.material.clone();
    });
    F.g.add(F.cue);
    const h = home(c);
    F.pos = new THREE.Vector3(h * 1.85, 0, -h * 1.0);
    F.yaw = Math.atan2(-F.pos.x, -F.pos.z);
    F.blend = 0;
    F.walk = 0;
    F.step = 0;
    F.op = 1;
    F.st = null;
  }
  return F;
}

// ---------- a player at the table: walk round to the ball, lean in, cue in hand ----------
// The figure stands behind the ball on the line of the shot, outside the rail, and leans over it.
// Arms are solved with two-bone IK: the left hand makes the bridge, the right hand holds the butt.
const RX = 1.31,
  RZ = 0.86,
  UP = new THREE.Vector3(0, 1, 0),
  DOWN = new THREE.Vector3(0, -1, 0);
const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
function exitBack(px, pz, ux, uz) {
  // distance behind the ball (along -u) until outside the walkway rectangle
  const tx =
    ux > 1e-6 ? (px + RX) / ux : ux < -1e-6 ? (px - RX) / ux : Infinity;
  const tz =
    uz > 1e-6 ? (pz + RZ) / uz : uz < -1e-6 ? (pz - RZ) / uz : Infinity;
  return Math.max(0, Math.min(tx, tz));
}
function pushOut(p) {
  if (Math.abs(p.x) >= RX || Math.abs(p.z) >= RZ) return p;
  if (RX - Math.abs(p.x) < RZ - Math.abs(p.z)) p.x = Math.sign(p.x || 1) * RX;
  else p.z = Math.sign(p.z || 1) * RZ;
  return p;
}
function crosses(a, b) {
  // does the walk from a to b go through the table? (Liang-Barsky)
  const rx = RX - 0.03,
    rz = RZ - 0.03,
    dx = b.x - a.x,
    dz = b.z - a.z;
  let t0 = 0,
    t1 = 1;
  for (const [p, q] of [
    [-dx, a.x + rx],
    [dx, rx - a.x],
    [-dz, a.z + rz],
    [dz, rz - a.z],
  ]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return t0 < t1;
}
function waypoint(cur, goal) {
  if (!crosses(cur, goal)) return goal;
  let best = goal,
    bd = Infinity;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const c = new THREE.Vector3(sx * (RX + 0.1), 0, sz * (RZ + 0.1));
      if (crosses(cur, c)) continue;
      const d = cur.distanceTo(c) + c.distanceTo(goal);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  return best;
}
// Where the cue sits for a shot: tip at the back of the ball, tilted up like the aiming cue in scene.js.
function cueLine(b, s) {
  const tip = new THREE.Vector3(
    (b.x - s.dx * R) * M,
    R * M,
    (b.y - s.dy * R) * M,
  );
  return { tip, axis: new THREE.Vector3(s.dx, -0.2, s.dy).normalize() };
}
function stance(b, s) {
  const bx = b.x * M,
    bz = b.y * M,
    back = Math.max(0.98, exitBack(bx, bz, s.dx, s.dy) + 0.03),
    yaw = Math.atan2(s.dx, s.dy);
  const pos = new THREE.Vector3(
    bx - s.dx * back + Math.cos(yaw) * 0.1,
    0,
    bz - s.dy * back - Math.sin(yaw) * 0.1,
  ); // a step to the left: cue under the chin
  return { pos: pushOut(pos), yaw, back };
}
const _a = new THREE.Vector3(),
  _b = new THREE.Vector3(),
  _q = new THREE.Quaternion(),
  _q2 = new THREE.Quaternion();
function reach(arm, target, pole, k) {
  // two-bone IK, blended in by k
  const sh = arm.sh.getWorldPosition(new THREE.Vector3()),
    n = target.clone().sub(sh),
    a = 0.3,
    b = 0.31;
  const d = clampv(n.length(), 0.08, (a + b) * 0.999);
  n.normalize();
  const ang = Math.acos(clampv((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const p = pole.clone().addScaledVector(n, -pole.dot(n)).normalize();
  const u = n
    .clone()
    .multiplyScalar(Math.cos(ang))
    .addScaledVector(p, Math.sin(ang));
  const elbow = sh.clone().addScaledVector(u, a),
    f = target.clone().sub(elbow).normalize();
  const parent = arm.sh.parent.getWorldQuaternion(_q2);
  const shL = parent.clone().invert().multiply(_q.setFromUnitVectors(DOWN, u));
  arm.sh.quaternion.slerp(shL, k);
  const shW = parent.clone().multiply(arm.sh.quaternion);
  arm.el.quaternion.slerp(
    shW.invert().multiply(_q.setFromUnitVectors(DOWN, f)),
    k,
  );
}
function placeCue(F, pos, quat) {
  // world pose to the figure's local space
  F.cue.position.copy(F.g.worldToLocal(pos.clone()));
  F.cue.quaternion.copy(F.g.quaternion).invert().multiply(quat);
}
function updatePlayer(F, c, aim, dt, now, ghost) {
  const live = aim && aim.b.c === c;
  if (live)
    F.st = {
      ...stance(aim.b, aim.s),
      b: { x: aim.b.x, y: aim.b.y },
      s: { ...aim.s },
      drawn: aim.drawn,
      live: true,
      t: now,
    };
  else if (F.st?.live) {
    F.st.live = false;
    F.st.t = now;
    F.st.drawn = false;
    F.st.s.p = -0.45;
  } // the shot went: hold the follow-through a moment
  const inSt = F.st && (F.st.live || now - F.st.t < 1300);
  const h = home(c),
    goal = inSt ? F.st.pos : new THREE.Vector3(h * 1.85, 0, -h * 1.0),
    goalYaw = inSt ? F.st.yaw : Math.atan2(-goal.x, -goal.z);
  // walk round the table
  const wp = waypoint(F.pos, goal),
    d = F.pos.distanceTo(wp),
    moving = d > 0.03;
  if (d > 1e-4)
    F.pos.addScaledVector(
      wp.clone().sub(F.pos).normalize(),
      Math.min(d, 2.4 * dt),
    );
  const near = F.pos.distanceTo(goal) < 0.05,
    wantYaw =
      moving && !near ? Math.atan2(wp.x - F.pos.x, wp.z - F.pos.z) : goalYaw;
  let dy = wantYaw - F.yaw;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  F.yaw += dy * Math.min(1, dt * 9);
  F.walk += ((moving ? 1 : 0) - F.walk) * Math.min(1, dt * 8);
  F.blend += ((inSt && near ? 1 : 0) - F.blend) * Math.min(1, dt * 6);
  F.atStance = inSt && F.st.live && F.blend > 0.85;
  F.g.position.set(F.pos.x, FLOOR, F.pos.z);
  F.g.rotation.y = F.yaw;
  // legs and pose
  F.step += dt * 9 * F.walk;
  F.hips[0].rotation.x = Math.sin(F.step) * 0.5 * F.walk;
  F.hips[1].rotation.x = -Math.sin(F.step) * 0.5 * F.walk;
  const k = F.blend,
    lean = inSt ? clampv(0.62 + (F.st.back - 0.98) * 0.5, 0.62, 1.0) : 0.62;
  F.torso.rotation.set(lean * k, -0.32 * k, 0);
  F.head.rotation.x = -0.75 * k;
  F.head.rotation.y *= 1 - k;
  F.l.sh.rotation.set(-0.35 + Math.sin(F.step) * 0.3 * F.walk, 0, 0.1);
  F.l.el.rotation.set(-0.55, 0, 0); // left hand carries the cue upright
  F.r.sh.rotation.y = 0;
  F.r.el.rotation.y = 0;
  F.r.el.rotation.z = 0; // clear what the IK left behind last frame
  F.g.updateMatrixWorld(true);
  if (k > 0.01) {
    const st = F.st,
      { tip, axis } = cueLine(st.b, st.s),
      pull = (12 + st.s.p * 110) * M * 1.02;
    const fwd = new THREE.Vector3(Math.sin(F.yaw), 0, Math.cos(F.yaw)),
      right = fwd.clone().cross(UP);
    const sb = clampv(st.back - 0.8, 0.22, 0.6),
      bridge = tip
        .clone()
        .addScaledVector(axis, -sb)
        .add(_a.set(0, -0.03, 0));
    const grip = tip.clone().addScaledVector(axis, -(pull + 1.12));
    reach(
      F.l,
      bridge,
      right
        .clone()
        .negate()
        .multiplyScalar(0.8)
        .addScaledVector(UP, 0.35)
        .addScaledVector(fwd, -0.2),
      k,
    );
    reach(
      F.r,
      grip,
      UP.clone()
        .multiplyScalar(0.7)
        .addScaledVector(fwd, -0.4)
        .addScaledVector(right, 0.45),
      k,
    );
    F.g.updateMatrixWorld(true);
  }
  // the cue: in the hands at the table (unless the aiming cue is already drawn there), upright in the left hand otherwise
  if (k > 0.5 && F.st) {
    F.cue.visible = !F.st.drawn;
    const { tip, axis } = cueLine(F.st.b, F.st.s),
      pull = (12 + F.st.s.p * 110) * M * 1.02;
    placeCue(
      F,
      tip.addScaledVector(axis, -pull),
      _q.setFromUnitVectors(UP, axis),
    );
  } else {
    F.cue.visible = true;
    const hand = F.l.hand.getWorldPosition(new THREE.Vector3());
    placeCue(F, hand.add(_b.set(0, 0.66, 0)), _q.identity());
  }
  // in player view your own figure fades when it stands between you and the table
  const camX = home(c) * 2.24,
    want = ghost && Math.hypot(F.pos.x - camX, F.pos.z) < 1.35 ? 0.22 : 1;
  if (Math.abs(want - F.op) > 0.005) {
    F.op += (want - F.op) * Math.min(1, dt * 8);
    if (Math.abs(want - F.op) < 0.01) F.op = want;
    F.g.traverse((o) => {
      const m = o.material;
      if (!m) return;
      const u = m.userData;
      if (u.op === undefined) {
        u.op = m.opacity;
        u.tr = m.transparent;
        u.dw = m.depthWrite;
      }
      m.opacity = F.op * u.op;
      m.transparent = u.tr || F.op < 0.99;
      m.depthWrite = F.op < 0.99 ? false : u.dw;
    });
  }
}

// ---------- smoke ----------
const MAXP = 320;
function buildSmoke(scene) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(MAXP * 3),
    size = new Float32Array(MAXP),
    alpha = new Float32Array(MAXP);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  const tex = canvasTex(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: tex },
      scale: { value: 400 },
      color: { value: new THREE.Color(0xcfc6b8) },
    },
    vertexShader:
      "attribute float aSize; attribute float aAlpha; varying float vA; uniform float scale; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = min(aSize * scale / -mv.z, 256.); gl_Position = projectionMatrix * mv; }",
    fragmentShader:
      "uniform sampler2D map; uniform vec3 color; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < .01) discard; gl_FragColor = vec4(color, a); }",
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  C.smoke = { geo, mat, pos, size, alpha, p: [], ambient: 0 };
}
function emit(x, y, z, vx, vy, vz, life, s0, s1, a) {
  const P = C.smoke.p;
  if (P.length >= MAXP) P.shift();
  P.push({ x, y, z, vx, vy, vz, age: 0, life, s0, s1, a });
}
export function puff(at, dir, n = 18, spread = 0.3, k = 1) {
  for (let i = 0; i < n; i++)
    emit(
      at.x,
      at.y,
      at.z,
      dir.x * rnd(0.15, 0.45) + rnd(-spread, spread) * 0.3,
      dir.y * 0.3 + rnd(0.02, 0.18),
      dir.z * rnd(0.15, 0.45) + rnd(-spread, spread) * 0.3,
      rnd(2.2, 3.6),
      0.04,
      rnd(0.35, 0.6) * k,
      rnd(0.25, 0.4) * k,
    );
}
function stepSmoke(dt) {
  const sm = C.smoke,
    P = sm.p;
  sm.ambient -= dt;
  if (sm.ambient < 0) {
    sm.ambient = 0.35;
    const x = rnd(-0.9, 0.9);
    emit(
      x,
      rnd(0.3, 0.7),
      rnd(-0.4, 0.4),
      rnd(-0.02, 0.02),
      0.01,
      rnd(-0.02, 0.02),
      9,
      0.5,
      1.1,
      0.06,
    );
  }
  for (const t of C.ashtrays) {
    if (!t.lit || performance.now() > t.litUntil) {
      t.lit = false;
      t.tip.visible = false;
      continue;
    }
    t.next -= dt;
    if (t.next < 0) {
      t.next = 0.09;
      const p = t.tip.getWorldPosition(new THREE.Vector3());
      emit(
        p.x,
        p.y + 0.01,
        p.z,
        rnd(-0.01, 0.01),
        rnd(0.06, 0.1),
        rnd(-0.01, 0.01),
        3.2,
        0.012,
        0.16,
        0.22,
      );
    }
  }
  for (const F of C.patrons || [])
    if (F.cigar && F.cigar.visible && Math.random() < dt * 8) {
      const p = F.cigar.tip.getWorldPosition(new THREE.Vector3());
      emit(
        p.x,
        p.y,
        p.z,
        rnd(-0.01, 0.01),
        0.08,
        rnd(-0.01, 0.01),
        3,
        0.012,
        0.15,
        0.2,
      );
    }
  let n = 0;
  for (let i = P.length - 1; i >= 0; i--) {
    const q = P[i];
    q.age += dt;
    if (q.age > q.life) {
      P.splice(i, 1);
      continue;
    }
    q.vx *= 1 - dt * 0.9;
    q.vz *= 1 - dt * 0.9;
    q.vy = q.vy * (1 - dt * 0.5) + dt * 0.02;
    q.x += (q.vx + Math.sin(q.age * 1.7 + i) * 0.015) * dt;
    q.y += q.vy * dt;
    q.z += q.vz * dt;
  }
  for (const q of P) {
    const k = q.age / q.life;
    sm.pos[n * 3] = q.x;
    sm.pos[n * 3 + 1] = q.y;
    sm.pos[n * 3 + 2] = q.z;
    sm.size[n] = q.s0 + (q.s1 - q.s0) * Math.sqrt(k);
    sm.alpha[n] = q.a * Math.min(1, k * 8) * (1 - k);
    n++;
  }
  for (let i = n; i < MAXP; i++) sm.alpha[i] = 0;
  sm.geo.attributes.position.needsUpdate =
    sm.geo.attributes.aSize.needsUpdate =
    sm.geo.attributes.aAlpha.needsUpdate =
      true;
  sm.geo.setDrawRange(0, n);
  sm.mat.uniforms.scale.value =
    S.bh / (2 * Math.tan((S.camera.fov * Math.PI) / 360));
}

// ---------- each player's cigar and whisky on their end of the rail ----------
function buildProps(scene) {
  for (const c of COLORS) {
    const h = home(c),
      side = h < 0 ? 1 : -1;
    const tray = ashtray(scene, h * 0.99, 0.058, -side * 0.47, false);
    tray.g.rotation.y = h < 0 ? Math.PI : 0;
    const glass = GLASS();
    glass.position.set(h * 0.99, 0.058, side * 0.47);
    scene.add(glass);
    C.props[c] = { tray, glass, level: 1, refillAt: 0 };
  }
}
function setLevel(P) {
  P.glass.liquid.scale.y = Math.max(0.02, P.level);
  P.glass.liquid.position.y = 0.002 + 0.025 * Math.max(0.02, P.level);
  P.glass.liquid.visible = P.level > 0.01;
}

// ---------- first-person hand: your cigar and glass ----------
function buildViewmodel(scene) {
  scene.add(S.camera);
  const vm = new THREE.Group();
  S.camera.add(vm);
  vm.visible = false;
  const sleeve = add(
    vm,
    new THREE.BoxGeometry(0.085, 0.085, 0.36),
    lam(0x2a2a31),
    0.035,
    -0.06,
    0.2,
  );
  sleeve.rotation.x = 0.35;
  add(
    vm,
    new THREE.BoxGeometry(0.092, 0.092, 0.03),
    lam(0xece6d8),
    0.022,
    -0.022,
    0.05,
  ).rotation.x = 0.35; // shirt cuff
  add(
    vm,
    facet(new THREE.BoxGeometry(0.075, 0.065, 0.085)),
    lam(0xe2ae8c),
    0,
    0,
    0,
  ); // fist
  add(
    vm,
    new THREE.BoxGeometry(0.03, 0.028, 0.05),
    lam(0xd39a78),
    -0.045,
    0.012,
    -0.012,
  ); // thumb
  const cigar = CIGAR();
  cigar.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.75, 0.4, -0.5).normalize(),
  );
  cigar.position.set(-0.03, 0.02, -0.035);
  cigar.scale.setScalar(0.85);
  vm.add(cigar);
  const glass = GLASS();
  glass.scale.setScalar(1.15);
  glass.position.set(-0.07, -0.045, -0.01);
  vm.add(glass);
  C.vm = { g: vm, cigar, glass, anim: null };
}
const VM_REST = new THREE.Vector3(0.36, -0.42, -0.5),
  VM_UP = new THREE.Vector3(0.15, -0.075, -0.42); // raised: right of the dock, above the spin pad
function animateViewmodel(now) {
  const V = C.vm,
    a = V.anim;
  if (!a) {
    V.g.visible = false;
    return;
  }
  const t = (now - a.t0) / 1000,
    dur = 2.7;
  if (t > dur) {
    V.anim = null;
    V.g.visible = false;
    return;
  }
  V.g.visible = true;
  V.cigar.visible = a.kind === "cigar";
  V.glass.visible = a.kind === "glass";
  const up = t < 0.55 ? ease(t / 0.55) : t < 1.8 ? 1 : ease((dur - t) / 0.9),
    sip = ease((t - 0.6) / 0.4) * ease((1.75 - t) / 0.35);
  V.g.position.lerpVectors(VM_REST, VM_UP, up);
  V.g.rotation.set(
    a.kind === "glass" ? 0.1 + 0.9 * sip : 0.12 * up,
    -0.3 * up,
    a.kind === "glass" ? 0.1 : -0.15,
  );
  if (a.kind === "cigar") {
    V.cigar.tip.scale.setScalar(
      t > 0.6 && t < 1.7 ? 1.8 + Math.sin(t * 28) * 0.4 : 1,
    );
    if (t > 1.8 && !a.puffed) {
      a.puffed = true;
      const cam = S.camera,
        f = new THREE.Vector3(0.05, -0.1, -1).applyQuaternion(cam.quaternion);
      puff(cam.position.clone().addScaledVector(f, 0.55), f, 14, 0.4, 0.55);
    }
  } else {
    const lv = Math.max(0.05, a.from - (a.from - a.to) * ease((t - 0.7) / 0.9));
    V.glass.liquid.scale.y = lv;
    V.glass.liquid.position.y = 0.002 + 0.025 * lv;
  }
}

// kind: 'cigar' | 'glass'. firstPerson: animate your hand instead of your figure.
export function emote(c, kind, firstPerson, now = performance.now()) {
  const P = C.props[c];
  if (kind === "glass" && P.level <= 0.01) return "empty";
  if (firstPerson) {
    if (C.vm.anim) return "busy";
    C.vm.anim = {
      kind,
      t0: now,
      from: P.level,
      to: Math.max(0, P.level - 0.25),
    };
  } else {
    const F = C.figs[c];
    if (!F || F.anim) return "busy";
    F.hold(kind);
    F.anim = { kind, t0: now };
    if (kind === "glass") {
      F.glass.liquid.scale.y = Math.max(0.05, P.level);
      F.glass.liquid.position.y = 0.002 + 0.025 * F.glass.liquid.scale.y;
    }
  }
  if (kind === "cigar") {
    P.tray.lit = true;
    P.tray.litUntil = now + 90000;
    P.tray.tip.visible = true;
  } else {
    P.level = Math.max(0, P.level - 0.25);
    setTimeout(() => setLevel(P), 1600);
    if (P.level <= 0.01) P.refillAt = now + 6000;
  }
  return "ok";
}

// ---------- live boards on the walls ----------
const CHALK = '"Permanent Marker", "Comic Sans MS", cursive',
  POSTER = "Anton, Impact, sans-serif",
  LABEL = '"Chakra Petch", sans-serif';
function board(room, w, h, x, y, z, ry, pxw, draw, o = {}) {
  const cv = document.createElement("canvas");
  cv.width = pxw;
  cv.height = Math.round((pxw * h) / w);
  const tex = new THREE.CanvasTexture(cv);
  const m = add(
    room,
    new THREE.PlaneGeometry(w, h),
    basic(o.lit ? 0xffffff : 0xd9ccb6, { map: tex }),
    x,
    y,
    z,
  );
  m.rotation.y = ry; // unlit, like a PS2 billboard
  if (o.frame) {
    const f = add(
      room,
      new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03),
      lam(o.frame),
      x,
      y,
      z,
    );
    f.rotation.y = ry;
    f.translateZ(-0.035);
  }
  const B = { cv, tex, draw, key: null };
  C.boards.push(B);
  return B;
}
function buildBoards(room) {
  for (const s of [1, -1]) {
    const x = s * (WX - 0.03),
      ry = (-s * Math.PI) / 2,
      z = (v) => s * v; // z(v): positive v is to the right as you face this wall
    board(room, 1.7, 1.05, x, 0.42, z(0), ry, 640, drawScore, {
      frame: 0x3a1a0c,
    }); // hung low enough to show under the HUD in player view
    board(room, 0.72, 0.98, x, 0.42, z(-1.45), ry, 288, drawFoulBook, {
      frame: 0x2a140a,
    });
    board(room, 0.72, 0.98, x, 0.42, z(1.45), ry, 288, drawRules, {
      frame: 0x2a140a,
    });
    board(
      room,
      0.75,
      1.05,
      x,
      0.75,
      z(s > 0 ? 2.75 : -2.75),
      ry,
      240,
      s > 0 ? drawArtPoster : drawWhisky,
      { frame: 0x111111 },
    );
    board(
      room,
      0.75,
      1.05,
      x,
      0.75,
      z(s > 0 ? -2.75 : 2.75),
      ry,
      240,
      s > 0 ? drawCigarAd : drawArtPoster,
      { frame: 0x111111 },
    );
  }
  board(room, 2.6, 0.42, 0, 2.1, -WZ + 0.04, 0, 640, drawMarquee, {
    lit: true,
  });
  board(room, 0.62, 0.82, 0, 1.0, WZ - 0.03, Math.PI, 192, drawRegular, {
    frame: 0xc9a35b,
  });
  board(room, 0.5, 0.5, 1.0, 1.2, WZ - 0.03, Math.PI, 160, drawClock, {
    frame: 0x2a140a,
  });
  board(room, 0.7, 0.98, -4.0, 0.8, WZ - 0.03, Math.PI, 240, drawCigarAd, {
    frame: 0x111111,
  });
}

export function updateBoards(ctx) {
  for (const B of C.boards) {
    const key = B.draw(null, ctx);
    if (key === B.key) continue;
    B.key = key;
    const c = B.cv.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, B.cv.width, B.cv.height);
    B.draw(c, ctx);
    B.tex.needsUpdate = true;
  }
}
export function fontsChanged() {
  for (const B of C.boards) B.key = null;
}

const lastFoul = (G) => [...G.log].reverse().find((e) => e.kind === "fout");
function chalkBg(c, w, h) {
  c.fillStyle = "#1e2723";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(230,235,225,${rnd(0.01, 0.04)})`;
    c.beginPath();
    c.ellipse(rnd(0, w), rnd(0, h), rnd(10, 60), rnd(4, 16), rnd(0, 3), 0, 7);
    c.fill();
  }
}
function fit(c, text, font, size, maxW) {
  let s = size;
  c.font = font(s);
  while (c.measureText(text).width > maxW && s > 10) {
    s -= 2;
    c.font = font(s);
  }
  return s;
}
function drawScore(c, { G, turnName }) {
  if (!c)
    return G
      ? JSON.stringify([
          G.names,
          G.colorOf,
          G.wins,
          G.manche,
          G.balls.map((b) => b.on),
          G.turn,
          G.phase,
          turnName,
        ])
      : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  chalkBg(c, w, h);
  c.fillStyle = "rgba(244,240,228,.92)";
  c.strokeStyle = "rgba(244,240,228,.8)";
  c.textBaseline = "alphabetic";
  if (!G) return;
  c.font = `46px ${CHALK}`;
  c.textAlign = "center";
  c.fillText(`TONIGHT · GAME ${G.manche}`, w / 2, 62);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(60, 80);
  c.lineTo(w - 60, 84);
  c.stroke();
  [0, 1].forEach((p) => {
    const col = G.colorOf[p],
      y = 160 + p * 130,
      inn = G.balls.filter((b) => b.c === col && !b.on).length;
    c.textAlign = "left";
    fit(c, G.names[p].toUpperCase(), (s) => `${s}px ${CHALK}`, 48, 300);
    c.fillStyle = col === "W" ? "#f4f0e4" : "#ff8c7a";
    c.fillText(G.names[p].toUpperCase(), 40, y);
    c.fillStyle = "rgba(244,240,228,.92)";
    for (let i = 0; i < 5; i++) {
      const x = 360 + i * 48;
      c.strokeRect(x, y - 38, 36, 36);
      if (i < inn) {
        c.beginPath();
        c.moveTo(x + 4, y - 18);
        c.lineTo(x + 15, y - 6);
        c.lineTo(x + 34, y - 44);
        c.stroke();
      }
    }
    c.font = `30px ${CHALK}`;
    c.fillText("★".repeat(G.wins[p]) || "-", 40, y + 40);
    if (G.turn === col && !/End/.test(G.phase)) {
      c.textAlign = "right";
      c.font = `30px ${CHALK}`;
      c.fillStyle = "#ffd46a";
      c.fillText("← ON THE CUE", w - 30, y + 40);
    }
  });
  c.textAlign = "center";
  c.font = `26px ${CHALK}`;
  c.fillStyle = "rgba(244,240,228,.7)";
  c.fillText("best of three · first to sink five", w / 2, h - 24);
}
function drawFoulBook(c, { G }) {
  const lf = G && lastFoul(G);
  if (!c)
    return G
      ? JSON.stringify([
          G.names,
          G.colorOf,
          G.log.filter((e) => e.kind === "fout").length,
          lf?.n,
        ])
      : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#e9dcb8";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(70,110,170,.35)";
  c.lineWidth = 1;
  for (let y = 74; y < h; y += 26) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.strokeStyle = "rgba(200,40,40,.6)";
  c.beginPath();
  c.moveTo(34, 0);
  c.lineTo(34, h);
  c.stroke();
  c.fillStyle = "#1d140c";
  c.font = `46px ${POSTER}`;
  c.textAlign = "center";
  c.fillText("FOUL BOOK", w / 2, 56);
  if (!G) return;
  [0, 1].forEach((p) => {
    const col = G.colorOf[p],
      f = G.log.filter((e) => e.kind === "fout" && e.c === col).length,
      y = 120 + p * 92;
    c.textAlign = "left";
    c.fillStyle = "#1d140c";
    fit(c, G.names[p], (s) => `${s}px ${CHALK}`, 30, w - 60);
    c.fillText(G.names[p], 44, y);
    c.strokeStyle = "#a3261d";
    c.lineWidth = 4;
    for (let i = 0; i < f; i++) {
      const gx = 48 + Math.floor(i / 5) * 62,
        k = i % 5;
      c.beginPath();
      if (k < 4) {
        c.moveTo(gx + k * 11, y + 14);
        c.lineTo(gx + k * 11 + 2, y + 50);
      } else {
        c.moveTo(gx - 6, y + 44);
        c.lineTo(gx + 44, y + 18);
      }
      c.stroke();
    }
    if (!f) {
      c.fillStyle = "#5a7a3a";
      c.font = `24px ${CHALK}`;
      c.fillText("clean", 48, y + 42);
    }
  });
  if (lf) {
    c.fillStyle = "#a3261d";
    c.font = `21px ${CHALK}`;
    c.textAlign = "left";
    const t = lf.text.replace(/^Foul: /, "");
    wrap(c, "Last: " + t, 44, h - 82, w - 60, 26);
  }
}
function wrap(c, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  for (const wd of words) {
    const t = line ? line + " " + wd : wd;
    if (c.measureText(t).width > maxW && line) {
      c.fillText(line, x, y);
      y += lh;
      line = wd;
    } else line = t;
  }
  c.fillText(line, x, y);
}
const RULES = [
  ["open", "Open off your left cushion"],
  ["own", "Never your own ball first"],
  ["hard", "No hard shots from the corners"],
  ["fly", "No flyers along the cushion"],
  ["tri", "No parking in the big triangle"],
  ["wrong", "Wrong goal never counts"],
  ["time", "One minute per shot"],
  ["", "The landlady is always right"],
];
function drawRules(c, { G }) {
  const lf = G?.lastShot?.foul?.key || "";
  if (!c) return "r" + lf;
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#efe4c8";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#23402f";
  c.fillRect(10, 10, w - 20, 70);
  c.fillStyle = "#efe4c8";
  c.font = `44px ${POSTER}`;
  c.textAlign = "center";
  c.fillText("HOUSE RULES", w / 2, 62);
  c.textAlign = "left";
  RULES.forEach(([k, t], i) => {
    const y = 110 + i * 34;
    c.fillStyle = "#c8452c";
    c.font = `26px ${POSTER}`;
    c.fillText(String(i + 1), 18, y);
    c.fillStyle = "#1d140c";
    fit(c, t, (s) => `600 ${s}px ${LABEL}`, 19, w - 60);
    c.fillText(t, 44, y);
    if (k && k === lf) {
      c.strokeStyle = "#d0201a";
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(w / 2 + 8, y - 8, w / 2 - 8, 22, -0.03, 0, 7);
      c.stroke();
      c.fillStyle = "#d0201a";
      c.font = `30px ${CHALK}`;
      c.fillText("!!", w - 34, y - 14);
    }
  });
}
function drawMarquee(c, { G }) {
  if (!c) return G ? G.names.join("|") + G.manche : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#0a0605";
  c.fillRect(0, 0, w, h);
  const neon = (t, y, size, col) => {
    c.font = `${size}px ${POSTER}`;
    c.textAlign = "center";
    c.shadowColor = col;
    c.shadowBlur = 18;
    c.fillStyle = col;
    c.fillText(t, w / 2, y);
    c.shadowBlur = 0;
    c.fillStyle = "#fff4e0";
    c.globalAlpha = 0.55;
    c.fillText(t, w / 2, y);
    c.globalAlpha = 1;
  };
  neon("THE GOLDEN CUE", 40, 34, "#ff9a3a");
  if (G) {
    const t = `${G.names[0]}  vs  ${G.names[1]}`.toUpperCase();
    fit(c, t, (s) => `${s}px ${POSTER}`, 44, w - 40);
    neon(t, 92, parseInt(c.font), "#ff4a6a");
  }
}
function drawRegular(c, { opp }) {
  if (!c) return opp ? opp.id : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#1a120c";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#c9a35b";
  c.font = `17px ${POSTER}`;
  c.textAlign = "center";
  c.fillText("REGULAR OF THE MONTH", w / 2, 24);
  if (opp) {
    const p = document.createElement("canvas");
    p.width = p.height = 64;
    paintPortrait(p, opp);
    c.imageSmoothingEnabled = false;
    c.drawImage(p, 16, 34, w - 32, w - 32);
    c.fillStyle = "#efe4c8";
    fit(c, opp.name.toUpperCase(), (s) => `${s}px ${POSTER}`, 26, w - 16);
    c.fillText(opp.name.toUpperCase(), w / 2, h - 18);
  }
}
function drawClock(c) {
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
  const hand = (a, len, wd) => {
    c.save();
    c.rotate(a);
    c.fillRect(-wd / 2, -len, wd, len + 8);
    c.restore();
  };
  hand((((d.getHours() % 12) + d.getMinutes() / 60) * Math.PI) / 6, r * 0.5, 7);
  hand((d.getMinutes() * Math.PI) / 30, r * 0.78, 4);
  c.restore();
}
function drawArtPoster(c) {
  if (!c) return "art";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#e6d8b8";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#23402f";
  c.fillRect(12, 12, w - 24, h - 24);
  c.fillStyle = "#e6d8b8";
  c.beginPath();
  c.arc(w * 0.62, h * 0.47, w * 0.27, 0, 7);
  c.fill();
  c.fillStyle = "#c8452c";
  c.beginPath();
  c.arc(w * 0.36, h * 0.6, w * 0.2, 0, 7);
  c.fill();
  c.fillStyle = "#141010";
  for (const [x, y] of [
    [0.22, 0.78],
    [0.5, 0.82],
    [0.78, 0.78],
  ]) {
    c.fillRect(w * x - 5, h * y - 30, 10, 30);
    c.fillStyle = "#b3392c";
    c.fillRect(w * x - 8, h * y - 26, 16, 6);
    c.fillStyle = "#141010";
  }
  c.fillStyle = "#e6d8b8";
  c.font = `40px ${POSTER}`;
  c.textAlign = "left";
  c.fillText("GOLF", 26, 60);
  c.fillText("BILJART", 26, 100);
  c.fillStyle = "#c8452c";
  c.font = `600 13px ${LABEL}`;
  c.fillText("TAP BILLIARDS · SINCE 1932", 28, 122);
  c.strokeStyle = "#c8452c";
  c.lineWidth = 2;
  c.strokeRect(26, h - 58, 92, 32);
  c.font = `20px ${POSTER}`;
  c.fillText("5 V 5", 46, h - 34);
}
function drawWhisky(c) {
  if (!c) return "whisky";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#1c0f08";
  c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.6);
  g.addColorStop(0, "rgba(240,160,50,.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#d8a04a";
  c.fillRect(w * 0.38, h * 0.32, w * 0.24, h * 0.36);
  c.fillRect(w * 0.45, h * 0.2, w * 0.1, h * 0.13);
  c.fillStyle = "#f2e6c8";
  c.fillRect(w * 0.4, h * 0.44, w * 0.2, h * 0.12);
  c.fillStyle = "#f2c86a";
  c.font = `34px ${POSTER}`;
  c.textAlign = "center";
  c.fillText("HIGHLAND", w / 2, 52);
  c.fillText("GOLD", w / 2, 88);
  c.fillStyle = "#e6d8b8";
  c.font = `600 13px ${LABEL}`;
  c.fillText("SINGLE MALT · AGED 12 YEARS", w / 2, h - 46);
  c.fillText("as smooth as a soft shot", w / 2, h - 26);
}
function drawCigarAd(c) {
  if (!c) return "cigar";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#8a1f1a";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "#f2c86a";
  c.lineWidth = 4;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = "#5a3218";
  c.save();
  c.translate(w / 2, h * 0.55);
  c.rotate(-0.3);
  c.fillRect(-w * 0.36, -12, w * 0.72, 24);
  c.fillStyle = "#f2c86a";
  c.fillRect(-w * 0.1, -13, 26, 26);
  c.fillStyle = "#ff6a1a";
  c.fillRect(w * 0.36 - 4, -12, 6, 24);
  c.restore();
  c.fillStyle = "rgba(240,230,220,.4)";
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.arc(w * 0.82 + Math.sin(i) * 10, h * 0.42 - i * 22, 10 + i * 3, 0, 7);
    c.fill();
  }
  c.fillStyle = "#f2c86a";
  c.font = `42px ${POSTER}`;
  c.textAlign = "center";
  c.fillText("EL TORO", w / 2, 70);
  c.fillStyle = "#f6ead0";
  c.font = `600 14px ${LABEL}`;
  c.fillText("HAND ROLLED CIGARS", w / 2, 96);
  c.fillText("FOR THE LONG GAME", w / 2, h - 30);
}

// ---------- per frame ----------
export function updateCafe(dt, now, ctx) {
  const { G, vc, aim } = ctx;
  C.lamps.visible = C.overhead.visible = !(
    camS.mode === "top" ||
    (camS.mode === "free" && camS.el > 1.05) ||
    (camS.mode === "replay" && camS.replay?.high)
  );
  if (G)
    for (const c of COLORS) {
      const F = playerFig(c, G.colorOf);
      animateFigure(F, dt, now);
      updatePlayer(F, c, aim, dt, now, camS.mode === "player" && c === vc);
      const P = C.props[c];
      if (P.refillAt && now > P.refillAt) {
        P.refillAt = 0;
        P.level = 1;
        setLevel(P);
        C.say(
          "Marcel",
          `Another one for ${G.names[G.colorOf.indexOf(c)]}, on the house.`,
        );
      }
    }
  for (const F of C.patrons) {
    if (!F.idleKind) F.idleKind = F.cigar?.visible ? "cigar" : "glass";
    F.keep = true;
    animateFigure(F, dt, now);
  }
  C.bartender.phase += dt;
  C.bartender.r.sh.rotation.x = -1.1 + Math.sin(C.bartender.phase * 2.2) * 0.25;
  C.bartender.r.el.rotation.x = -1.2;
  C.bartender.head.rotation.y = Math.sin(C.bartender.phase * 0.3) * 0.6;
  animateViewmodel(now);
  stepSmoke(dt);
}
export function headScreen(c) {
  const F = C.figs[c];
  if (!F || !F.g.visible) return null;
  return toScreen(
    F.head
      .getWorldPosition(new THREE.Vector3())
      .add(new THREE.Vector3(0, 0.26, 0)),
  );
}
