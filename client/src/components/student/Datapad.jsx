// Datapad.jsx — the student game. A small state machine over socket pushes:
// title → how to play → join → (approval) → briefing → match (5 acts × 2 phases)
// → review of misses → result. One class group, no pick, no branch: everyone
// faces the same five acts in order. The server owns every verdict; this
// component only renders what it's told. The Resistance meter and combo streak
// are the one client-computed flourish (spec §3.1) — pure flair, never the grade.

import { useEffect, useReducer, useRef } from 'react';
import { getSocket, emitAck, errorText } from '../../services/socket.js';
import { Art } from '../../services/assets.jsx';
import VocabText from './VocabText.jsx';
import MatchView from './MatchView.jsx';
import ReviewOfMisses from './ReviewOfMisses.jsx';
import ResultScreen from './ResultScreen.jsx';

const SIDE = 'class';

function clamp100(n) { return Math.max(0, Math.min(100, n)); }

const initialState = {
  screen: 'title', // title | how | join | waiting_approval | briefing | match | review | result | ended
  joinCode: '',
  name: '',
  studentId: null,
  error: '',
  endedMessage: '',
  match: null,
  matchEnd: null,
};

// Note: a mid-match reconnect rebuilds this from the server snapshot, which
// resets the client-only flourishes (Resistance/combo) and the miss history —
// so after a wifi blip the Review of Misses only covers post-reconnect actions.
// Accuracy is untouched (server-side); accepted degradation for a 6-minute game.
function freshMatch(begin, chapterEvent = null, turn = null) {
  return {
    begin,
    chapterCard: chapterEvent,
    turn,
    feedback: null,
    resistance: 0,   // client-only flourish (spec §3.1) — never touches the grade
    combo: 0,
    history: [],     // one entry per resolved action, for the Review of Misses
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ui':
      return { ...state, ...action.patch };
    case 'joined':
      return {
        ...state,
        studentId: action.studentId,
        error: '',
        screen: action.approved ? 'briefing' : 'waiting_approval',
      };
    case 'approved':
      return { ...state, screen: state.screen === 'waiting_approval' ? 'briefing' : state.screen };
    case 'match:begin':
      return { ...state, screen: 'match', matchEnd: null, match: freshMatch(action.payload) };
    case 'chapter:event': {
      if (!state.match) return state;
      return { ...state, match: { ...state.match, chapterCard: action.payload } };
    }
    case 'turn:begin': {
      if (!state.match) return state;
      return { ...state, match: { ...state.match, turn: action.payload } };
    }
    case 'turn:resolution': {
      if (!state.match) return state;
      const payload = action.payload;
      const priorTurn = state.match.turn;
      const gain = payload.verdict === 'right' ? 10 : payload.verdict === 'partial' ? 5 : 0;
      const resistance = clamp100(state.match.resistance + gain);
      const combo = payload.verdict === 'wrong' ? 0
        : payload.verdict === 'right' ? state.match.combo + 1
        : state.match.combo;
      const entry = {
        chapter: priorTurn?.chapter || null,
        kind: payload.kind,
        prompt: priorTurn?.prompt || '',
        choices: priorTurn?.choices || [],
        verdict: payload.verdict,
        feedback: payload.feedback,
        tiles: payload.tiles || null,
      };
      return {
        ...state,
        match: {
          ...state.match,
          feedback: payload,
          resistance,
          combo,
          history: [...state.match.history, entry],
        },
      };
    }
    case 'match:end': {
      // Hold the result until the pending feedback is dismissed (chronological).
      const showNow = !state.match?.feedback;
      if (!showNow) return { ...state, matchEnd: action.payload };
      const misses = (state.match?.history || []).filter((h) => h.verdict !== 'right');
      return { ...state, matchEnd: action.payload, screen: misses.length ? 'review' : 'result' };
    }
    case 'dismiss-feedback': {
      if (!state.match) return state;
      if (state.matchEnd) {
        const misses = state.match.history.filter((h) => h.verdict !== 'right');
        return { ...state, screen: misses.length ? 'review' : 'result', match: { ...state.match, feedback: null } };
      }
      return { ...state, match: { ...state.match, feedback: null } };
    }
    case 'review-done':
      return { ...state, screen: 'result' };
    case 'sync': {
      const s = action.sync;
      if (s.screen === 'waiting_approval') return { ...state, screen: 'waiting_approval' };
      if (s.screen === 'lobby') return { ...state, screen: 'briefing' };
      if (s.screen === 'result') return { ...state, screen: 'result', matchEnd: s.matchEnd };
      if (s.screen === 'match') {
        const match = freshMatch(s.matchBegin, s.chapterEvent, s.turn);
        return { ...state, screen: 'match', matchEnd: null, match };
      }
      return state;
    }
    case 'removed':
      return { ...initialState, screen: 'join', joinCode: state.joinCode, name: '', error: 'Your teacher removed you from the session. You can join again.' };
    case 'ended':
      return { ...initialState, screen: 'ended', endedMessage: 'Your teacher ended this session. Thanks for playing!' };
    case 'play-again':
      return { ...initialState, screen: 'join', joinCode: state.joinCode, name: state.name };
    default:
      return state;
  }
}

