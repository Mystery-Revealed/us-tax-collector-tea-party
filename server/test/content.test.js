// content.test.js — structure, the §3.3 multiSelect grading rules, the Tea Act
// trick round, verbatim answer-key checks against spec §4, accuracy-only scoring,
// and the §11 sensitivity guardrails for Tax Collector vs. Tea Party.
import test from 'node:test';
import assert from 'node:assert/strict';
import game, {
  ACTS, SIDE, phasesFor, endingFor, debriefFor,
  ENDINGS, ORGANIZED_MIN, FUSE_MIN, LESSON,
} from '../src/games/usTaxCollectorTeaParty.js';

const stepsOf = () => phasesFor().flatMap((p) => p.steps);

// ---- Drivers: reach a given step, honoring the per-match tile shuffle ----------

function freshAt(targetCursor) {
  const state = game.initMatch({ mode: 'solo', soloSide: SIDE });
  const ss = state.sides[SIDE];
  while (ss.cursor < targetCursor) {
    game.chapterEvent(state, SIDE);
    const res = game.resolve(state, SIDE, game.aiMove(state, SIDE));
    assert.ok(!res.error, `advance to ${targetCursor}: ${res.error}`);
  }
  game.chapterEvent(state, SIDE);
  return { state, ss };
}

// Grade a multiSelect step by tapping a chosen set of REAL tile indices.
function gradeMulti(targetCursor, realIndices) {
  const { state, ss } = freshAt(targetCursor);
  const order = ss.shuffles[targetCursor];
  const choiceIndices = realIndices.map((ri) => order.indexOf(ri));
  const res = game.resolve(state, SIDE, { kind: 'multiSelect', choiceIndices });
  assert.ok(!res.error, `grade at ${targetCursor}: ${res.error}`);
  return res.verdict;
}

const correctReals = (step) => step.choices.flatMap((c, i) => (c.correct ? [i] : []));
const decoyReals = (step) => step.choices.flatMap((c, i) => (c.correct ? [] : [i]));

// ---- Shape --------------------------------------------------------------------

test('five acts, ten graded actions, each act = [multiSelect, decision]', () => {
  assert.equal(ACTS.length, 5, 'five acts');
  assert.equal(game.totalActions, 10, 'ten graded actions');
  assert.equal(game.chapterCount, 5, 'five chapters (one per act)');
  const phases = phasesFor();
  assert.equal(phases.length, 5);
  for (const [i, p] of phases.entries()) {
    assert.equal(p.steps.length, 2, `act ${i}: two phases`);
    assert.equal(p.steps[0].kind, 'multiSelect', `act ${i} Phase 1 is multiSelect`);
    assert.equal(p.steps[1].kind, 'decision', `act ${i} Phase 2 is single-choice`);
  }
});

test('acts run in chronological order 1764 → 1774', () => {
  const years = ACTS.map((a) => a.year);
  assert.deepEqual(years, [1764, 1765, 1767, 1773, 1774]);
});

test('one class group, solo, no rival, no server meters', () => {
  assert.deepEqual(game.sides, ['class']);
  assert.equal(SIDE, 'class');
  assert.equal(game.soloRival, false, 'no AI opponent — you race the clock');
  assert.deepEqual(game.meta.meters, {}, 'Resistance is a client flourish; server carries no meters');
  assert.equal(game.meta.positions, undefined, 'no map layer');
});

test('each Phase 1 grid has six tiles and the spec §4 correct-count', () => {
  // Sugar 3, Stamp 3, Townshend 5, Tea 3, Intolerable 4.
  const expected = { sugar: 3, stamp: 3, townshend: 5, tea: 3, intolerable: 4 };
  for (const a of ACTS) {
    assert.equal(a.p1.choices.length, 6, `${a.id}: six tiles`);
    const nCorrect = a.p1.choices.filter((c) => c.correct).length;
    assert.equal(nCorrect, expected[a.id], `${a.id}: ${expected[a.id]} correct tiles`);
    assert.ok(a.p1.feedback.length > 10, `${a.id}: a feedback line`);
    assert.equal(a.p1.seconds, 25, `${a.id}: 25s Phase-1 timer`);
  }
});

test('each Phase 2 offers four options with exactly one right (makes 100% reachable)', () => {
  for (const a of ACTS) {
    assert.equal(a.p2.choices.length, 4, `${a.id}: four options`);
    const rights = a.p2.choices.filter((c) => c.verdict === 'right').length;
    assert.equal(rights, 1, `${a.id}: exactly one right answer`);
    for (const c of a.p2.choices) {
      assert.ok(['right', 'wrong'].includes(c.verdict), `${a.id}: verdict is right/wrong (no partial in Phase 2)`);
      assert.ok(c.feedback.length > 8, `${a.id}: every option has feedback`);
    }
    assert.equal(a.p2.seconds, 20, `${a.id}: 20s Phase-2 timer`);
  }
});

