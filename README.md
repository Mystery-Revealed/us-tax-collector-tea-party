# Tax Collector vs. Tea Party

**Unit 2 · 8th Grade U.S. History · TEKS 8.4A, 8.20B, 8.29B**

Five British acts fly at you in six minutes — the **Sugar, Stamp, Townshend,
Tea,** and **Intolerable Acts** (1764–1774). Each act is two fast phases:
**Phase 1 — "What did it hit?"** tap every tile it actually touched from a
3×2 grid (the Tea Act is a deliberate trick — it added no new tax). **Phase 2
— "How did colonists answer?"** pick the real response from four. Ten graded
actions, a client-only Resistance combo meter for flair, and an automatic
review of misses at the end.

**Winning vs. accuracy.** The timer and combo meter are pure adrenaline —
**speed and streaks never touch the grade** (right = 1, partial = 0.5, wrong
= 0, server-side). Run out of time and the action simply grades on what was
tapped.

Built on the shared U.S. History Socket.IO engine (server-authoritative, solo
mode), extended with one new step kind: **`multiSelect`** — a tap-many tile
grid graded server-side per this game's rules (all of C + zero D = right; ≥
half of C + zero D, or all of C + exactly one D = partial; else wrong). The
engine extension lives in `server/src/games/_stepGame.js` and is generic —
any future game can use the same step kind.

## Run it

```bash
npm install        # installs server/ and client/ via postinstall
npm test           # server test suite (multiSelect grading + engine lifecycle)
npm run build      # builds the React client into client/dist
npm start          # serves game + Teacher Command Center on :4000
```

- Student game: `http://localhost:4000`
- Teacher Command Center: `http://localhost:4000/#teacher`

## What's specific to this game

- **Adapter:** `server/src/games/usTaxCollectorTeaParty.js` — five acts,
  transcribed verbatim from the build spec's answer key. One class group, no
  variants, no branch, no map, **no server meters** — the Resistance meter is
  a pure client flourish.
- **The multiSelect grading rule (§3.3):** let C = correct tiles, D = decoy
  tiles tapped. Right = all of C, zero D. Partial = ≥ half of C with zero D,
  or all of C with exactly one D. Wrong = anything else, including an empty
  (timed-out) submission.
- **The Tea Act trick round:** the "brand-new tea tax" tile is a decoy — the
  act added no new tax, it just made the *existing* tax easier to swallow via
  a cheaper, East-India-Company monopoly. Tapping all three real effects plus
  that trap tile still grades as partial, never right.
- **Accuracy is the grade.** Endings tier by accuracy: **Resistance
  Organized** (≥80%) / **The Fuse Is Lit** (50–79%) / **Run It Back** (<50%).
- **Review of Misses:** after Act 5, every action graded worse than "right"
  replays untimed and ungraded — a straight reteach, no pressure.
- **Vocabulary bubbles:** the five required terms (duty, boycott, monopoly,
  repeal, congress) are underlined on first use with a tap-for-plain-words
  bubble.
- **Per-act Command Center row:** class-wide accuracy broken out by act, so a
  teacher can spot which one to reteach — the Tea Act is the expected low bar.

## Sensitivity (spec §11)

Light topic, light tone — this is the unit's politics-and-economics slot
where competition and speed belong. Protest imagery stays to boycotts,
congresses, and the Tea Party; no tarring-and-feathering content. The Boston
Massacre is deliberately out of scope (it lives in *The Burning Fuse* and
*Patriot, Loyalist, or Neutral?*).

Session data lives in server memory only; the teacher's PDF is the only
record that survives. Deploy shape: one Render web service (see
`render.yaml`), embedded in Wix — same workflow as the companion U.S. History
games.

*Companion to Patriot, Loyalist, or Neutral?, Washington's War, Spy Ring, and
the Unit 2 apps.*
