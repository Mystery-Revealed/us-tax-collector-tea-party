# "Tax Collector vs. Tea Party" — Build Specification
### Unit 2 Game · 8th Grade U.S. History · The Revolutionary War

**Purpose:** A build-ready spec to paste into Claude (Fable, Opus, Sonnet) to create the game, deploy on Render via GitHub, and embed in Wix. Shared Socket.IO engine, Teacher Command Center, and standard workflow — this spec covers what's unique.

> **Reading-level rule (everything the student sees):** 8th grade content at a **5th grade reading level**. Short sentences, common words, define hard terms on first use. Does not apply to this spec itself.

> **Data method:** the **shared Socket.IO engine, solo mode** (server-authoritative, in-memory sessions, no database). New adapter: `usTaxCollectorTeaParty.js`. Requires one small engine extension: a **multi-select step type** (flagged for Opus, Section 6).

> **The design's engine:** five British acts, two fast phases each. **Phase 1 — "What did it hit?"**: the act appears and students tap every tile it actually touched before the timer ends (the Tea Act round is deliberately a trick — it added no new tax). **Phase 2 — "How did colonists answer?"**: pick the real response from four. Ten graded actions, a Resistance combo meter for flair, and an automatic review of misses. A six-minute warm-up that kills the unit's biggest misconceptions.

---

## 1. Game at a Glance

| Field | Value |
|---|---|
| **Title** | Tax Collector vs. Tea Party |
| **Unit** | 2 — The Revolutionary War |
| **TEKS** | 8.4A (effects of the Sugar Act, Stamp Act, Townshend Acts, Tea Act, Intolerable Acts), 8.20B (colonial responses as civil disobedience), 8.29B (cause-and-effect analysis) |
| **Pick** | none: one class group |
| **Type** | Solo two-phase arcade knowledge game — 5 acts × 2 phases = **10 graded actions** |
| **Playtime** | 5–7 minutes + auto-review of misses |
| **Platform / tracking** | Shared engine solo mode; Command Center, class-wide accuracy; session-only data |
| **Art style** | Semi-realistic card art in an arcade frame, Union Blue |

**One-sentence pitch: Five British acts fly at you in six minutes — tap what each one really did, then pick how the colonists really hit back, and build a Resistance combo while the game quietly fixes the "Tea Act = new tax" mistake forever.**

**Winning vs. accuracy.** The timer and combo meter are pure adrenaline — **speed and streaks never touch the grade** (Standards: right = 1, partial = 0.5, wrong = 0, server-side). Run out of time and the action simply grades on what was tapped.

## 2. Historical Content Bank

The five acts, from the unit source document. This table is the game's entire factual spine — builder copy comes from here.

| Act | What it actually did | Britain's purpose | Colonists' real response |
|---|---|---|---|
| **Sugar Act (1764)** | **Lowered** the molasses tax but enforced it strictly for the first time; new taxes on wine, coffee, and indigo; smugglers tried in vice-admiralty courts **with no juries** (the twin Currency Act also banned colonial paper money). | Raise revenue for war debt; crush smuggling. | Merchant protests and early boycotts; anger over jury-less trials. |
| **Stamp Act (1765)** | First **direct tax**: paid stamps on nearly all paper — newspapers, legal documents, wills, pamphlets, playing cards, dice. | Raise revenue to support ~10,000 British troops in America. | Riots; **Sons of Liberty** formed; stamp agents quit; the **Stamp Act Congress**; "No taxation without representation!" (James Otis: "taxation without representation is tyranny"). Repealed 1766. |
| **Townshend Acts (1767)** | Import duties on **glass, lead, paint, paper, tea**; revenue paid royal governors' and judges' salaries. | Raise revenue; make officials independent of colonial assemblies (break the "power of the purse"). | Renewed **boycotts** of British goods; protests at the threat to self-government. |
| **Tea Act (1773)** | **No new tax.** Let the East India Company sell tea directly to colonists — cheaper than smuggled Dutch tea — cutting out colonial merchants. | Bail out the struggling East India Company; get colonists to accept the existing tea tax. | Seen as a trap and a monopoly; the **Boston Tea Party** (Dec 16, 1773): 342 chests, 92,000+ lbs, three disciplined hours, decks swept clean after. |
| **Intolerable Acts (1774)** | Closed Boston's port until the tea was paid for; banned most town meetings; sent accused officials to Britain for trial (the "Murder Act"); new Quartering Act. | Punish Massachusetts and make an example of it. | It backfired: relief flowed to Boston and **12 of 13 colonies** sent delegates to the **First Continental Congress** (Sept 1774). |

