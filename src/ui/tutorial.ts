// How to play: one idea per slide, drawn with the same code as the cloth.
import { START } from "../core/table";
import { drawTable, type ClothOpts } from "../render/cloth";
import { $ } from "./dom";
import { views, showView } from "./menu";

interface Slide extends ClothOpts {
  t: string;
  x: string;
  why?: string;
}
const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const SLIDES: Slide[] = [
  {
    t: "Five balls, one goal",
    x: "Each player has five balls, white or red. Sink all five into the goal at the far end before your opponent does. Your goal has a ring in your colour.",
    zone: "goals",
    balls: [
      ...START.map((p) => ({ c: "W" as const, x: -p.x, y: p.y })),
      ...START.map((p) => ({ c: "R" as const, x: p.x, y: p.y })),
    ],
  },
  {
    t: "Taking a shot",
    x: "Press one of your own balls, pull back and let go. The further you pull on screen, the harder. The meter on the right has four equal bands: touch, soft, medium and hard, and the aim line takes the colour of the band you are in.",
    why: "Hard means faster than 1.5 m/s: enough to run more than three table lengths. That is the top quarter of the meter, in red.",
    balls: [{ c: "W", x: -250, y: 150 }],
    arrows: [
      {
        pts: [
          [-250, 150],
          [860, 0],
        ],
      },
    ],
  },
  {
    t: "Look around",
    x: touch
      ? "Drag a finger over the cloth to turn the table. Pinch to zoom, slide two fingers to move along the table, and once you have turned it, tap a spot to look at it. The eye and top buttons put the camera back."
      : "Right-drag turns the table round the point you look at. Right-click a ball to look at it, so a ball against the cushion is easy to check. Scroll zooms towards the pointer. Shift and right-drag slides along the table. T is the top view, P puts you back behind your end.",
    why: "No mouse? B picks one of your balls, A and D turn the aim, W and S set the power and Space shoots.",
  },
  {
    t: "Put some spin on it",
    x: "The cue ball in the corner shows where your tip hits. Low makes your ball come back after it hits another ball, high makes it run on, left or right bends the bounce off a cushion.",
    why: "A ball hit dead centre slides first, then starts rolling. Spin changes what it does after the first contact.",
    balls: [
      { c: "W", x: -560, y: -200 },
      { c: "R", x: -120, y: -200 },
    ],
    arrows: [
      {
        pts: [
          [-560, -200],
          [-185, -200],
        ],
      },
      {
        pts: [
          [-185, -200],
          [260, -200],
        ],
        alt: true,
      },
      {
        pts: [
          [-185, -175],
          [-520, -60],
        ],
        alt: true,
      },
    ],
  },
  {
    t: "The opening shot",
    x: "Both players play their middle ball, the one where the shooting lines cross, at the same time, softly off their own left cushion. Whoever stops closest to their goal takes the first turn.",
    balls: [
      { c: "W", x: -720, y: 0 },
      { c: "R", x: 720, y: 0 },
    ],
    arrows: [
      {
        pts: [
          [-690, -15],
          [-120, -415],
          [620, -60],
        ],
      },
      {
        pts: [
          [690, 15],
          [120, 415],
          [-620, 60],
        ],
      },
    ],
  },
  {
    t: "Keep shooting",
    x: "Score and you shoot again. No goal and the turn passes. Knock an opponent's ball into a goal and it counts for them.",
    why: "Put your own ball into the goal behind you and it goes to a penalty spot.",
    balls: [
      { c: "W", x: 640, y: 20 },
      { c: "R", x: 300, y: -200 },
    ],
    arrows: [
      {
        pts: [
          [640, 20],
          [866, 0],
        ],
      },
    ],
  },
  {
    t: "The lip behind the goal",
    x: "A curved lip behind each hole catches hard balls, so a firm shot straight at the goal drops in. A ball that crosses the hole sideways too fast skims over it and carries on.",
    zone: "goals",
    balls: [{ c: "W", x: 520, y: -40 }],
    arrows: [
      {
        pts: [
          [520, -40],
          [860, 0],
        ],
      },
    ],
  },
  {
    t: "Foul: your own ball first",
    x: "You may never hit one of your own balls directly.",
    why: "Bounce off a cushion, a post or an opponent's ball first. Otherwise you could simply push your own balls to the goal.",
    balls: [
      { c: "W", x: -300, y: 200 },
      { c: "W", x: 150, y: 200 },
      { c: "W", x: -300, y: -150 },
      { c: "W", x: 150, y: -260 },
    ],
    arrows: [
      {
        pts: [
          [-300, 200],
          [110, 200],
        ],
        bad: true,
        cross: [-80, 200],
      },
      {
        pts: [
          [-300, -150],
          [-80, -415],
          [120, -280],
        ],
      },
    ],
  },
  {
    t: "Foul: hard at goal from the corner",
    x: "The shooting lines run from the middle of each long cushion to the tip of the small triangle. From the red corners a shot straight at the goal must be soft. Hard at a ball or off a cushion is fine, and from the small green triangle a hard shot at goal is fine too.",
    why: "Close to the goal the game rewards touch, not force. While you aim at the goal from a red corner, the hard part of the meter is striped.",
    zone: "stootlijn",
    balls: [
      { c: "W", x: 820, y: 230 },
      { c: "W", x: 770, y: 0 },
    ],
  },
  {
    t: "Foul: flying along the cushion",
    x: "A ball in the strip within 92 mm of a long cushion may not be hit hard. Play it softly.",
    why: "A hard shot along the rail makes scoring too easy, so it is called a flyer.",
    zone: "vlieg",
    balls: [{ c: "W", x: -400, y: -410 }],
    arrows: [
      {
        pts: [
          [-400, -410],
          [500, -410],
        ],
        bad: true,
        cross: [50, -410],
      },
    ],
  },
  {
    t: "Don't park in the big triangle",
    x: "If one of your balls starts your turn inside the big triangle in front of your goal, move it out or score it before your turn ends.",
    why: "You can't leave a ball in front of the goal just to block it.",
    zone: "triangle",
    balls: [{ c: "W", x: 600, y: 90 }],
    arrows: [
      {
        pts: [
          [600, 90],
          [300, 330],
        ],
      },
    ],
  },
  {
    t: "Penalty spots",
    x: "After a foul your turn ends, any balls that moved go back, and the ball that fouled goes on a penalty spot. Your opponent picks spot 1 or 2 beside the goal posts.",
    why: "A ball tucked beside the posts is hard to score, so a foul really costs you.",
    zone: "penalty",
  },
  {
    t: "Winning the match",
    x: "First to sink all five wins the game. A match is best of three and colours swap each game. Every goal and foul gets a replay, so you see exactly what happened.",
    zone: "goals",
  },
  {
    t: "Make yourself at home",
    x: "The buttons top left: a cigar (1) fills the room with smoke, so the regulars aim worse and you see less. Whisky (2) blurs your view but stretches your aim line. Chalk (3) gives full spin without a miscue, but the dust makes your ball cling to the first ball it hits.",
    why: "Score with a bit of luck and you thank the table: knock twice (4). Lose a game 5-0 and you crawl under the table, onto the Wall of Shame. House rules.",
  },
];

