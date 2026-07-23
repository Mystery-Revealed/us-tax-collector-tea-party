// ReviewOfMisses.jsx — after Act 5, an UNTIMED, UNGRADED replay of every action
// that scored less than "right" (spec §3.2, §10 checklist). Pure reteach: no
// timer, no combo, and nothing here can change the accuracy already recorded.

import { useState } from 'react';
import VocabText from './VocabText.jsx';

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

export default function ReviewOfMisses({ misses, onDone }) {
  const [i, setI] = useState(0);

  if (!misses.length) { onDone(); return null; }

  const m = misses[i];
  const isLast = i === misses.length - 1;

  return (
    <div className="card review-card">
      <div className="event-kicker">Review of misses · {i + 1} of {misses.length}</div>
      <h2 className="review-title">{m.chapter?.title || 'Recap'}</h2>
      <p className="review-prompt"><VocabText text={m.prompt} /></p>

      {m.kind === 'multiSelect' ? (
        <div className="tile-grid revealed">
          {(m.tiles || []).map((t, idx) => (
            <div key={idx} className={`tile-btn revealed ${tileClass(t)}`}>
              <span className="tile-mark" aria-hidden="true">{tileMark(t)}</span>
              <span className="tile-label">{t.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <ul className="review-choices">
          {(m.choices || []).map((label, idx) => (
            <li key={idx} className="review-choice">{label}</li>
          ))}
        </ul>
      )}

      <p className="feedback-text"><VocabText text={m.feedback} /></p>

      <button className="btn big" onClick={() => (isLast ? onDone() : setI((n) => n + 1))}>
        {isLast ? 'See my results' : 'Next miss'}
      </button>
    </div>
  );
}