**Vocabulary (define on first use):** *duty* — a tax on goods coming into a country; *boycott* — refusing to buy as a protest; *monopoly* — one company controls all the selling; *repeal* — cancel a law; *congress* — a formal meeting of representatives.

## 3. Core Mechanics

### 3.1 Meter (client flourish only)
**Resistance** ✊ — 0–100, starts 0 (design demands a fill-up meter, not a midpoint). Right = +10 and a combo spark; partial = +5; wrong = 0 and combo resets. Full meter at game end triggers a harbor-of-tea confetti beat. Never affects the grade.

### 3.2 Round flow
For each act, in chronological order: act title card slams in (2 s) → **Phase 1**: 25-second timer, a 3×2 grid of six tiles, instruction "Tap everything this act really did / taxed" → submit (or timer auto-submits current selection) → verdict + one-line why → **Phase 2**: four response options, 20 seconds → verdict + why. After Act 5: **Review of Misses** — every action graded ⚠️/❌ replays as an untimed flash card (ungraded), then the ending screen.

### 3.3 Grading the multi-select (server-side rules)
Let C = correct tiles, D = decoy tiles tapped. **Right**: all of C, zero D. **Partial**: ≥ half of C and zero D, **or** all of C with exactly one D. **Wrong**: anything else. Phase 2 is a standard single-choice step.

## 4. Reference Content — the Answer Key (all 10 actions)

Phase 1 lists all six tiles (✔ = correct). Feedback lines are Fable voice targets.

### Act 1 — Sugar Act (1764)
**P1 — "Tap what this act taxed or changed":** Molasses — enforced for real now ✔ · Wine ✔ · Coffee ✔ · Newspapers ✗ · Window glass ✗ · Tea ✗
*Feedback:* "Sneaky one — it LOWERED the molasses tax but finally enforced it. Paper and glass come later."
**P2 — "How did colonists answer?"**
- **A) Merchant protests and the first boycotts — plus fury at trials with no juries.** ✅ *"Smugglers now faced judges, never juries. Colonists called that a stolen right."*
- B) They dumped sugar into Boston Harbor. ❌ *"Wrong cargo, wrong decade — tea, 1773."*
- C) They declared independence at once. ❌ *"That's 12 years and many acts away."*
- D) They happily paid — the tax was lower. ❌ *"Lower but ENFORCED — that's what stung."*

### Act 2 — Stamp Act (1765)
**P1 — "Tap what needed a stamp":** Newspapers ✔ · Legal papers & wills ✔ · Playing cards & dice ✔ · Molasses ✗ · Paint ✗ · Tea ✗
*Feedback:* "Paper, paper, paper — even your card games. The first tax colonists couldn't dodge."
**P2 — "How did colonists answer?"**
- **A) Riots, the Sons of Liberty, a Stamp Act Congress — and stamp agents quitting in fear.** ✅ *"'No taxation without representation!' The act died by repeal in 1766. Towns even held mock funerals for Liberty — then declared she still lived."*
- B) A polite letter, then payment. ❌ *"Nine colonies sent delegates to a protest congress. Not polite."*
- C) The Boston Tea Party. ❌ *"Eight years early."*
- D) They stopped using paper. ❌ *"A world without newspapers and wills? Impossible — which is why everyone was furious."*

