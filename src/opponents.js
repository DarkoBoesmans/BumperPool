// The regulars of The Golden Cue: twelve players in four grades, three per grade, each with their own game.
// ai: n = shots considered, angle/power = how shaky the hand is, powerBias = soft or heavy cue,
//     spin = how often they use spin (0..1), defense = how much they care about blocking you, think = ms before shooting,
//     mix = which kinds of shots they look for (straight, bank off the long cushions, post glances, combos off your balls, anything),
//     flair = bonus for goals that came off cushions or posts first, triangle = bonus for parking their own balls in the small triangle,
//     risk = how much a foul scares them (1 = normal), refine = extra tries around their best idea, tipsy = extra wobble per sip.
// habits: chance per turn to light a cigar or take a sip.

export const GRADES = [
  {
    id: "common",
    label: "Common",
    color: "#a9b3a6",
    ink: "#1a1d19",
    bg: "#1d211c",
  },
  {
    id: "rare",
    label: "Rare",
    color: "#4f97ff",
    ink: "#06142e",
    bg: "#111a2c",
  },
  {
    id: "epic",
    label: "Epic",
    color: "#b46bff",
    ink: "#1d0636",
    bg: "#1d1229",
  },
  {
    id: "legendary",
    label: "Legendary",
    color: "#ffad2e",
    ink: "#2e1500",
    bg: "#2a1a0a",
  },
];
export const gradeOf = (o) => GRADES.find((g) => g.id === o.grade);