export default function Datapad() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();
    const on = (event, type) => {
      const fn = (payload) => dispatch({ type, payload });
      socket.on(event, fn);
      return [event, fn];
    };
    const subs = [
      on('match:begin', 'match:begin'),
      on('chapter:event', 'chapter:event'),
      on('turn:begin', 'turn:begin'),
      on('turn:resolution', 'turn:resolution'),
      on('match:end', 'match:end'),
    ];
    const approved = () => dispatch({ type: 'approved' });
    const removed = () => dispatch({ type: 'removed' });
    const ended = () => dispatch({ type: 'ended' });
    socket.on('join:approved', approved);
    socket.on('student:removed', removed);
    socket.on('session:ended', ended);

    // School wifi blip: the socket reconnects → re-attach and re-sync the screen.
    const onReconnect = async () => {
      const s = stateRef.current;
      if (!s.studentId || !s.joinCode) return;
      const res = await emitAck('student:rejoin', { joinCode: s.joinCode, studentId: s.studentId });
      if (res.ok) dispatch({ type: 'sync', sync: res.sync });
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      for (const [event, fn] of subs) socket.off(event, fn);
      socket.off('join:approved', approved);
      socket.off('student:removed', removed);
      socket.off('session:ended', ended);
      socket.io.off('reconnect', onReconnect);
    };
  }, []);

  const { screen } = state;
  return (
    <div className="app student-app">
      {screen === 'title' && <TitleScreen onStart={() => dispatch({ type: 'ui', patch: { screen: 'join' } })} onHow={() => dispatch({ type: 'ui', patch: { screen: 'how' } })} />}
      {screen === 'how' && <HowToPlay onBack={() => dispatch({ type: 'ui', patch: { screen: 'title' } })} />}
      {screen === 'join' && <JoinForm state={state} dispatch={dispatch} />}
      {screen === 'waiting_approval' && (
        <WaitCard title="Hold fast!" text="Your teacher is checking names. You'll start in a moment." />
      )}
      {screen === 'briefing' && (
        <WaitCard
          title="Five acts. Six minutes. Go."
          text="Britain is about to squeeze the colonies five times in ten years. Tap what each act really did, then pick how the colonists really answered. Watch for the trick."
        />
      )}
      {screen === 'match' && state.match && <MatchView state={state} dispatch={dispatch} />}
      {screen === 'review' && state.match && (
        <ReviewOfMisses
          misses={state.match.history.filter((h) => h.verdict !== 'right')}
          onDone={() => dispatch({ type: 'review-done' })}
        />
      )}
      {screen === 'result' && state.matchEnd && <ResultScreen state={state} dispatch={dispatch} />}
      {screen === 'ended' && (
        <WaitCard title="Session ended" text={state.endedMessage}>
          <button className="btn" onClick={() => dispatch({ type: 'ui', patch: { ...initialState, screen: 'title' } })}>
            Back to the title screen
          </button>
        </WaitCard>
      )}
      <footer className="app-footer">Made for 8th Grade U.S. History · TEKS 8.4A, 8.20B, 8.29B</footer>
    </div>
  );
}

/* ---------------- small screens ---------------- */