### Act 3 — Townshend Acts (1767)
**P1 — "Tap what these acts taxed":** Glass ✔ · Lead ✔ · Paint ✔ · Paper ✔ · Tea ✔ · Playing cards ✗
*Feedback:* "Five everyday imports. The sneaky part: the money paid royal governors — so colonial assemblies lost their grip on them."
**P2 — "How did colonists answer?"**
- **A) Boycotts of British goods, again — and louder warnings about self-government.** ✅ *"Hit the wallet, skip the musket. Boycotts were the era's super-weapon." (8.20B)*
- B) They burned every governor's mansion. ❌ *"No — pressure came through purses, not torches."*
- C) They accepted 'outside' taxes as fair. ❌ *"Townshend hoped so. He was wrong."*
- D) They switched entirely to French goods. ❌ *"Homespun and smuggled goods, mostly — not a French pipeline."*

### Act 4 — Tea Act (1773) — **the trick round**
**P1 — "Tap what this act ACTUALLY did":** Let the East India Company sell straight to colonists ✔ · Made taxed tea CHEAPER than smuggled tea ✔ · Cut colonial merchants out of the tea trade ✔ · Added a brand-new tea tax ✗ · Banned all tea ✗ · Closed Boston's port ✗
*Feedback:* "The exam-killer: NO new tax. Cheap legal tea was the bait; accepting Parliament's old tax was the hook."
**P2 — "How did colonists answer?"**
- **A) The Boston Tea Party — 342 chests, 92,000+ pounds, dumped in three disciplined hours.** ✅ *"So orderly they swept the decks and replaced a broken padlock. Civil disobedience, priced today over $1.7 million." (8.20B)*
- B) They bought the cheap tea gratefully. ❌ *"Some wanted to — the Sons of Liberty made sure the principle won."*
- C) They taxed British goods back. ❌ *"Colonies couldn't tax Britain."*
- D) An immediate declaration of war. ❌ *"War is still 16 months off — Lexington, 1775."*

### Act 5 — Intolerable Acts (1774)
**P1 — "Tap everything these acts did":** Closed Boston's port ✔ · Banned most town meetings ✔ · Sent accused officials to Britain for trial ✔ · Forced easier quartering of troops ✔ · Taxed sugar ✗ · Repealed the tea tax ✗
*Feedback:* "Punishment, not taxes — Boston's harbor chained shut and its self-government canceled. Colonists nicknamed the trial rule the 'Murder Act.'"
**P2 — "What happened next?"**
- **A) 12 of 13 colonies sent delegates to the First Continental Congress.** ✅ *"Meant to isolate Massachusetts, the acts united America instead. Only Georgia stayed home."*
- B) Massachusetts paid up and apologized. ❌ *"Relief wagons rolled IN — the colonies fed Boston rather than let it kneel."*
- C) The other colonies abandoned Boston. ❌ *"Opposite: 'an attack on one is an attack on all.'"*
- D) Parliament backed down and repealed everything. ❌ *"No repeal — the next stop is Lexington."*

**Ending screen:** accuracy + Resistance meter state + one line: "Five acts, ten years, one lesson: every time London squeezed, America organized." Replay button.

## 5. Screens & UI Flow
Title (navy arcade marquee `#1B2A4A`, gold act-cards fanned) → join code + name → round loop: act card slam → Phase 1 grid (white tiles on cool paper `#F5F7FA`, selected = steel-blue `#2E74B5` fill, timer ring in gold `#C9A227`) → verdict flash (green `#2F7D4F` / gold / crimson `#B23A48`) → Phase 2 option list → between acts, a mini timeline dot advances 1764→1774 → Review of Misses (untimed, calm styling) → ending. Large tap targets (tiles ≥88px); timer also shown as a number for color-blind safety; icons + labels on every tile. **No tan/parchment UI.**

