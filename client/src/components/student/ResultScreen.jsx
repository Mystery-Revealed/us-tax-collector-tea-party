// ResultScreen.jsx — accuracy + ending tier + the Resistance meter's final state
// (a client flourish shown alongside, never the grade) + the closing lesson line,
// same for every tier. A full meter triggers a small harbor-of-tea confetti beat.

import { Art } from '../../services/assets.jsx';

const TIER_CLASS = { organized: 'win', fuse: 'mid', review: 'low' };

export default function ResultScreen({ state, dispatch }) {
  const end = state.matchEnd;
  const you = end.you;
  const ending = you.ending;
  const accuracy = you.accuracy ?? 0;
  const tierCls = TIER_CLASS[ending.key] || 'mid';
  const resistance = state.match?.resistance ?? 0;
  const fullMeter = resistance >= 100;

  return (
    <div className="card result-screen">
      <div className="event-kicker">Five acts · 1764–1774</div>
      <h1 className={`result-headline ${tierCls}`}>{ending.title}</h1>

      <Art
        name="act_ending.webp"
        alt="A long wagon train of relief supplies rolling toward a distant city, morning light"
        className="result-art"
      />

      {fullMeter && <div className="confetti-beat" aria-hidden="true">🫖 🎉 🫖 🎉 🫖</div>}

      <div className="resistance-final">
        <span aria-hidden="true">✊</span> Resistance reached <b>{resistance}</b> of 100 — pure flair, never your grade.
      </div>

      <div className={`ending-block ${tierCls}`}>
        <p>{ending.text}</p>
      </div>

      <div className="accuracy-block">
        <div className="accuracy-number">{accuracy}%</div>
        <div>
          <b>Your accuracy — the score your teacher sees.</b>
          <p>Speed and streaks never touched this number. It's exactly how many of your ten actions carried the real history.</p>
        </div>
      </div>

      <div className="debrief">
        <h3>The lesson</h3>
        <p>{you.debrief}</p>
      </div>

      <div className="btn-col">
        <button className="btn big" onClick={() => dispatch({ type: 'play-again' })}>
          Play again
        </button>
      </div>
    </div>
  );
}
