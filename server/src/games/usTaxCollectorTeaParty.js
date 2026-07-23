// usTaxCollectorTeaParty.js — Unit 2 U.S. History adapter: "Tax Collector vs.
// Tea Party" (SOLO, single class group, NO variant, NO branch, NO map, NO meters).
//
// THE DESIGN (spec §1): five British acts, 1764–1774, fly at the student in
// chronological order. Each act is ONE chapter of two fast phases:
//   • Phase 1 — "What did it hit?"  a multiSelect grid of six tiles; tap every one
//     the act really touched. (Act 4, the Tea Act, is the trick: it added NO new
//     tax, so the "brand-new tea tax" tile is a decoy.)
//   • Phase 2 — "How did colonists answer?"  a single-choice pick from four.
// Five acts × two phases = TEN graded actions.
//
// STRAIGHT FACTORY USAGE (spec §6): the whole game is 5 phases of 2 steps, driven
// by createStepGame. The only engine work this game needed is the `multiSelect`
// step kind + its §3.3 grading — now shared in _stepGame.js. Everything else here
// is content copied verbatim from spec §4.
//
// HONEST SCORING (spec §1): the timer and the client's Resistance combo meter are
// pure adrenaline — speed and streaks NEVER touch the grade. Every action is
// graded server-side: multiSelect per §3.3 (right 1 / partial 0.5 / wrong 0),
// Phase 2 single-choice (right 1 / wrong 0). Accuracy = points ÷ 10 × 100. The
// Resistance meter is a client-only flourish, so this adapter carries no meters.
//
// READING LEVEL (Common Standards §3): 8th-grade content at a 5th-grade reading
// level — short sentences, common words, hard terms defined on first use. The
// client underlines the five vocabulary terms (duty, boycott, monopoly, repeal,
// congress) with tap-for-plain-words bubbles.
//
// SENSITIVITY (spec §11): light topic, light tone — the unit's politics-and-
// economics slot. Protest stays to boycotts, congresses, and the Tea Party; no
// tarring-and-feathering, no Boston Massacre (those live in other Unit 2 apps).

import { createStepGame } from './_stepGame.js';

// One class group (spec §1: "Pick: none — one class group"). Roster and Command
// Center group every student under this single side.
export const SIDE = 'class';

const V = { R: 'right', W: 'wrong' }; // Phase 2 is single-choice: one right, three wrong.

// A Phase-1 tile: a label, an icon (emoji the client renders beside it), and the
// correct/decoy flag the SERVER grades on and never ships in the prompt.
const tile = (label, correct, icon) => ({ label, correct: !!correct, icon: icon || null });

// Phase 1 — the multiSelect grid. `feedback` is one line for the whole tap-set.
const phase1 = (prompt, tiles, feedback, seconds = 25) =>
  ({ kind: 'multiSelect', prompt, choices: tiles, feedback, seconds });

// A Phase-2 option: label, verdict, and its own feedback line.
const opt = (label, verdict, feedback) => ({ label, verdict, feedback });

// Phase 2 — single-choice from four.
const phase2 = (prompt, options, seconds = 20) =>
  ({ kind: 'decision', prompt, choices: options, seconds });

// ---------------------------------------------------------------------------
// The five acts — verbatim from spec §4. Each act is a phase: an event card
// (title, year, image, one setup line) + two graded steps (P1 grid, P2 choice).
// ---------------------------------------------------------------------------

