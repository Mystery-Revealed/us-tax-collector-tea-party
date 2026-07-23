// MatchView.jsx — the arcade loop, one act at a time (spec §3.2, §5):
//   act title card slams in (2s) → Phase 1 (25s timer, 6-tile multiSelect grid)
//   → verdict flash (tiles revealed ✔/⚠/✗) → Phase 2 (20s timer, 4 choices)
//   → verdict flash → next act's title card, timeline dot advances.
//
// Two client flourishes live here, and ONLY here — the server never sees them:
//   • the RESISTANCE meter + combo spark (spec §3.1) — right +10 & combo+1,
//     partial +5, wrong resets combo to 0. Pure adrenaline; never the grade.
//   • the TIMER RINGS — client-side countdowns. At 0, each phase auto-submits
//     exactly what the student has tapped so far: Phase 1 sends the current
//     tile selection (possibly empty), Phase 2 sends choiceIndex null — an
//     explicit "no answer" the server grades as wrong while its feedback names
//     the real answer. Nothing tapped never earns credit, and timing NEVER
//     changes a verdict: the server grades exactly what was submitted, on time
//     or late (spec §1, §6).

import { useEffect, useRef, useState } from 'react';
import { emitAck } from '../../services/socket.js';
import { Art } from '../../services/assets.jsx';
import VocabText from './VocabText.jsx';

const VERDICT_UI = {
  right: { label: 'Nailed it', className: 'right', icon: '✓' },
  partial: { label: 'Half right', className: 'partial', icon: '≈' },
  wrong: { label: 'Missed it', className: 'wrong', icon: '✗' },
};

