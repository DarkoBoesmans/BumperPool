# Rules check

How the referee in `src/core/referee.ts` follows the GZV spelreglement 2026-2027. "On the line" means the ball touches the line: its centre is within one ball radius of it.

| Article | What it says | In the game |
| --- | --- | --- |
| SP/3.2 | One minute per shot | Shot clock, a setting. Out of time: turn over; in frame play your ball nearest its goal goes to a penalty spot (the opponent's pick, made for them) |
| SP/4.1 | Balls on their marks; colours swap per game; a lag decides colours in a deciding game | Marks and swap as written. Deciding game: colours as in game 1, no lag (colour has no effect here) |
| SP/4.3 | Stalled game: 3 more turns each, then replay | Not needed: the CPU always plays for a goal |
| SP/5.1 | Opening: middle ball softly off the left cushion; closest to its goal starts; second bad opening is a penalty; a ball in the small triangle need not be played next | As written, tested |
| SP/6.1, 6.3, 6.5, 6.6 | Cue tip only, a foot on the floor, no jumping balls, balls off the table | Can't happen in this game |
| SP/6.4.1 | A ball stuck between the goal posts is a goal | Can't happen: the ball drops or rolls on |
| SP/6.7 | No hard flyer from the 92 mm strip (on the line counts) | A hard shot from the strip into or along its long cushion; hard away from the cushion is allowed |
| SP/7.1 | A ball on the rim counts if it drops before it stops | The lip and rim physics decide |
| SP/7.2 | Opponent's ball in any goal counts for them; your ball in the wrong goal: penalty spot, turn over | As written, tested |
| SP/7.3 | Several goals in one shot; keep the turn if one was valid; both cleared: first last ball wins | As written |
| SP/7.4 | Hard direct goal attempt only from the small triangle or on/above the shooting line | Below the line and clear of it, and not touching the small triangle: foul. Only a direct attempt counts, not off a ball or cushion. Tested |
| SP/7.4.3, 8.4, 8.5, 8.6 | Push shot, touching a ball, stopping a ball | Can't happen in this game |
| SP/8.1 | Own ball first: penalty spot, turn over | As written, tested |
| SP/8.2 | Aiming or playing with the opponent's ball; 8.2.3 last ball in the attack triangle when time runs out | You can only pick your own balls. 8.2.3 as written |
| SP/8.3 | Playing before everything stops | Can't happen: you aim once the balls stop |
| SP/9.1, 9.2, 9.3 | A ball in the big triangle must leave it by the end of the turn, unless the last shot of a turn put it there; with several, one must leave; on the line counts as inside | As written, tested. The ball is ringed and the ribbon reminds you |
| SP/9.4 | The triangle is no zone for the defender's balls | As written |
| SP/9.5 | A defender's ball in the triangle: while it stays in the small triangle, the attacker's ball may not end in the big triangle | As written, after every shot: the ball goes to a penalty spot; a goal in the same shot keeps your turn. Tested |
| SP/10 | Frame play (kaderspel) once a player has one ball left: every shot must send a ball out of its frame | As written, in `src/core/frames.ts`. The 15 frames are the lines on the cloth; on a line you leave by leaving the line; from the attack triangle no change is needed; your own defence triangle is no frame for you (SP/9.4). Tested |
| SP/12 | Penalty spots 1 or 2 by the opponent's choice, else 3, else 4 or 5 | As written. SP/12.3: in frame play a spot a foul was shot from is skipped. Tested |
