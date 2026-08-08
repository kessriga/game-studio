# Game Design Lenses — Schell's Method, Distilled

Distilled from Jesse Schell, *The Art of Game Design: A Book of Lenses* (3rd ed.,
CRC Press, 2019). A **lens** is a small set of questions you ask about a design to
examine it from one perspective; good design happens when you view the game through
as many lenses as possible. This file is the working reference for the
`game-designer` agent; design skills (`/gamedev:design-review`,
`/gamedev:balance-check`, `/gamedev:brainstorm`) may read it too. Lens numbers
follow the book so humans can look up the full treatment.

## Core Principles

- **The game is not the experience.** The game is an artifact that engenders an
  experience in the player's mind — and the experience is the only thing that
  matters. Design the experience first, then the artifact that produces it.
- **Essential experience.** Don't replicate reality — capture its *essence* and
  deliver it through any element available: art, sound, or rules. State the
  essential experience explicitly; without it you can't tell which elements are
  safe to change.
- **The Elemental Tetrad.** Every game is mechanics + story + aesthetics +
  technology — equal, mutually reinforcing, all serving one theme. Mechanics never
  live alone: a deficit in one element can be rescued by a change in another.
- **Theme is the cheapest decision procedure.** Settle it early; then every
  element either reinforces the theme (stays) or doesn't (goes). The best themes
  *resonate* — they touch something players already hold deep inside.
- **The Rule of the Loop.** "The more times you test and improve your design, the
  better your game will be" — no exceptions. Half of development time goes to
  balancing, and balancing starts only once the game is playable.
- **Fall in love with your problem, not your solution.** State the design problem
  (goal + constraints) before generating solutions; measure every idea against it.

## The Lens Battery

Condensed question sets, grouped by design activity. Ask them literally.

### Concept & experience

- **#1 Emotion** — What emotions should the player feel? What are they actually
  feeling, and how do I bridge the gap?
- **#2 Essential Experience** — What experience do I want the player to have?
  What is essential to it? How can the game capture that essence?
- **#9 Elemental Tetrad** — Does the design use all four elements? Could one be
  enhanced? Are they in harmony, reinforcing a common theme?
- **#11 Unification / #12 Resonance** — What is the theme? Is every means possible
  used to reinforce it? What about this game feels powerful and special?
- **#14 Problem Statement** — What problem am I really solving? Have I smuggled in
  assumptions irrelevant to its true purpose? How will I know it's solved?
- **#17 The Toy** — If the game had no goal, would it be fun at all? Would people
  want to play with it before knowing what to do?

### Mechanics

- **#28 State Machine** — What are the objects, attributes, states? What triggers
  each transition? (Diagram them; forbid illegal transitions by construction.)
- **#29 Secrets** — Who knows which state: everyone, some players, one, only the
  game? Would changing who-knows-what improve play? Revealing private information
  is instant drama.
- **#30 Emergence / #31 Action** — How many verbs? How many objects can each verb
  act on? (Verbs-acting-on-many-objects is the strongest emergence lever.) What is
  the ratio of strategic actions to basic actions? What do players wish they could do?
- **#32 Goals** — Is the ultimate goal clear, concrete, achievable, rewarding?
  Are short- and long-term goals balanced? The object of the game is its most
  important rule — it should fit in a sentence.
- **#34 Skill** — What physical / mental / social skills does the game actually
  demand? (Be honest: many "reaction" games are really memorization games — a far
  more tedious experience than the designer believes.)
- **#35 Expected Value** — For each choice: actual probability, *perceived*
  probability, and outcome value including intangibles like regret? Players act on
  perceived odds, not true ones.
- **#36 Chance** — Where does uncertainty come from? Does randomness create
  excitement or hopelessness? Can randomness feel like skill and skill like risk?

### Balance

- **#37 Fairness** — Symmetric or asymmetric, and why? If asymmetric, balance by
  assigning values and equalizing sums — then let play revise the value model
  (model ↔ balance is a loop).
- **#38 Challenge** — How does difficulty grow? What percentage of players should
  finish — decided explicitly? Early sections must be nearly free: learning the
  controls *is* the challenge there.
- **#39 Meaningful Choices** — Do choices change outcomes? Any dominant strategy
  (a clearly-best option that solves and kills the game)? Choices > desires =
  overwhelmed; choices < desires = frustrated; choices = desires = freedom.
- **#40 Triangularity** — Is there a safe-small vs. risky-big choice, with reward
  commensurate to risk? A prototype that "just isn't fun" is missing exactly this
  about 8 times in 10 — check it first.
- **#46 Reward / #47 Punishment** — Variable rewards beat fixed at equal expected
  value; escalate reward magnitude with progress. Prefer reward over punishment
  for the same behavior change; all punishment must be understandable and
  preventable, or the game reads as unfair and is abandoned.
