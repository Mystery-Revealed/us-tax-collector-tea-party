// gamemanager.test.js — drives the manager the way socketHandlers does and
// inspects the emit instructions it returns. No sockets involved. Tax Collector
// vs. Tea Party is single-class solo (no pick, no branch, no AI rival), so these
// focus on the solo lifecycle, the one class-wide group, and the accuracy path
// across BOTH step kinds (multiSelect Phase 1 + single-choice Phase 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../src/GameManager.js';
import game, { phasesFor, SIDE } from '../src/games/usTaxCollectorTeaParty.js';

const PIN = '4242';
const stepsOf = () => phasesFor().flatMap((p) => p.steps);

function makeSession(manager, { requireApproval = false } = {}) {
  const res = manager.createSession({ pin: PIN, requireApproval });
  assert.ok(res.joinCode, 'session created');
  return res.joinCode;
}

function join(manager, joinCode, nickname) {
  const res = manager.joinStudent({ joinCode, nickname, mode: 'solo', nation: SIDE });
  assert.ok(!res.error, `join failed: ${res.error}`);
  return res;
}

const studentEvents = (emits, studentId, name) =>
  emits.filter((e) => e.to.type === 'student' && e.to.studentId === studentId && (!name || e.event === name));
const eventsOf = (emits, name) => emits.filter((e) => e.event === name);

function liveSide(manager, joinCode, studentId) {
  const session = manager.registry.get(joinCode);
  const student = session.students.get(studentId);
  const match = session.matches.get(student.matchId);
  return { match, ss: match.gameState.sides[match.side] };
}

// The historically-right move for whatever step is current — works for both
// multiSelect (taps every correct tile) and decision (picks the one right choice).
function playRight(manager, joinCode, studentId) {
  const { match } = liveSide(manager, joinCode, studentId);
  const move = game.aiMove(match.gameState, match.side);
  return manager.submitMove({ joinCode, studentId, move });
}

function playAllRight(manager, joinCode, studentId) {
  let last;
  for (let i = 0; i < game.totalActions; i++) {
    last = playRight(manager, joinCode, studentId);
    assert.ok(!last.error, `action ${i}: ${last.error}`);
  }
  return last;
}

test('createSession rejects a bad PIN', () => {
  const manager = new GameManager();
  assert.equal(manager.createSession({ pin: 'abc' }).error, 'bad_pin');
  assert.equal(manager.createSession({ pin: '12345' }).error, 'bad_pin');
});

test('the default game is Tax Collector vs. Tea Party', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  assert.equal(manager.registry.get(joinCode).gameId, 'us-tax-collector-tea-party');
});

test('teacher ops require the right PIN', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  assert.equal(manager.endSession({ joinCode, pin: '9999' }).error, 'bad_pin');
  assert.equal(manager.setApproval({ joinCode, pin: '0000', requireApproval: false }).error, 'bad_pin');
});

test('a student joins, the match begins on join, and all-right earns 100% and "Resistance Organized"', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Ana');

  const begin = studentEvents(res.emits, res.studentId, 'match:begin');
  assert.equal(begin.length, 1, 'solo match begins on join');
  assert.equal(begin[0].payload.side, 'class');
  assert.equal(begin[0].payload.rivalMeters, null, 'no rival');
  assert.equal(begin[0].payload.chapterCount, 5, 'five acts');

  const last = playAllRight(manager, joinCode, res.studentId);
  const end = studentEvents(last.emits, res.studentId, 'match:end');
  assert.equal(end.length, 1, 'match ends after 10 actions');
  assert.equal(end[0].payload.you.accuracy, 100);
  assert.equal(end[0].payload.you.ending.key, 'organized');
  assert.match(end[0].payload.you.debrief, /every time London squeezed/, 'lesson present');

  const roster = manager.roster(manager.registry.get(joinCode));
  assert.equal(roster.students[0].status, 'completed');
  assert.equal(roster.students[0].accuracy, 100);
});

test('the teacher\'s very first lobby:update already shows in_progress, not a stale not_started (shared-engine regression)', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Cam');

  const lobbyUpdates = eventsOf(res.emits, 'lobby:update');
  assert.equal(lobbyUpdates.length, 1, 'join emits exactly one roster snapshot');
  assert.equal(lobbyUpdates[0].payload.students[0].status, 'in_progress',
    'the solo match already started by the time this snapshot is built');
});