// ---- §3.3 grading rules: all-correct, half, one-decoy, timeout-empty ----------

test('§3.3 RIGHT: all correct, zero decoys', () => {
  const step = stepsOf()[0]; // Sugar P1, C=3
  assert.equal(gradeMulti(0, correctReals(step)), 'right');
});

test('§3.3 PARTIAL: ≥ half of C with zero decoys', () => {
  const sugar = stepsOf()[0];              // C=3 → 2 correct is ≥ half
  assert.equal(gradeMulti(0, correctReals(sugar).slice(0, 2)), 'partial');
  const townshend = stepsOf()[4];          // C=5 → 3 correct is ≥ half (3 ≥ 2.5)
  assert.equal(gradeMulti(4, correctReals(townshend).slice(0, 3)), 'partial');
  const intolerable = stepsOf()[8];        // C=4 → 2 correct is exactly half
  assert.equal(gradeMulti(8, correctReals(intolerable).slice(0, 2)), 'partial');
});

test('§3.3 PARTIAL: all of C with exactly one decoy', () => {
  const step = stepsOf()[0]; // Sugar C=3
  const picks = [...correctReals(step), decoyReals(step)[0]];
  assert.equal(gradeMulti(0, picks), 'partial');
});

test('§3.3 WRONG: below half correct, any decoy with less-than-all, or a lone decoy', () => {
  const sugar = stepsOf()[0];              // C=3
  assert.equal(gradeMulti(0, correctReals(sugar).slice(0, 1)), 'wrong', '1 of 3 is below half');
  assert.equal(gradeMulti(0, [correctReals(sugar)[0], decoyReals(sugar)[0]]), 'wrong', 'half-ish + a decoy');
  assert.equal(gradeMulti(0, [decoyReals(sugar)[0]]), 'wrong', 'a lone decoy');
  const townshend = stepsOf()[4];          // C=5 → 2 correct is below half (2 < 2.5)
  assert.equal(gradeMulti(4, correctReals(townshend).slice(0, 2)), 'wrong');
  // all correct + TWO decoys is wrong (only exactly-one decoy is forgiven)
  const picks = [...correctReals(sugar), ...decoyReals(sugar).slice(0, 2)];
  assert.equal(gradeMulti(0, picks), 'wrong');
});

test('§3.3 timeout-empty: nothing tapped grades as wrong', () => {
  assert.equal(gradeMulti(0, []), 'wrong');
});

test('Phase 2 timeout (choiceIndex null): no answer = wrong, never a lottery pick', () => {
  // A timed-out single-choice submits an explicit null — it must grade wrong
  // (0 points, no random credit) and the feedback must name the real answer.
  const { state } = freshAt(1); // Sugar Act Phase 2
  const step = stepsOf()[1];
  const rightLabel = step.choices.find((c) => c.verdict === 'right').label;
  const res = game.resolve(state, SIDE, { kind: 'decision', choiceIndex: null });
  assert.ok(!res.error, `timeout submission must resolve, not error: ${res.error}`);
  assert.equal(res.verdict, 'wrong');
  assert.ok(res.feedback.includes(rightLabel), 'feedback names the real answer');
  assert.deepEqual(res.effects, {});
  assert.equal(state.sides[SIDE].actions.at(-1).points, 0);
  // -1 behaves identically (both are "nothing tapped").
  const { state: s2 } = freshAt(1);
  assert.equal(game.resolve(s2, SIDE, { kind: 'decision', choiceIndex: -1 }).verdict, 'wrong');
});

// ---- The Tea Act trick round (spec §4, §10 checklist) -------------------------

test('Tea Act: the "brand-new tea tax" tile is a DECOY (the exam-killer)', () => {
  const tea = ACTS.find((a) => a.id === 'tea');
  const newTax = tea.p1.choices.find((c) => /brand-new tea tax/i.test(c.label));
  assert.ok(newTax, 'the "new tax" tile exists');
  assert.equal(newTax.correct, false, 'Tea Act added NO new tax — this tile must grade as a decoy');

  // Tapping the three real effects = right; adding the "new tax" tile drops it to partial.
  const teaCursor = 6;
  const step = stepsOf()[teaCursor];
  assert.equal(gradeMulti(teaCursor, correctReals(step)), 'right', 'the three real effects = right');
  const withTrap = [...correctReals(step), step.choices.findIndex((c) => /brand-new tea tax/i.test(c.label))];
  assert.equal(gradeMulti(teaCursor, withTrap), 'partial', 'all correct + the one trap tile = partial, never right');
});