- **#48 Simplicity/Complexity / #49 Elegance** — Is complexity emergent (simple
  rules, rich situations) or innate (rules full of "unless/except" — a patch
  stack)? Count each element's purposes: one purpose → combine or cut it
  (Pac-Man's dots serve five). Prefer one natural rule that generates the whole
  difficulty curve to a stack of exceptions.
- **#52 Economy** — Are earn and spend both meaningful choices? Universal vs.
  specialized currencies? Watch collusion holes.
- **#53 Balance** — the escape hatch: does the game *feel* right? Why or why not?

### Pacing & engagement

- **#21 Flow** — Clear goals? No distractions? Direct feedback? Challenge tracking
  skill? Flow looks like quiet withdrawal in playtests — watch for the moment a
  player *leaves* the channel and design that moment out.
- **#22 Needs / #23 Motivation** — Which of competence, autonomy, relatedness does
  each system serve? Map every motivation on internal↔external ×
  pleasure-seeking↔pain-avoidance. Watch the slide from "wanna" into "hafta":
  accumulated obligations make players divorce a game, not just quit it. Adding
  extrinsic rewards to an intrinsically fun activity can drain the fun — test what
  happens when the reward stops.
- **#24 Novelty** — What is novel, and is novelty spread throughout or only at the
  start? When it wears off, will players still enjoy the game?
- **#25 Judgment** — What does the game judge about players, and do they feel the
  judgment is fair? Players don't hate being judged — they hate being judged unfairly.
- **#68 Moments / #69 Interest Curve** — Name the top ten moments. Chart interest
  over time: hook early, rise in waves with deliberate rests, finish above
  everything, leave them wanting more. The pattern is fractal: game, level, and
  encounter each carry their own curve. Ask playtesters to *draw* the curve they felt.
- **#72 Projection** — What lets players project themselves in? A dull event can be
  carried by poetry (beauty) or projection (it happens *to the player*) — Tetris
  survives on projection alone.

### Process

- **#15 The Eight Filters** — a design is done only when it passes all eight
  without needing a change: artistic impulse · demographics · experience design ·
  innovation · business · engineering · social/community · playtesting.
- **#16 Risk Mitigation** — What could keep this game from being great? Stop
  thinking positively; face the biggest risk with the cheapest prototype that
  answers one stated question.
- **#103 Playtesting** — Why test, who, when, where, what to look for, how?

## Decision Rules

- **Game not fun?** Suspect missing triangularity first, then hunt for a dominant
  strategy.
- **Tuning a number:** double or halve, never nudge 10% — jump far enough to feel
  the difference, then bisect.
- **Story vs. mechanics conflict:** bend the story — it changes with a few words;
  mechanics cost weeks. Design order for story games: fantasy → actions → economy
  → world → story (least to most flexible).
- **Dynamic difficulty adjustment is a trap:** it breaks world-reality, invites
  sandbagging, and robs the pleasure of earned mastery. Prefer layered challenge
  (pass with a C, master for an A+) and losers-get-a-break mechanics.
- **Don't let players balance the game:** they want challenge *and* easy wins —
  a conflict of interest.
- **Mid-development, "the right way to play" suddenly dies:** celebrate — a
  dominant strategy was just eliminated.
- **Cut boring decisions.** Interactivity is not total freedom; nobody misses a
  choice everyone would make the same way.
- **All tuning values live in data files, tweakable** — the Rule of the Loop
  continues after shipping.

## Playtest Discipline

- Cadence: **WUBALEW** — When Useful, But At Least Every Week, from paper
  prototype to post-ship.
- Every playtest answers *stated questions*; "is it fun?" is not specific enough.
  Surprises are the primary yield — possible only if you wrote down expectations.
- Prototypes stay ugly on purpose: polish hides problems.
- Watch faces, not screens. Don't ask players to be designers ("should level 3 be
  harder?"); ask about experience ("was any part of level 3 boring?").
- Debrief with **FFWWDD**: most Frustrating moment · Favorite moment · anything you
  Wanted to do but couldn't · magic-Wand change · what were you Doing · how would
  you Describe it to a friend?

## The Quick Audit

Run when reviewing any mechanic or GDD:

1. What is the essential experience, and does every tetrad element serve it? (#2, #9, #11)
2. Name the top ten moments; draw the interest curve; find the hook and finale. (#68, #69)
3. Is the player always in the flow channel, with tension and release? (#21)
4. Are choices meaningful, risky, and dominant-strategy-free? (#39, #40)
5. Is feedback immediate and readable? What does the game judge, and is it fair? (#25, #37)
6. Who is the player, what pleasure do they seek, what do they fantasize? (#22, #23)
7. Does it feel right? (#53)