export const OPPONENTS = [
  // ---------- common ----------
  {
    id: "kevin",
    grade: "common",
    name: "Kevin Kracht",
    nick: "The Rookie",
    style: "Full power, no plan",
    traits: ["Hits too hard", "Nervous", "On his phone"],
    bio: "Started coming here last week. Plays every ball at full power and checks his phone between shots.",
    look: {
      skin: "#e9b896",
      shirt: "#2f6fd6",
      trim: "#ffffff",
      pants: "#25272e",
      hair: "#3a2416",
      hat: "cap",
      hatColor: "#d0412c",
      build: 0.9,
    },
    ai: {
      n: 10,
      angle: 0.06,
      power: 0.25,
      powerBias: 1.35,
      spin: 0,
      defense: 0,
      think: 500,
      mix: { straight: 0.7, bank: 0.1, random: 0.2 },
    },
    habits: { smoke: 0, drink: 0.12 },
    quips: {
      hello: ["I watched a video on this. How hard can it be?", "Let's gooo!"],
      goal: ["Did you see that?!", "Too easy.", "Clip it, clip it!"],
      foul: [
        "Wait, that counts as a foul?",
        "My bad, my bad.",
        "The table is crooked.",
      ],
      oppGoal: ["Lucky.", "Okay, okay."],
      oppFoul: ["Haha! Rookie mistake!", "Even I know that one."],
      win: ["Rookie of the year, baby!"],
      lose: ["Best of five?", "I was warming up."],
    },
  },
  {
    id: "monique",
    grade: "common",
    name: "Monique Moens",
    nick: "Since 1974",
    style: "Gentle little taps",
    traits: ["Soft touch", "Chatty", "Never in a hurry"],
    bio: "Has had the same stool since 1974. Plays gentle little shots and tells you about her grandchildren while you aim.",
    look: {
      skin: "#f0c7a8",
      shirt: "#9b3f63",
      trim: "#e8c9a0",
      pants: "#3b2b3a",
      hair: "#d8d3cc",
      hat: "perm",
      hatColor: "#d8d3cc",
      build: 0.85,
    },
    ai: {
      n: 18,
      angle: 0.036,
      power: 0.12,
      powerBias: 0.78,
      spin: 0,
      defense: 0.25,
      think: 1400,
      mix: { straight: 0.6, bank: 0.3, random: 0.1 },
    },
    habits: { smoke: 0.08, drink: 0.45 },
    quips: {
      hello: ["Oh, a new face! Sit, sit.", "My late husband loved this table."],
      goal: ["Oh! Would you look at that.", "Still got it, dear."],
      foul: ["Oh dear. My glasses.", "That one slipped."],
      oppGoal: ["Well done, sweetheart.", "Very nice, very nice."],
      oppFoul: ["Tut tut.", "Ooh, the referee saw that."],
      win: ["Another round for everyone!"],
      lose: ["You remind me of my grandson."],
    },
  },
  {
    id: "wim",
    grade: "common",
    name: "Wim Wuyts",
    nick: "The Wobbler",
    style: "Steady, until the third sip",
    traits: ["Shakier every sip", "Lucky streaks", "Sings along"],
    bio: "Comes in for one beer and stays until closing. His first game is decent. After a few sips his hand starts to wander, and sometimes that is exactly what the shot needed.",
    look: {
      skin: "#efb99a",
      shirt: "#c8902a",
      trim: "#5a3a1a",
      pants: "#3a3226",
      hair: "#a85a2a",
      hat: "beanie",
      hatColor: "#2a5a8a",
      beard: true,
      blush: true,
      build: 1.12,
    },
    ai: {
      n: 22,
      angle: 0.02,
      power: 0.1,
      powerBias: 1,
      spin: 0.1,
      defense: 0.1,
      think: 900,
      tipsy: 0.45,
      mix: { straight: 0.5, bank: 0.25, random: 0.25 },
    },
    habits: { smoke: 0.1, drink: 0.75 },
    quips: {
      hello: [
        "One game. Then I'm going home. Probably.",
        "Marcel! Another one!",
      ],
      goal: ["I meant that. Mostly.", "Who needs to aim anyway?", "Ha! Hic."],
      foul: ["The floor moved.", "Did somebody tilt the table?"],
      oppGoal: ["Nice. You buying?", "Ooh, smooth."],
      oppFoul: ["Welcome to my world!", "Haha, cheers to that."],
      win: ["Drinks are on... someone!"],
      lose: ["I'll get you next round. Which round is it?"],
    },
  },
  // ---------- rare ----------
  {
    id: "fred",
    grade: "rare",
    name: "Fred Feys",
    nick: "The Trucker",
    style: "Heavy cue, heavy smoke",
    traits: ["Power hitter", "Chain smoker", "Loud"],
    bio: "Drives a truck to Antwerp and back every day. Plays like he drives: fast, heavy and with a cigar in his mouth.",
    look: {
      skin: "#d79c7a",
      shirt: "#a3261d",
      trim: "#1b1b1b",
      pants: "#2b3a55",
      hair: "#5a3a22",
      hat: "flatcap",
      hatColor: "#4a4036",
      stache: true,
      beard: true,
      build: 1.25,
    },
    ai: {
      n: 34,
      angle: 0.022,
      power: 0.14,
      powerBias: 1.25,
      spin: 0.1,
      defense: 0.1,
      think: 700,
      mix: { straight: 0.55, bank: 0.2, random: 0.25 },
    },
    habits: { smoke: 0.7, drink: 0.4 },
    quips: {
      hello: ["Rack 'em. I'm double parked.", "You break, I smoke."],
      goal: ["BOOM!", "Like a truck through a toll gate.", "Hah!"],
      foul: ["Ah, come on!", "That cushion moved."],
      oppGoal: ["Hmpf.", "Not bad, kid."],
      oppFoul: ["HA! Pay up!", "Referee, you saw that!"],
      win: ["Next round is on you!"],
      lose: ["I need a bigger cigar."],
    },
  },
  {
    id: "bart",
    grade: "rare",
    name: "Bart Bauwens",
    nick: "Cushion King",
    style: "Everything off a cushion",
    traits: [
      "Never plays straight",
      "Loves the long cushion",
      "Talks geometry",
    ],
    bio: "Old carom player who refuses to hit a ball straight. Every shot goes off one cushion, preferably two, and he will explain the angle afterwards.",
    look: {
      skin: "#e0a888",
      shirt: "#2c4a6e",
      trim: "#e8e0cc",
      pants: "#2a2a2e",
      hair: "#6a6258",
      hat: "flatcap",
      hatColor: "#5a5048",
      glasses: true,
      build: 1,
    },
    ai: {
      n: 40,
      angle: 0.018,
      power: 0.1,
      powerBias: 1.05,
      spin: 0.2,
      defense: 0.2,
      think: 1000,
      flair: 12,
      mix: { straight: 0.05, bank: 0.7, post: 0.05, random: 0.2 },
    },
    habits: { smoke: 0.3, drink: 0.3 },
    quips: {
      hello: ["Straight shots are for amateurs.", "Angle in, angle out."],
      goal: ["Off the cushion, as always.", "Pure geometry."],
      foul: ["The cushion is dead on this side.", "Hm. Wrong diamond."],
      oppGoal: ["Straight in? How boring.", "Lucky line."],
      oppFoul: ["You should have used the cushion.", "Tsk."],
      win: ["The cushion never lies."],
      lose: ["Next time I'll use three cushions."],
    },
  },
  {
    id: "sofie",
    grade: "rare",
    name: "Sofie Segers",
    nick: "The Sniper",
    style: "Dead straight, every time",
    traits: ["Dead straight", "Never banks", "Bites her lip"],
    bio: "Darts champion of the street, three years running. Lines up every ball straight at the goal and rarely misses one. Ask her to play off a cushion and she just shrugs.",
    look: {
      skin: "#f0c4a4",
      shirt: "#3a7a4a",
      trim: "#f4ead8",
      pants: "#1c1c22",
      hair: "#d8b060",
      hat: "pony",
      hatColor: "#d8b060",
      lips: true,
      build: 0.9,
    },
    ai: {
      n: 26,
      angle: 0.01,
      power: 0.06,
      powerBias: 1,
      spin: 0,
      defense: 0,
      think: 1200,
      mix: { straight: 1 },
    },
    habits: { smoke: 0, drink: 0.25 },
    quips: {
      hello: ["Bullseye or nothing.", "Let's keep it simple."],
      goal: ["Bullseye.", "Straight in.", "Click."],
      foul: ["Ugh.", "That never happens."],
      oppGoal: ["Fine shot.", "Hm, okay."],
      oppFoul: ["Should have aimed straight.", "Too fancy."],
      win: ["Straight to the point."],
      lose: ["Rematch. Now."],
    },
  },
  // ---------- epic ----------
  {
    id: "rosa",
    grade: "epic",
    name: "Rosa Raes",
    nick: "The Landlady",
    style: "Blocks every goal",
    traits: ["Defensive", "Ice cold", "Never drinks on duty"],
    bio: "Owns the café. Hides her balls behind the posts and blocks your goal until you lose your nerve.",
    look: {
      skin: "#e3ad8c",
      shirt: "#1d1d22",
      trim: "#c8302c",
      pants: "#1d1d22",
      hair: "#151012",
      hat: "bun",
      hatColor: "#151012",
      lips: true,
      build: 0.95,
    },
    ai: {
      n: 70,
      angle: 0.012,
      power: 0.06,
      powerBias: 1,
      spin: 0.2,
      defense: 0.9,
      think: 1100,
      mix: { straight: 0.4, bank: 0.3, random: 0.3 },
    },
    habits: { smoke: 0.2, drink: 0 },
    quips: {
      hello: ["House rules. My house.", "Wipe your feet."],
      goal: ["Mm.", "As planned."],
      foul: ["That will not happen again.", "Hm."],
      oppGoal: ["Enjoy it.", "Cute."],
      oppFoul: ["In my café? Penalty spot.", "Rules are rules, darling."],
      win: ["Last orders."],
      lose: ["Fine. Your drink is on the house."],
    },
  },
  {
    id: "pieter",
    grade: "epic",
    name: "Pieter Peeters",
    nick: "The Professor",
    style: "Spin on every ball",
    traits: ["Spin master", "Calculating", "Slow"],
    bio: "Taught physics for forty years. Every shot comes with draw, follow or side spin, and a short lecture.",
    look: {
      skin: "#eebd9c",
      shirt: "#7a5a3a",
      trim: "#e9dfc8",
      pants: "#4a4034",
      hair: "#bdb6aa",
      hat: "beret",
      hatColor: "#2d3b2f",
      stache: true,
      glasses: true,
      build: 0.95,
    },
    ai: {
      n: 90,
      angle: 0.009,
      power: 0.05,
      powerBias: 0.95,
      spin: 1,
      defense: 0.4,
      think: 1700,
      mix: { straight: 0.45, bank: 0.25, combo: 0.1, random: 0.2 },
    },
    habits: { smoke: 0.3, drink: 0.25 },
    quips: {
      hello: [
        "Shall we discuss angular momentum?",
        "Two sevenths. Remember that.",
      ],
      goal: ["Elementary.", "Conservation of momentum, my friend."],
      foul: ["An experimental error.", "Fascinating."],
      oppGoal: ["Acceptable trajectory.", "Hm, beginner's physics."],
      oppFoul: ["Newton weeps.", "Read the rules, son."],
      win: ["Q.E.D."],
      lose: ["I shall recalculate."],
    },
  },
  {
    id: "gust",
    grade: "epic",
    name: "Gust Goossens",
    nick: "The Gambler",
    style: "Wild combos off your balls",
    traits: ["All-in combos", "Bets on every shot", "Not scared of fouls"],
    bio: "Bets a round on every shot. Loves smashing your ball into his so both go flying. When it works it is spectacular. When it does not, the drinks are on him.",
    look: {
      skin: "#d9a07c",
      shirt: "#6e1626",
      trim: "#e8c860",
      pants: "#1a1a1a",
      hair: "#141010",
      hat: "none",
      stache: true,
      build: 1.05,
    },
    ai: {
      n: 80,
      angle: 0.01,
      power: 0.07,
      powerBias: 1.15,
      spin: 0.3,
      defense: 0.05,
      risk: 0.35,
      think: 800,
      mix: { straight: 0.2, bank: 0.15, combo: 0.45, random: 0.2 },
    },
    habits: { smoke: 0.5, drink: 0.5 },
    quips: {
      hello: ["A round says I win.", "Double or nothing?"],
      goal: ["Jackpot!", "House always wins. I am the house.", "Cha-ching."],
      foul: ["Worth the risk.", "Ah well, easy come."],
      oppGoal: ["Beginner's luck. Bet on it.", "Odds were against you."],
      oppFoul: ["Pay up, friend.", "I'll take that bet."],
      win: ["Drinks on you. Rules of the house."],
      lose: ["Let it ride. Again!"],
    },
  },
  // ---------- legendary ----------
  {
    id: "baron",
    grade: "legendary",
    name: "Baron Bertrand",
    nick: "Nobody knows",
    style: "Never misses",
    traits: ["Never misses", "Cigar connoisseur", "Whisky neat"],
    bio: "Arrives at midnight, orders a single malt and wins. Nobody knows where the title comes from. Nobody has asked twice.",
    look: {
      skin: "#e6b998",
      shirt: "#14141a",
      trim: "#e8e0cc",
      pants: "#14141a",
      hair: "#e8e4dc",
      hat: "fedora",
      hatColor: "#0e0e12",
      stache: true,
      build: 1.05,
    },
    ai: {
      n: 150,
      angle: 0.004,
      power: 0.025,
      powerBias: 1,
      spin: 0.5,
      defense: 0.6,
      think: 1200,
      mix: { straight: 0.4, bank: 0.25, post: 0.05, combo: 0.1, random: 0.2 },
    },
    habits: { smoke: 0.6, drink: 0.5 },
    quips: {
      hello: ["Good evening.", "Shall we?"],
      goal: ["Naturally.", "..."],
      foul: ["How unusual.", "Pardon me."],
      oppGoal: ["Well played.", "Hm."],
      oppFoul: ["A pity.", "Penalty spot, I believe."],
      win: ["Thank you for the evening."],
      lose: ["Remarkable. Same time tomorrow?"],
    },
  },
  {
    id: "cas",
    grade: "legendary",
    name: "Cas Claes",
    nick: "The Closer",
    style: "Checks everything twice",
    traits: ["Better than the Baron", "Never smiles", "Closes every game"],
    bio: "Twenty-three, no expression, never lost a deciding game. The Baron stopped playing him after one evening. Cas checks every option twice and then plays the one you did not see.",
    look: {
      skin: "#e8b494",
      shirt: "#121216",
      trim: "#121216",
      pants: "#2a2a30",
      hair: "#0f0c0a",
      hat: "beanie",
      hatColor: "#121216",
      build: 0.98,
    },
    ai: {
      n: 200,
      refine: 60,
      verify: 10,
      angle: 0.0025,
      power: 0.015,
      powerBias: 1,
      spin: 0.55,
      defense: 0.75,
      think: 700,
      mix: { straight: 0.35, bank: 0.3, post: 0.1, combo: 0.1, random: 0.15 },
    },
    habits: { smoke: 0, drink: 0.15 },
    quips: {
      hello: ["Let's get this done.", "..."],
      goal: ["Next.", "Expected."],
      foul: ["Noted.", "Won't happen twice."],
      oppGoal: ["Doesn't matter.", "Okay."],
      oppFoul: ["Thanks.", "That's the game."],
      win: ["Closed."],
      lose: ["Huh. Again. Right now."],
    },
  },
  {
    id: "matthis",
    grade: "legendary",
    name: "Matthis Maes",
    nick: "Master of the Triangle",
    style: "Trick shots into the small triangle",
    traits: [
      "Trick shots",
      "Lives in the small triangle",
      "Two cushions minimum",
    ],
    bio: "Learned the game behind his back and blindfolded. Matthis bends balls off posts and two cushions into the small triangle, then calmly knocks them in. Nobody plays the triangle like him.",
    look: {
      skin: "#dba483",
      shirt: "#e6dcc4",
      trim: "#141010",
      pants: "#141010",
      hair: "#2a1810",
      hat: "cowboy",
      hatColor: "#141010",
      build: 1,
    },
    ai: {
      n: 220,
      verify: 5,
      angle: 0.0035,
      power: 0.02,
      powerBias: 1,
      spin: 0.7,
      defense: 0.4,
      think: 1000,
      flair: 22,
      triangle: 35,
      mix: { straight: 0.1, bank: 0.35, post: 0.3, combo: 0.1, random: 0.15 },
    },
    habits: { smoke: 0.55, drink: 0.2 },
    quips: {
      hello: ["Watch the triangle.", "Ever seen a ball turn left twice?"],
      goal: [
        "Two cushions and a post. Easy.",
        "Told you. The triangle.",
        "Ta-daa.",
      ],
      foul: ["Too much style, not enough rules.", "The post had other plans."],
      oppGoal: ["Straight? No style points.", "Cute."],
      oppFoul: ["Now watch how it's done.", "Tricky table, huh?"],
      win: ["Triangle never lies."],
      lose: ["That was a trick shot too, right?"],
    },
  },
];