export default function MatchView({ state, dispatch }) {
  const { match, matchEnd } = state;
  const { turn, feedback, chapterCard } = match;
  const acts = match.begin?.meta?.chapters || [];

  // The server pushes the NEXT act's chapter:event synchronously with the last
  // action's turn:resolution (spec: chapter events aren't gated on the client
  // dismissing anything) — so a new chapterCard (and a new `turn`) can already be
  // sitting in state while the student is still reading the previous verdict.
  // `dismissedActIndex` tracks the last act actually SHOWN to the student (its
  // card displayed-and-cleared) — the only value safe to drive the timeline and
  // the act-card gate from. Using chapterCard/turn directly would advance the
  // timeline dot, or slam in the next act's card, a beat before the student has
  // actually moved on.
  const chapterIdx = chapterCard?.chapter?.index;
  const [dismissedActIndex, setDismissedActIndex] = useState(-1);
  const showActCard = !feedback && chapterIdx != null && chapterIdx > dismissedActIndex;
  const currentActIndex = Math.max(dismissedActIndex, 0);

  useEffect(() => {
    if (!showActCard) return;
    const t = setTimeout(() => setDismissedActIndex(chapterIdx), 2000);
    return () => clearTimeout(t);
  }, [showActCard, chapterIdx]);

  // Returns the ack so the phase panels can un-busy themselves if the school
  // network eats a submit — otherwise a lost ack would leave the student stuck
  // on a permanently disabled panel. (On success the resolution push replaces
  // the panel anyway, so the retry path only ever runs on failure.)
  function submitMove(move) {
    return emitAck('student:submit_move', { move });
  }

  return (
    <div className="match arcade">
      <header className="match-header arcade-header">
        <TimelineDots acts={acts} currentIndex={currentActIndex} />
        <ResistanceMeter value={match.resistance} combo={match.combo} />
      </header>

      <div className="match-body single">
        <section className="action-panel arcade-panel" aria-live="polite">
          {feedback ? (
            feedback.kind === 'multiSelect' ? (
              <Phase1Verdict
                key={`fb1-${feedback.stepIndex}`}
                feedback={feedback}
                matchEnded={!!matchEnd}
                onContinue={() => dispatch({ type: 'dismiss-feedback' })}
              />
            ) : (
              <Phase2Verdict
                key={`fb2-${feedback.stepIndex}`}
                feedback={feedback}
                matchEnded={!!matchEnd}
                onContinue={() => dispatch({ type: 'dismiss-feedback' })}
              />
            )
          ) : showActCard ? (
            <ActCard chapterCard={chapterCard} onSkip={() => setDismissedActIndex(chapterIdx)} />
          ) : turn?.yourTurn && turn.kind === 'multiSelect' ? (
            <Phase1Grid
              key={`p1-${turn.stepIndex}`}
              turn={turn}
              onSubmit={(choiceIndices) => submitMove({ kind: 'multiSelect', choiceIndices })}
            />
          ) : turn?.yourTurn && turn.kind === 'decision' ? (
            <Phase2List
              key={`p2-${turn.stepIndex}`}
              turn={turn}
              onSubmit={(choiceIndex) => submitMove({ kind: 'decision', choiceIndex })}
            />
          ) : (
            <div className="waiting-panel"><div className="pulse-dot" aria-hidden="true" /><p>Steady…</p></div>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------- header: timeline + Resistance meter -------- */

function TimelineDots({ acts, currentIndex }) {
  if (!acts.length) return null;
  return (
    <div className="timeline-dots" aria-hidden="true">
      {acts.map((a, i) => (
        <div key={i} className={`tdot ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'active' : ''}`}>
          <span className="tdot-mark">{i < currentIndex ? '✓' : ''}</span>
          <span className="tdot-year">{a.year}</span>
        </div>
      ))}
    </div>
  );
}

function ResistanceMeter({ value, combo }) {
  return (
    <div className="resistance-meter" title="Resistance — climbs when you're right. Pure flair, never your grade.">
      <span className="resistance-icon" aria-hidden="true">✊</span>
      <div
        className="resistance-track" role="meter"
        aria-valuenow={value} aria-valuemin="0" aria-valuemax="100"
        aria-label={`Resistance: ${value} of 100`}
      >
        <div className="resistance-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="resistance-value">{value}</span>
      {combo >= 2 && <span className="combo-chip">🔥×{combo}</span>}
    </div>
  );
}

/* -------- the act title card (2s slam, spec §3.2) -------- */

function ActCard({ chapterCard, onSkip }) {
  const { chapter, text } = chapterCard;
  return (
    <div className="act-card" onClick={onSkip} role="button" tabIndex={0}
         onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSkip()}>
      <Art name={chapter.image} alt={chapter.title} className="act-art" />
      <div className="act-card-body">
        <div className="act-year">{chapter.date}</div>
        <h2 className="act-title">{chapter.title}</h2>
        <p className="act-event"><VocabText text={text} /></p>
      </div>
      <p className="act-tap-hint">Tap to begin</p>
    </div>
  );
}

/* -------- timer ring (numeric label too — never color alone) -------- */

function TimerRing({ total, timeLeft }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
  const danger = timeLeft <= 5;
  return (
    <div
      className={`timer-ring ${danger ? 'danger' : ''}`}
      style={{ '--pct': `${pct}%` }}
      role="timer"
      aria-label={`${timeLeft} seconds left`}
    >
      <span className="timer-number">{timeLeft}</span>
    </div>
  );
}

/* -------- Phase 1: "What did it hit?" — multiSelect tile grid -------- */

function Phase1Grid({ turn, onSubmit }) {
  const total = turn.seconds || 25;
  const [timeLeft, setTimeLeft] = useState(total);
  const [selected, setSelected] = useState(() => new Set());
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await onSubmit([...selectedRef.current]);
    if (!res?.ok) { busyRef.current = false; setBusy(false); } // lost ack: let them retry
  }

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(); // auto-submit the current selection — could be empty
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(i) {
    if (busy) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  return (
    <div className="phase-panel phase1-panel">
      <div className="phase-head">
        <TimerRing total={total} timeLeft={timeLeft} />
        <p className="phase-label">Phase 1 — What did it hit?</p>
      </div>
      <p className="phase-prompt"><VocabText text={turn.prompt} /></p>
      <div className="tile-grid">
        {(turn.choices || []).map((c, i) => (
          <button
            key={i}
            type="button"
            className={`tile-btn ${selected.has(i) ? 'selected' : ''}`}
            disabled={busy}
            onClick={() => toggle(i)}
          >
            {c.icon && <span className="tile-icon" aria-hidden="true">{c.icon}</span>}
            <span className="tile-label">{c.label}</span>
          </button>
        ))}
      </div>
      <button className="btn big" disabled={busy} onClick={submit}>Submit</button>
    </div>
  );
}

/* -------- Phase 1 verdict: reveal every tile ✔ / ⚠ / ✗ -------- */

function tileClass(t) {
  if (t.correct && t.picked) return 'tile-right';
  if (t.correct && !t.picked) return 'tile-missed';
  if (!t.correct && t.picked) return 'tile-wrong';
  return 'tile-neutral';
}
function tileMark(t) {
  if (t.correct && t.picked) return '✔';
  if (t.correct && !t.picked) return '⚠';
  if (!t.correct && t.picked) return '✗';
  return '';
}

function Phase1Verdict({ feedback, matchEnded, onContinue }) {
  const v = VERDICT_UI[feedback.verdict] || VERDICT_UI.wrong;
  return (
    <div className="phase-panel verdict-panel">
      <div className={`verdict-badge ${v.className} flash`}>
        <span aria-hidden="true">{v.icon}</span> {v.label}
      </div>
      <div className="tile-grid revealed">
        {(feedback.tiles || []).map((t, i) => (
          <div key={i} className={`tile-btn revealed ${tileClass(t)}`}>
            <span className="tile-mark" aria-hidden="true">{tileMark(t)}</span>
            <span className="tile-label">{t.label}</span>
          </div>
        ))}
      </div>
      <p className="feedback-text"><VocabText text={feedback.feedback} /></p>
      <button className="btn big" onClick={onContinue}>
        {matchEnded ? 'See how it ends' : 'Next: how did they answer?'}
      </button>
    </div>
  );
}

/* -------- Phase 2: "How did colonists answer?" — single choice -------- */

function Phase2List({ turn, onSubmit }) {
  const total = turn.seconds || 20;
  const [timeLeft, setTimeLeft] = useState(total);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  async function choose(choiceIndex) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await onSubmit(choiceIndex);
    if (!res?.ok) { busyRef.current = false; setBusy(false); } // lost ack: let them retry
  }

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          // Nothing picked at 0: submit an explicit "no answer" (null). The
          // server grades it wrong and its feedback names the real answer —
          // nothing tapped never earns credit (spec §1: grade what was tapped).
          choose(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="phase-panel phase2-panel">
      <div className="phase-head">
        <TimerRing total={total} timeLeft={timeLeft} />
        <p className="phase-label">Phase 2 — How did colonists answer?</p>
      </div>
      <p className="phase-prompt"><VocabText text={turn.prompt} /></p>
      {/* Choice labels are plain text — a reply button is the primary tap target,
          so a tappable vocab term never nests inside it. */}
      <div className="choice-list">
        {(turn.choices || []).map((label, i) => (
          <button key={i} className="choice-btn" disabled={busy} onClick={() => choose(i)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------- Phase 2 verdict -------- */

function Phase2Verdict({ feedback, matchEnded, onContinue }) {
  const v = VERDICT_UI[feedback.verdict] || VERDICT_UI.wrong;
  return (
    <div className="phase-panel verdict-panel">
      <div className={`verdict-badge ${v.className} flash`}>
        <span aria-hidden="true">{v.icon}</span> {v.label}
      </div>
      <p className="feedback-text"><VocabText text={feedback.feedback} /></p>
      <button className="btn big" onClick={onContinue}>
        {matchEnded ? 'See how it ends' : 'Next act'}
      </button>
    </div>
  );
}