function TitleScreen({ onStart, onHow }) {
  return (
    <div className="card title-screen">
      <Art name="title_hero.webp" alt="A colonial customs desk mid-chaos: tax stamps, a toppled tea chest, scattered playing cards, a harbor window behind" className="hero-art" />
      <h1 className="game-title">Tax Collector vs. Tea Party</h1>
      <p className="tagline">Five acts. Ten years. One trick question.</p>
      <p className="title-blurb">
        From 1764 to 1774, Britain squeezed the colonies five times — the <b>Sugar,
        Stamp, Townshend, Tea,</b> and <b>Intolerable Acts</b>. Each act: tap
        everything it really did, then pick how the colonists really answered.
        Build your <b>Resistance</b> meter as you go — but speed and streaks never
        touch your grade. Only accuracy does.
      </p>
      <div className="btn-col">
        <button className="btn big" onClick={onStart}>Join your class</button>
        <button className="btn secondary" onClick={onHow}>How to play</button>
      </div>
    </div>
  );
}

function HowToPlay({ onBack }) {
  return (
    <div className="card how-screen">
      <h2>How to play</h2>
      <ol className="how-list">
        <li><b>Join with your class code</b> and your first name.</li>
        <li><b>Phase 1 — What did it hit?</b> A 25-second timer, six tiles. Tap every one the act really taxed or changed.</li>
        <li><b>Phase 2 — How did colonists answer?</b> A 20-second timer, four choices. Pick the real response.</li>
        <li><b>Five acts, ten actions total.</b> Watch for the Tea Act — it's a trick.</li>
      </ol>
      <div className="note">
        <b>Winning versus accuracy.</b> The timer and the Resistance meter are pure
        adrenaline. <b>Speed and streaks never touch your grade</b> — every action
        is graded on what you tapped, whether you finish with 10 seconds left or
        the clock runs out.
      </div>
      <h3>Words to know (tap them in the game)</h3>
      <ul className="how-list vocab-list">
        <li><VocabText text="A duty — a tax on goods coming into a country." /></li>
        <li><VocabText text="A boycott — refusing to buy something as a protest." /></li>
        <li><VocabText text="A monopoly — one company controls all the selling." /></li>
        <li><VocabText text="To repeal a law — to cancel it." /></li>
        <li><VocabText text="A congress — a formal meeting of representatives." /></li>
      </ul>
      <button className="btn" onClick={onBack}>Back</button>
    </div>
  );
}

function JoinForm({ state, dispatch }) {
  const set = (patch) => dispatch({ type: 'ui', patch });
  const busyRef = useRef(false);

  async function join() {
    if (busyRef.current) return;
    busyRef.current = true;
    set({ error: '' });
    const res = await emitAck('student:join', {
      joinCode: state.joinCode.trim(),
      nickname: state.name.trim(),
      mode: 'solo',
      nation: SIDE,
    });
    busyRef.current = false;
    if (!res.ok) return set({ error: errorText(res.error) });
    dispatch({ type: 'joined', studentId: res.studentId, approved: res.approved });
  }

  const ready = state.joinCode.length === 6 && state.name.trim().length >= 2;

  return (
    <div className="card join-screen">
      <h2>Join your class</h2>
      <p className="muted">Five British acts are about to fly at you. Ready?</p>
      <label htmlFor="join-code">Class code</label>
      <input
        id="join-code" inputMode="numeric" autoComplete="off" maxLength={6}
        placeholder="6-digit code" value={state.joinCode}
        onChange={(e) => set({ joinCode: e.target.value.replace(/\D/g, '') })}
      />
      <label htmlFor="join-name">Your first name</label>
      <input
        id="join-name" maxLength={20} placeholder="e.g. Ana R." value={state.name}
        onChange={(e) => set({ name: e.target.value })}
      />

      <p className="err" role="alert">{state.error}</p>
      <div className="btn-col">
        <button className="btn big" disabled={!ready} onClick={join}>Start the clock</button>
        <button className="btn ghost" onClick={() => set({ screen: 'title', error: '' })}>Back</button>
      </div>
    </div>
  );
}

function WaitCard({ title, text, children }) {
  return (
    <div className="card wait-card">
      <div className="pulse-dot" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