export const ACTS = [
  // ===== Act 1 — Sugar Act (1764) =========================================
  {
    id: 'sugar',
    title: 'Sugar Act',
    year: 1764,
    image: 'act_sugar.webp',
    event: 'Britain owes a mountain of war debt. Parliament turns to the colonies to help pay it — starting with sugar.',
    p1: phase1(
      'Tap what this act taxed or changed.',
      [
        tile('Molasses — enforced for real now', true, '🛢️'),
        tile('Wine', true, '🍷'),
        tile('Coffee', true, '☕'),
        tile('Newspapers', false, '📰'),
        tile('Window glass', false, '🪟'),
        tile('Tea', false, '🍵'),
      ],
      'Sneaky one — it LOWERED the molasses tax but finally enforced it. Paper and glass come later.',
    ),
    p2: phase2(
      'How did colonists answer?',
      [
        opt('Merchant protests and the first boycotts — plus fury at trials with no juries.', V.R,
          'Smugglers now faced judges, never juries. Colonists called that a stolen right.'),
        opt('They dumped sugar into Boston Harbor.', V.W,
          'Wrong cargo, wrong decade — tea, 1773.'),
        opt('They declared independence at once.', V.W,
          "That's 12 years and many acts away."),
        opt('They happily paid — the tax was lower.', V.W,
          "Lower but ENFORCED — that's what stung."),
      ],
    ),
  },

  // ===== Act 2 — Stamp Act (1765) =========================================
  {
    id: 'stamp',
    title: 'Stamp Act',
    year: 1765,
    image: 'act_stamp.webp',
    event: 'Now a first: a direct tax, paid in stamps, on almost everything made of paper.',
    p1: phase1(
      'Tap what needed a stamp.',
      [
        tile('Newspapers', true, '📰'),
        tile('Legal papers & wills', true, '📜'),
        tile('Playing cards & dice', true, '🎴'),
        tile('Molasses', false, '🛢️'),
        tile('Paint', false, '🎨'),
        tile('Tea', false, '🍵'),
      ],
      "Paper, paper, paper — even your card games. The first tax colonists couldn't dodge.",
    ),
    p2: phase2(
      'How did colonists answer?',
      [
        opt('Riots, the Sons of Liberty, a Stamp Act Congress — and stamp agents quitting in fear.', V.R,
          "'No taxation without representation!' The act died by repeal in 1766. Towns even held mock funerals for Liberty — then declared she still lived."),
        opt('A polite letter, then payment.', V.W,
          'Nine colonies sent delegates to a protest congress. Not polite.'),
        opt('The Boston Tea Party.', V.W,
          'Eight years early.'),
        opt('They stopped using paper.', V.W,
          'A world without newspapers and wills? Impossible — which is why everyone was furious.'),
      ],
    ),
  },

  // ===== Act 3 — Townshend Acts (1767) ====================================
  {
    id: 'townshend',
    title: 'Townshend Acts',
    year: 1767,
    image: 'act_townshend.webp',
    event: 'Parliament tries again — small duties on everyday imports, with the money aimed at the royal governors.',
    p1: phase1(
      'Tap what these acts taxed.',
      [
        tile('Glass', true, '🪟'),
        tile('Lead', true, '🔩'),
        tile('Paint', true, '🎨'),
        tile('Paper', true, '📄'),
        tile('Tea', true, '🍵'),
        tile('Playing cards', false, '🎴'),
      ],
      'Five everyday imports. The sneaky part: the money paid royal governors — so colonial assemblies lost their grip on them.',
    ),
    p2: phase2(
      'How did colonists answer?',
      [
        opt('Boycotts of British goods, again — and louder warnings about self-government.', V.R,
          "Hit the wallet, skip the musket. Boycotts were the era's super-weapon."),
        opt('They burned every governor’s mansion.', V.W,
          'No — pressure came through purses, not torches.'),
        opt("They accepted 'outside' taxes as fair.", V.W,
          'Townshend hoped so. He was wrong.'),
        opt('They switched entirely to French goods.', V.W,
          'Homespun and smuggled goods, mostly — not a French pipeline.'),
      ],
    ),
  },

  // ===== Act 4 — Tea Act (1773) — the TRICK round =========================
  {
    id: 'tea',
    title: 'Tea Act',
    year: 1773,
    image: 'act_tea.webp',
    event: 'Careful here. This one is famous for a reason — and famous for a trick.',
    p1: phase1(
      'Tap what this act ACTUALLY did.',
      [
        tile('Let the East India Company sell straight to colonists', true, '🚢'),
        tile('Made taxed tea CHEAPER than smuggled tea', true, '🏷️'),
        tile('Cut colonial merchants out of the tea trade', true, '✂️'),
        tile('Added a brand-new tea tax', false, '💰'),
        tile('Banned all tea', false, '🚫'),
        tile("Closed Boston's port", false, '⚓'),
      ],
      'The exam-killer: NO new tax. The East India Company got a monopoly — the only company allowed to sell — so cheap legal tea was the bait; accepting Parliament’s old tax was the hook.',
    ),
    p2: phase2(
      'How did colonists answer?',
      [
        opt('The Boston Tea Party — 342 chests, 92,000+ pounds, dumped in three disciplined hours.', V.R,
          'So orderly they swept the decks and replaced a broken padlock. Civil disobedience, priced today over $1.7 million.'),
        opt('They bought the cheap tea gratefully.', V.W,
          'Some wanted to — the Sons of Liberty made sure the principle won.'),
        opt('They taxed British goods back.', V.W,
          "Colonies couldn't tax Britain."),
        opt('An immediate declaration of war.', V.W,
          'War is still 16 months off — Lexington, 1775.'),
      ],
    ),
  },

  // ===== Act 5 — Intolerable Acts (1774) ==================================
  {
    id: 'intolerable',
    title: 'Intolerable Acts',
    year: 1774,
    image: 'act_intolerable.webp',
    event: 'Britain stops taxing and starts punishing. Boston is the target.',
    p1: phase1(
      'Tap everything these acts did.',
      [
        tile("Closed Boston's port", true, '⚓'),
        tile('Banned most town meetings', true, '🏛️'),
        tile('Sent accused officials to Britain for trial', true, '⚖️'),
        tile('Forced easier quartering of troops', true, '🛏️'),
        tile('Taxed sugar', false, '🍬'),
        tile('Repealed the tea tax', false, '🍵'),
      ],
      "Punishment, not taxes — Boston's harbor chained shut and its self-government canceled. Colonists nicknamed the trial rule the 'Murder Act.'",
    ),
    p2: phase2(
      'What happened next?',
      [
        opt('12 of 13 colonies sent delegates to the First Continental Congress.', V.R,
          'Meant to isolate Massachusetts, the acts united America instead. Only Georgia stayed home.'),
        opt('Massachusetts paid up and apologized.', V.W,
          'Relief wagons rolled IN — the colonies fed Boston rather than let it kneel.'),
        opt('The other colonies abandoned Boston.', V.W,
          "Opposite: 'an attack on one is an attack on all.'"),
        opt('Parliament backed down and repealed everything.', V.W,
          'No repeal — the next stop is Lexington.'),
      ],
    ),
  },
];

