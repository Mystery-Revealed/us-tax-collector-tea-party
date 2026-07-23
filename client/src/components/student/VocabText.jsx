// VocabText.jsx — the tap-for-plain-words vocabulary layer (spec §2). The five
// required terms — duty, boycott, monopoly, repeal, congress — are underlined and
// tappable wherever they appear; tapping reveals a 5th-grade-level definition.
//
// It underlines the FIRST occurrence of each distinct term within a given block of
// text (a plain, render-stable rule — no cross-render state to glitch). A term
// that returns in a later act is underlined again, which only reinforces it.

import { useState } from 'react';

// Plain-words definitions (spec §2), at a 5th grade reading level.
export const VOCAB = {
  duty:      { term: 'duty',      def: 'A tax on goods coming into a country.' },
  boycott:   { term: 'boycott',   def: 'Refusing to buy something as a protest.' },
  monopoly:  { term: 'monopoly',  def: 'One company controls all the selling — no one else is allowed to compete.' },
  repeal:    { term: 'repeal',    def: 'To cancel a law.' },
  congress:  { term: 'congress',  def: 'A formal meeting of representatives, sent to speak for their colonies.' },
};

const PATTERNS = [
  { key: 'duty',     re: /duty|duties/i },
  { key: 'boycott',  re: /boycotts?/i },
  { key: 'monopoly', re: /monopoly|monopolies/i },
  { key: 'repeal',   re: /repeal(?:ed)?/i },
  { key: 'congress', re: /congress/i },
];

const COMBINED = new RegExp(PATTERNS.map((p) => `(?:${p.re.source})`).join('|'), 'gi');

function keyForMatch(matched) {
  const lower = matched.toLowerCase();
  if (lower.startsWith('duty') || lower.startsWith('duties')) return 'duty';
  if (lower.startsWith('boycott')) return 'boycott';
  if (lower.startsWith('monopol')) return 'monopoly';
  if (lower.startsWith('repeal')) return 'repeal';
  if (lower.startsWith('congress')) return 'congress';
  return null;
}

export default function VocabText({ text, className }) {
  if (!text) return null;
  const nodes = [];
  const usedKeys = new Set();
  let last = 0;
  let m;
  COMBINED.lastIndex = 0;
  while ((m = COMBINED.exec(text)) !== null) {
    const matched = m[0];
    const key = keyForMatch(matched);
    // Only the first occurrence of each distinct term in this block is a bubble.
    if (key && !usedKeys.has(key)) {
      usedKeys.add(key);
      if (m.index > last) nodes.push(text.slice(last, m.index));
      nodes.push(<VocabBubble key={`${key}-${m.index}`} matched={matched} entry={VOCAB[key]} />);
      last = m.index + matched.length;
    }
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className={className}>{nodes}</span>;
}

function VocabBubble({ matched, entry }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="vocab-wrap">
      <button
        type="button"
        className="vocab-term"
        aria-expanded={open}
        title={entry.def}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        {matched}
      </button>
      {open && (
        <span className="vocab-bubble" role="tooltip">
          <b>{entry.term}</b> — {entry.def}
          <button type="button" className="vocab-close" aria-label="Close" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>×</button>
        </span>
      )}
    </span>
  );
}