// ---- Scoring is verdict-only: no speed, no streaks (spec §1) -------------------

test('accuracy is pure verdict math — a partial Phase 1 + right Phase 2 run = 75%', () => {
  const state = game.initMatch({ mode: 'solo', soloSide: SIDE });
  const ss = state.sides[SIDE];
  for (let a = 0; a < 5; a++) {
    // Phase 1: tap all-but-one correct tile → partial (0.5).
    game.chapterEvent(state, SIDE);
    const p1 = stepsOf()[ss.cursor];
    const order1 = ss.shuffles[ss.cursor];
    const partialPicks = correctReals(p1).slice(0, -1).map((ri) => order1.indexOf(ri));
    const r1 = game.resolve(state, SIDE, { kind: 'multiSelect', choiceIndices: partialPicks });
    assert.equal(r1.verdict, 'partial', `act ${a} P1 partial`);
    // Phase 2: the right answer (1.0).
    const r2 = game.resolve(state, SIDE, game.aiMove(state, SIDE));
    assert.equal(r2.verdict, 'right', `act ${a} P2 right`);
  }
  const report = game.report(state).perSide[SIDE];
  // 5 × 0.5 + 5 × 1.0 = 7.5 / 10 = 75%
  assert.equal(report.accuracy, 75);
});

test('resolutions carry NO speed/streak/combo field — accuracy cannot depend on the clock', () => {
  const { state } = freshAt(0);
  const order = state.sides[SIDE].shuffles[0];
  const res = game.resolve(state, SIDE, { kind: 'multiSelect', choiceIndices: [order[0]] });
  for (const k of ['time', 'seconds', 'speed', 'combo', 'streak', 'bonus']) {
    assert.ok(!(k in res), `resolution must not carry a "${k}" field`);
  }
});

// ---- Endings + verbatim/vocab/sensitivity checks ------------------------------

test('endings tier by ACCURACY', () => {
  assert.equal(endingFor(0, 100).key, 'organized');
  assert.equal(endingFor(0, ORGANIZED_MIN).key, 'organized');
  assert.equal(endingFor(0, ORGANIZED_MIN - 1).key, 'fuse');
  assert.equal(endingFor(0, FUSE_MIN).key, 'fuse');
  assert.equal(endingFor(0, FUSE_MIN - 1).key, 'review');
  for (const e of Object.values(ENDINGS)) assert.match(e.text, /every time London squeezed/, 'every tier carries the lesson');
  assert.equal(debriefFor(), LESSON);
});

test('the exam-killer facts appear verbatim (spec §10 checklist)', () => {
  const allText = ACTS.flatMap((a) => [
    a.p1.prompt, a.p1.feedback, ...a.p1.choices.map((c) => c.label),
    a.p2.prompt, ...a.p2.choices.map((c) => `${c.label} ${c.feedback}`),
  ]).join(' ');
  assert.match(allText, /342 chests/, 'the Boston Tea Party tally');
  assert.match(allText, /92,000\+ pounds/, 'the tea weight');
  assert.match(allText, /No taxation without representation/i, 'the Stamp Act slogan');
  assert.match(allText, /First Continental Congress/, 'the Intolerable Acts backfire');
  assert.match(allText, /Sons of Liberty/, 'the Sons of Liberty');
});

test('the five vocabulary terms surface in student-visible text (spec §2 bubbles)', () => {
  const text = ACTS.flatMap((a) => [
    a.event, a.p1.prompt, a.p1.feedback, ...a.p1.choices.map((c) => c.label),
    a.p2.prompt, ...a.p2.choices.map((c) => `${c.label} ${c.feedback}`),
  ]).join(' ');
  for (const re of [/boycott/i, /monopoly|East India Company/i, /repeal/i, /congress/i, /tax/i]) {
    assert.match(text, re, `vocabulary term present: ${re}`);
  }
});

test('§11 sensitivity: no tarring-and-feathering, no Boston Massacre in any copy', () => {
  const allText = JSON.stringify(ACTS).toLowerCase();
  assert.doesNotMatch(allText, /tarr|feather/, 'no tarring-and-feathering imagery');
  assert.doesNotMatch(allText, /massacre/, 'the Boston Massacre is out of scope (other Unit 2 apps)');
});