// ---------------------------------------------------------------------------
// Assembly. Each act becomes one engine "chapter" (phase) of exactly two steps —
// the P1 grid then the P2 choice — so the engine's 2-steps-per-chapter math maps
// straight onto 5 acts × 2 phases = 10 actions, in chronological order.
// ---------------------------------------------------------------------------

export function phasesFor() {
  return ACTS.map((a) => ({
    title: `${a.title} (${a.year})`,
    date: String(a.year),
    image: a.image,
    event: a.event,
    steps: [a.p1, a.p2],
  }));
}

// ---------------------------------------------------------------------------
// Endings tier by ACCURACY (spec §1: speed/streaks never touch the grade). Every
// tier shows the same closing lesson; the tier only sets the reward tone. The
// Resistance meter's final state is a client flourish shown alongside.
// ---------------------------------------------------------------------------

export const LESSON = 'Five acts, ten years, one lesson: every time London squeezed, America organized.';

export const ORGANIZED_MIN = 80; // top — read every act right
export const FUSE_MIN = 50;      // middle — the fuse is lit

export const ENDINGS = {
  organized: { key: 'organized', title: 'Resistance Organized',
    text: `You read every squeeze and named every answer. From merchant boycotts to the First Continental Congress, you tracked how anger turned into organization. ${LESSON}` },
  fuse: { key: 'fuse', title: 'The Fuse Is Lit',
    text: `You caught the big moves and missed a few details — but you saw the pattern building. ${LESSON}` },
  review: { key: 'review', title: 'Run It Back',
    text: `A few acts slipped past you — especially the trick ones. Check your misses, then play again: the pattern is easier to see the second time. ${LESSON}` },
};

export function endingFor(_score, accuracy) {
  if (accuracy >= ORGANIZED_MIN) return ENDINGS.organized;
  if (accuracy >= FUSE_MIN) return ENDINGS.fuse;
  return ENDINGS.review;
}

// No server meters — the Resistance meter is a pure client flourish (spec §3.1).
export function noScore() {
  return 0;
}

// The debrief (shown under every ending) is the one-line takeaway; the client's
// Review of Misses handles the per-action reteach.
export function debriefFor() {
  return LESSON;
}

// ---------------------------------------------------------------------------

export default createStepGame({
  id: 'us-tax-collector-tea-party',
  title: 'Tax Collector vs. Tea Party',
  sides: [SIDE],                 // one class group — no pick
  modes: ['solo'],
  soloRival: false,             // no AI opponent; you race the clock, not a rival
  startMeters: () => ({}),      // no server meters — Resistance is client-only
  phasesFor,
  // no meters, no map layer; `chapters` labels the Command Center's per-act row.
  meta: { meters: {}, chapters: ACTS.map((a) => ({ title: a.title, year: a.year })) },
  scoreMeters: noScore,
  endingFor,
  debriefFor,
});