let slide = 0;
function draw(): void {
  const s = SLIDES[slide],
    cv = $<HTMLCanvasElement>("#tutCanvas"),
    c = cv.getContext("2d")!,
    k = Math.min(cv.width / 2080, cv.height / 1180);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(k, 0, 0, k, cv.width / 2, cv.height / 2);
  c.fillStyle = "#4c1f13";
  c.fillRect(-1040, -590, 2080, 1180);
  c.fillStyle = "#16574f";
  c.fillRect(-930, -480, 1860, 960);
  drawTable(c, { lines: true, zone: s.zone, balls: s.balls, arrows: s.arrows });
  $("#tutStep").textContent = `${slide + 1} / ${SLIDES.length}`;
  $("#tutTitle").textContent = s.t;
  $("#tutText").textContent = s.x;
  $("#tutWhy").textContent = s.why || "";
  $("#tutDots").innerHTML = SLIDES.map((_, i) => `<i class="c-tutorial__dot${i === slide ? " is-on" : ""}"></i>`).join(
    "",
  );
  $<HTMLButtonElement>("#tutBack").disabled = slide === 0;
  $("#tutNext .c-btn__label").textContent = slide === SLIDES.length - 1 ? "Done" : "Next";
}
export function initTutorial(): void {
  $("#tutNext").addEventListener("click", () => {
    if (slide < SLIDES.length - 1) {
      slide++;
      draw();
    } else showView("home");
  });
  $("#tutBack").addEventListener("click", () => {
    if (slide > 0) {
      slide--;
      draw();
    }
  });
  $("#tutSkip").addEventListener("click", () => showView("home"));
}
views.tutorial = () => {
  slide = 0;
  draw();
};