test('Phase 1 is multiSelect and its resolution reveals per-tile correctness but not before', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Bea');

  // The first prompt (Sugar Act, Phase 1) ships tiles with labels/icons — no `correct`.
  const begin = studentEvents(res.emits, res.studentId, 'turn:begin')[0].payload;
  assert.equal(begin.kind, 'multiSelect');
  assert.equal(begin.pick, 'many');
  assert.equal(begin.seconds, 25);
  assert.equal(begin.choices.length, 6);
  for (const c of begin.choices) {
    assert.equal(typeof c.label, 'string');
    assert.ok(!('correct' in c), 'the answer key never leaks in the prompt');
  }

  // Tap a single decoy → graded wrong; the resolution now reveals every tile.
  const { ss } = liveSide(manager, joinCode, res.studentId);
  const step = stepsOf()[0];
  const decoyReal = step.choices.findIndex((c) => !c.correct);
  const decoyPresented = ss.shuffles[0].indexOf(decoyReal);
  const r = manager.submitMove({ joinCode, studentId: res.studentId, move: { kind: 'multiSelect', choiceIndices: [decoyPresented] } });
  const resolution = studentEvents(r.emits, res.studentId, 'turn:resolution')[0].payload;
  assert.equal(resolution.verdict, 'wrong', 'one decoy, zero correct = wrong');
  assert.ok(resolution.feedback && resolution.feedback.length > 10, 'the whole-set feedback line ships');
  assert.equal(resolution.tiles.length, 6, 'every tile revealed for the flash + review');
  assert.equal(resolution.tiles.filter((t) => t.correct).length, 3, 'Sugar Act has 3 correct tiles');
  assert.equal(resolution.tiles.filter((t) => t.picked).length, 1, 'the one tapped decoy is marked');
});

test('class accuracy is one class-wide group (spec §1: no pick)', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const a = join(manager, joinCode, 'Ana');
  const b = join(manager, joinCode, 'Ben');
  playAllRight(manager, joinCode, a.studentId);
  playAllRight(manager, joinCode, b.studentId);

  const roster = manager.roster(manager.registry.get(joinCode));
  assert.equal(roster.classAccuracy.class.count, 2, 'both students in one group');
  assert.equal(roster.classAccuracy.class.average, 100);
});

test('approval gate: a solo student waits, then starts on approve', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager, { requireApproval: true });
  const res = join(manager, joinCode, 'Mara');
  assert.equal(res.approved, false);
  assert.equal(studentEvents(res.emits, res.studentId, 'match:begin').length, 0);

  const ok = manager.approveStudent({ joinCode, pin: PIN, studentId: res.studentId });
  assert.equal(studentEvents(ok.emits, res.studentId, 'join:approved').length, 1);
  assert.equal(studentEvents(ok.emits, res.studentId, 'match:begin').length, 1);
});

test('a wrong-kind move is rejected (Phase 1 is multiSelect, not decision)', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Ana');
  const bad = manager.submitMove({ joinCode, studentId: res.studentId, move: { kind: 'decision', choiceIndex: 0 } });
  assert.equal(bad.error, 'wrong_step_kind');
});

test('an empty (timed-out) multiSelect submission still grades — as wrong', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Ana');
  const r = manager.submitMove({ joinCode, studentId: res.studentId, move: { kind: 'multiSelect', choiceIndices: [] } });
  const resolution = studentEvents(r.emits, res.studentId, 'turn:resolution')[0].payload;
  assert.equal(resolution.verdict, 'wrong', 'nothing tapped = wrong, but it still resolves');
  assert.equal(resolution.sideDone, false, 'play continues to Phase 2');
});

test('rejoin returns a full snapshot of the live action', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Ana');
  playRight(manager, joinCode, res.studentId); // Phase 1 done; Phase 2 pending

  manager.markDisconnected({ joinCode, studentId: res.studentId });
  const back = manager.rejoinStudent({ joinCode, studentId: res.studentId });
  assert.ok(!back.error);
  assert.equal(back.sync.screen, 'match');
  assert.equal(back.sync.turn.kind, 'decision', 'Phase 2 is a single-choice decision');
  assert.ok(Array.isArray(back.sync.turn.choices) && back.sync.turn.choices.length === 4);
});

test('end_session wipes the session from memory', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  join(manager, joinCode, 'Ana');
  const res = manager.endSession({ joinCode, pin: PIN });
  assert.ok(eventsOf(res.emits, 'session:ended').length >= 2, 'teacher + student notified');
  assert.equal(manager.registry.get(joinCode), undefined);
});

test('roster exposes a per-act (chapter) class accuracy row, labeled via game.meta.chapters', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  const res = join(manager, joinCode, 'Ana');

  // Act 1 (Sugar) Phase 1: tap zero correct tiles -> wrong (0 pts).
  manager.submitMove({ joinCode, studentId: res.studentId, move: { kind: 'multiSelect', choiceIndices: [] } });
  // Act 1 Phase 2: the right answer (1 pt). Act 1 average so far: (0+1)/2 = 50%.
  playRight(manager, joinCode, res.studentId);

  const roster = manager.roster(manager.registry.get(joinCode));
  assert.equal(roster.meta.chapters.length, 5, 'five acts labeled');
  assert.equal(roster.meta.chapters[0].title, 'Sugar Act');
  assert.equal(roster.chapterAccuracy.length, 5);
  assert.deepEqual(roster.chapterAccuracy[0], { count: 2, average: 50 });
  assert.deepEqual(roster.chapterAccuracy[1], { count: 0, average: null }, 'untouched acts report no data');
});

test('students cannot reach teacher data: report requires the PIN', () => {
  const manager = new GameManager();
  const joinCode = makeSession(manager);
  assert.equal(manager.sessionReport({ joinCode, pin: '1111' }).error, 'bad_pin');
  assert.ok(manager.sessionReport({ joinCode, pin: PIN }).report);
});