export const findOpponent = (id) =>
  OPPONENTS.find((o) => o.id === id) || OPPONENTS[3];
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

// A 32 x 32 pixel portrait, in the spirit of a PS2 character select. The background glows in the grade colour.
export function paintPortrait(cv, o) {
  const c = cv.getContext("2d"),
    L = o.look,
    S = cv.width / 32,
    G = gradeOf(o) || GRADES[0];
  const r = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x * S, y * S, w * S, h * S);
  };
  r(0, 0, 32, 32, G.bg);
  const glow = c.createRadialGradient(
    16 * S,
    12 * S,
    2 * S,
    16 * S,
    12 * S,
    22 * S,
  );
  glow.addColorStop(0, G.color + "66");
  glow.addColorStop(1, G.color + "00");
  c.fillStyle = glow;
  c.fillRect(0, 0, 32 * S, 32 * S);
  for (let y = 0; y < 32; y += 2) r(0, y, 32, 1, "rgba(0,0,0,.12)");
  const w = Math.round(8 * L.build);
  r(16 - w - 4, 26, 2 * w + 8, 6, L.shirt); // shoulders
  r(14, 26, 4, 6, L.trim); // collar
  r(14, 21, 4, 5, L.skin); // neck
  if (L.hat === "pony") {
    r(21, 10, 4, 11, L.hair);
    r(22, 20, 3, 4, L.hair);
  } // ponytail behind the head
  r(10, 9, 12, 13, L.skin); // head
  r(9, 13, 1, 4, L.skin);
  r(22, 13, 1, 4, L.skin); // ears
  r(12, 14, 2, 2, "#1a120c");
  r(18, 14, 2, 2, "#1a120c"); // eyes
  r(12, 14, 1, 1, "#fff");
  r(18, 14, 1, 1, "#fff");
  if (L.glasses) {
    r(11, 13, 4, 4, "rgba(255,255,255,.18)");
    r(17, 13, 4, 4, "rgba(255,255,255,.18)");
    r(15, 14, 2, 1, "#222");
  }
  if (L.blush) {
    r(11, 17, 2, 1, "rgba(220,60,60,.55)");
    r(19, 17, 2, 1, "rgba(220,60,60,.55)");
    r(15, 16, 2, 2, "rgba(210,70,60,.6)");
  }
  r(15, 16, 2, 2, "rgba(0,0,0,.18)"); // nose
  r(13, 19, 6, 1, L.lips ? "#b51f2a" : "#7a3a2a"); // mouth
  if (L.stache) r(12, 18, 8, 1, L.hair);
  if (L.beard) {
    r(10, 19, 12, 3, L.hair);
    r(12, 22, 8, 1, L.hair);
    r(13, 19, 6, 1, "#7a3a2a");
  }
  const h = L.hatColor;
  switch (L.hat) {
    case "cap":
      r(9, 6, 14, 4, h);
      r(20, 8, 6, 2, h);
      r(10, 9, 12, 1, "rgba(0,0,0,.25)");
      break;
    case "flatcap":
      r(9, 6, 15, 4, h);
      r(8, 9, 17, 1, h);
      r(9, 7, 2, 2, "rgba(255,255,255,.08)");
      break;
    case "fedora":
      r(11, 3, 10, 6, h);
      r(7, 8, 18, 2, h);
      r(11, 7, 10, 1, "#5a1a1a");
      break;
    case "cowboy":
      r(11, 2, 10, 6, h);
      r(13, 2, 6, 1, "rgba(255,255,255,.1)");
      r(5, 7, 22, 2, h);
      r(4, 6, 2, 2, h);
      r(26, 6, 2, 2, h);
      r(11, 6, 10, 1, "#6a4a2a");
      break;
    case "beanie":
      r(9, 5, 14, 5, h);
      r(9, 9, 14, 1, "rgba(255,255,255,.12)");
      r(15, 4, 2, 1, h);
      break;
    case "beret":
      r(9, 6, 14, 4, h);
      r(8, 8, 4, 2, h);
      r(15, 5, 2, 1, h);
      break;
    case "perm":
      r(8, 6, 16, 5, h);
      r(7, 9, 3, 7, h);
      r(22, 9, 3, 7, h);
      r(10, 5, 12, 2, h);
      break;
    case "bun":
      r(10, 7, 12, 3, h);
      r(13, 3, 6, 4, h);
      r(9, 9, 2, 5, h);
      r(21, 9, 2, 5, h);
      break;
    case "pony":
      r(10, 7, 12, 3, L.hair);
      r(9, 9, 2, 4, L.hair);
      break;
    default:
      r(10, 7, 12, 3, L.hair);
      r(9, 9, 1, 3, L.hair);
      r(22, 9, 1, 3, L.hair);
  }
  if (o.habits.smoke > 0.5) {
    r(19, 19, 6, 1, "#6b4a2b");
    r(25, 19, 1, 1, "#ff7a2a");
    r(25, 16, 1, 2, "rgba(220,220,220,.4)");
    r(26, 13, 1, 3, "rgba(220,220,220,.25)");
  }
}