## 6. Engine Integration
- Adapter `server/src/games/usTaxCollectorTeaParty.js`, `gameId: 'us-tax-collector-tea-party'`, mode solo, variants: none, `totalActions: 10`, meters `{ resistance: 0 }` (client-driven flourish; server may omit meters entirely).
- **Engine extension (Opus):** extend `_stepGame.js` with a `type: 'multiSelect'` step whose choices are tiles and whose submitted payload is an index array; server grades per Section 3.3 and returns the standard `turn:resolution`. Client auto-submits the current selection at timer end. Keep single-choice steps untouched.
- Timers are client-side only (a late payload still grades normally — no speed component). Repo `us-tax-collector-tea-party`.

## 7. Visual & Audio Assets (Higgsfield MCP)
**Art direction (prepend):** *Semi-realistic cinematic historical illustration, colonial America 1764–1774. Cool light, painterly, dignified. No text, no logos. 16:9.*

| # | Asset | Prompt sketch |
|---|---|---|
| 1 | Title / hero | "A colonial customs desk mid-chaos: tax stamps, a toppled tea chest, scattered playing cards, harbor window behind." |
| 2 | Sugar Act card | "Barrels of molasses on a moonlit wharf, a customs officer's lantern approaching." |
| 3 | Stamp Act card | "A printer staring at a stack of newspapers, an official stamp seal looming on the counter." |
| 4 | Townshend card | "A shop shelf of glass, paint pots, paper, and tea tins, each with a small tag." |
| 5 | Tea Act card | "Tea chests stacked on a ship's deck under East India Company colors, Boston beyond." |
| 6 | Intolerable card | "Boston harbor gates chained, redcoats posted, an empty wharf at gray dawn." |
| 7 | Ending | "A long wagon train of relief supplies rolling toward a distant city, morning light." |
| 8 | *(Optional)* SFX | Short stamp-thunk, splash, and combo chime; muted by default. |

## 8. Model Workflow
Standard order, two deltas: **Opus-heavy** on the multiSelect engine extension and its grading rules; **Fable-light** — the bank is small and fully written above, so Fable's job is polishing the 30+ feedback lines to reading level and arcade tone. Sonnet builds the timer ring, combo meter, and review flow; Higgsfield per Section 7.

## 9. Teacher Command Center
Standard, one class group. PDF: Students (Name · Status · Accuracy %) + class accuracy; a per-act accuracy row helps teachers spot which act to reteach (Tea Act will be the low bar — by design). Footer: `Made for 8th Grade U.S. History · TEKS 8.4A, 8.20B, 8.29B`.

## 10. Build Checklist & Test Plan (delta)
- [ ] multiSelect extension graded server-side per Section 3.3; unit tests: all-correct, half-correct, one-decoy, timeout-empty
- [ ] All 5 Phase-1 grids and 5 Phase-2 keys match Section 4 exactly (Tea Act trick verified: "new tax" tile grades as decoy)
- [ ] Combo/timer verified to never alter accuracy; late submit grades normally
- [ ] Review of Misses replays only ⚠️/❌ actions, untimed and ungraded
- [ ] Acts appear in chronological order; timeline dots advance correctly
- [ ] Color-blind pass: selection state readable without color; timer numeric
- [ ] Palette check: gold reserved for timer/combo; zero tan surfaces

## 11. Teacher / Sensitivity Notes
Light topic, light tone — this is the unit's politics-and-economics slot where competition and speed belong (Standards 10.5). Keep protest imagery to boycotts, congresses, and the Tea Party; no tarring-and-feathering content anywhere in copy or art. The Boston Massacre is deliberately out of scope (it lives in The Burning Fuse and Patriot, Loyalist, or Neutral?).

---
*Companion to Patriot, Loyalist, or Neutral?, Washington's War, Spy Ring, and the Unit 2 apps. Shared engine (solo mode), Union Blue palette, same GitHub → Render → Wix workflow.*
