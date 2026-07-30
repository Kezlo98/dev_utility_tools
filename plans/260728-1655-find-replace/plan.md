---
title: "Find & Replace in ToolIoPanels"
description: "Add bounded literal and regex find/replace to the shared ToolIoPanels input editor, with capture-token replacement, cyclic navigation, and focused regression tests."
status: completed
priority: P2
effort: "6h"
branch: "master"
tags: [react, typescript, find-replace, regex, testing]
blockedBy: []
blocks: []
created: 2026-07-28
---

# Find & Replace in ToolIoPanels

## Outcome
Add Find & Replace (replace one + replace all, case-sensitive toggle, regex toggle) to the existing Find bar in `ToolIoPanels`, so all 6 tools using it (json, xml, yaml, sql, url, hash) get find/replace in their text editors.

## Constraints
- Replace acts on the **Input** pane only (editable). Output pane is derived/read-only — find still highlights it, but it's not replaceable.
- Preserve existing Ctrl/Cmd+F, Esc, and two-pane highlighting when the replace row is hidden. Match count and active-match navigation intentionally use Input only; Output highlighting is passive.
- Keep change to the shared component so all 6 tools inherit it. No per-tool edits.
- Follow repo conventions: pure logic in `src/lib/*.ts` + `src/lib/*.test.ts`; Tailwind + lucide-react + Radix for UI.
- YAGNI/KISS: no find history, no multi-file, no per-tool config.

## Non-goals
- Wiring find/replace into the 9 bespoke tools (case, regex, diff, base64, jwt, bcrypt, qr, uuid, crontab) — explicit deferral (user chose ToolIoPanels-only scope).
- Persisting find/replace settings across sessions.
- Scroll-to-match (may add later if needed).

## Acceptance criteria
1. Find bar gains a chevron to expand a **Replace** input row.
2. **Aa** (case-sensitive) and **.* (Regex)** toggle buttons immediately recompute Input count, navigation, and both panes' highlights.
3. Invalid or over-limit regex input shows an inline error and disables Replace actions without throwing. Regex mode uses the existing regex tool's limits: 500-character pattern, 200 KB Input, and 10,000 matches; literal mode remains uncapped. An oversized Output skips passive regex highlighting without disabling valid Input replacement.
4. Input matches have cyclic Enter/Shift+Enter navigation. Query, toggle, and manual Input changes reset to the first match; Replace is the deliberate exception and advances to the next surviving match.
5. **Replace** replaces the active Input match and advances cyclically. **Replace All** replaces every Input match through `onInputChange`; derived Output recomputes and the Input count updates.
6. Regex replacement uses JavaScript replacement tokens, including `$$`, `$&`, `$1`-`$99`, `$<name>`, ``$` ``, and `$'`.
7. Zero-width matches are advanced safely, counted, navigable, and replaceable with JavaScript semantics; they are omitted from visual `<mark>` ranges because they consume no characters.
8. Existing Ctrl/Cmd+F, Esc, and two-pane match highlighting remain available when Replace is collapsed; the badge and active-match navigation intentionally scope to Input.
9. `npm run typecheck`, `npm run lint`, and `npm run test` pass. Pure helper tests and focused `ToolIoPanels` interaction tests cover the new contracts.

## Files
- **NEW** `src/lib/find-replace.ts` — pure engine with structured build/collection results, bounded regex validation, zero-width advancement, match metadata, JavaScript replacement-token expansion for Replace One, and native-compatible Replace All behavior.
- **NEW** `src/lib/find-replace.test.ts` — unit tests for literal/regex/case/invalid/limits/zero-width/cyclic navigation and JavaScript replacement tokens.
- **EDIT** `src/components/tool-io-panels.tsx`:
  - Remove inline `escapeRegExp`/`highlightText`/`countMatches`; import from `find-replace` lib.
  - Add state: `replaceValue`, `showReplace`, `caseSensitive`, `useRegex`, `currentIndex`.
  - Add toggle buttons (Aa, .*) + chevron expand + Replace / Replace All buttons.
  - Rewrite backdrop highlight to range-based (`highlightRanges`) so regex works and the active match renders in a stronger color.
  - Keyboard: in find field `Enter`=next, `Shift+Enter`=prev; replace actions via buttons.
  - Input match badge/navigation reflect the replaceable set; Output remains passively highlighted.
- **NEW** `src/components/tool-io-panels.test.tsx` — RTL/jsdom interaction coverage for open/close, toggles, errors, navigation, Replace, Replace All, and disabled states.
- Icons from lucide-react (all confirmed present): `CaseSensitive`, `Regex`, `ChevronDown`, `ArrowRight` (replace one), `ReplaceAll`.

## Impact analysis
- `gitnexus_impact` on `ToolIoPanels` (upstream): **LOW**, 0 callers. The 6 tool files are JSX render sites, not call-graph dependents — signature of `ToolIoPanels` props is unchanged, so they need no edits.
- Moving `escapeRegExp`/`highlightText`/`countMatches` out of the file: they are file-local (no external imports). Safe.

## Phases

| # | Phase | Status | Depends on |
|---|-------|--------|------------|
| 1 | [Find/Replace Engine](./phase-01-find-replace-engine.md) | Completed | — |
| 2 | [ToolIoPanels Integration](./phase-02-tooliopanels-integration.md) | Completed | Phase 1 |
| 3 | [Verification and Regression Gate](./phase-03-verification-and-regression-gate.md) | Completed | Phase 2 |

## Risk / Rollback
- Risk: synchronous JavaScript regex can freeze on catastrophic backtracking. Mitigation: regex is opt-in and limited to a 500-character pattern and 200 KB per scanned pane, with a 10,000-match ceiling. Literal search remains uncapped; oversized Output skips passive highlighting without blocking Input actions.
- Risk: zero-width matches have no visible width. Mitigation: include them in count/navigation/replacement, skip only their visual mark, and test forward progress explicitly.
- Risk: JavaScript replacement tokens are easy to implement incorrectly for Replace One. Mitigation: carry full `RegExpExecArray`-equivalent metadata and test all supported token forms, surrounding-context tokens, unmatched groups, and named groups.
- Rollback: revert the single edited component and delete the three new test/utility files. No schema, migration, or public prop-contract changes.

## Validation Log

### Session 1 — 2026-07-28
**Trigger:** `/ak:plan validate plans/260728-1655-find-replace/`
**Questions asked:** 8

### Initial Verification Results (Pre-Correction)
- **Tier:** Standard (3 intended phases; canonical phase files were missing at check time)
- **Claims checked:** 30
- **Verified:** 25 | **Failed:** 3 | **Unverified:** 2

#### Verified evidence
- `ToolIoPanels` exists at `src/components/tool-io-panels.tsx:144` and has the documented controlled `input`, `onInputChange`, `output`, and read-only output behavior.
- Exactly six tools render `ToolIoPanels`: JSON, XML, YAML, SQL, URL, and Hash.
- Current search highlights Input and Output and counts both panes at `src/components/tool-io-panels.tsx:185-190`.
- `npm run typecheck`, `npm run lint`, and `npm run test` exist.
- Vitest uses jsdom and React Testing Library is installed, so focused component interaction tests are supported.
- The planned Lucide exports (`CaseSensitive`, `Regex`, `ChevronDown`, `ArrowRight`, `ReplaceAll`) exist in the installed package.
- GitNexus impact for `ToolIoPanels` is LOW with zero indexed upstream callers; manual JSX search confirms six render sites with an unchanged prop contract.

#### Initial Failures (Resolved)
1. [Structure] `plan.md` has no YAML frontmatter title; `ak plan validate` rejects it.
2. [Structure] The directory has no `phase-NN-*.md` files; `ak plan validate` rejects it.
3. [Consistency] “Preserve existing ... match count” conflicts with the later decision that the badge should count Input only.

#### Initial Unverified Contracts (Resolved)
1. [Contract] `buildRegex(...) => RegExp | null` does not specify how the UI distinguishes an empty query from an invalid regex, while `applyReplacement(match, replacement, useRegex)` does not define enough match context to guarantee capture-token replacement.
2. [Risk] “Inputs are developer text (small)” is not enforced. The existing regex tool already uses a zero-width guard, a 500-character pattern cap, and a 10,000-match cap, but this plan does not define equivalent limits.

#### Questions & Answers

1. **[Structure]** How should the structurally invalid plan be normalized?
   - Options: Canonical 3 phases (Recommended) | Single phase | Keep draft only
   - **Answer:** Canonical 3 phases
   - **Rationale:** Restores the repository's executable plan contract while keeping engine, UI, and verification ownership explicit.

2. **[Scope]** What should match navigation and the badge count when Output remains highlight-only?
   - Options: Input only (Recommended) | Both panels | Contextual scope
   - **Answer:** Input only
   - **Rationale:** Keeps count, active index, and replace actions aligned to the editable match set; Output highlighting remains useful but passive.

3. **[Risks]** How should regexes that can produce zero-width matches, such as `^`, `\b`, or `a*`, behave?
   - Options: Safe full support (Recommended) | Find only | Reject pattern
   - **Answer:** Safe full support
   - **Rationale:** Preserves standard regex usefulness while requiring explicit forward progress and omitting only impossible-to-render zero-width marks.

4. **[Contract]** In regex mode, how should replacement text interpret `$` tokens?
   - Options: JavaScript tokens (Recommended) | Capture groups only | Always literal
   - **Answer:** JavaScript tokens
   - **Rationale:** Matches the platform's `String.replace` contract and the plan's intended backreference coverage.

5. **[Risks]** What guardrails should regex mode use against very large or pathological searches?
   - Options: Reuse existing caps (Recommended) | Match cap only | No hard caps
   - **Answer:** Reuse existing caps
   - **Rationale:** Aligns with the existing regex tool: 500-character pattern, 200 KB input, and 10,000 matches; literal search remains uncapped.

6. **[Testing]** Should the plan add focused `ToolIoPanels` interaction tests in addition to pure helper tests?
   - Options: Add component tests (Recommended) | Helpers plus smoke | Helpers only
   - **Answer:** Add component tests
   - **Rationale:** Existing RTL/jsdom tooling can directly protect keyboard, toggle, error, and controlled-update behavior that helper tests cannot cover.

7. **[Navigation]** How should the active Input match behave after the query, toggles, or source text changes?
   - Options: Reset then wrap (Recommended) | Preserve nearest | Stop at ends
   - **Answer:** Reset then wrap
   - **Rationale:** Predictable cyclic navigation needs minimal state; Replace advances rather than resetting so the command remains useful.

8. **[Risks]** If Input is within the regex limit but derived Output exceeds 200 KB, what should happen?
   - Options: Skip Output highlight (Recommended) | Disable regex mode | Scan Output anyway
   - **Answer:** Skip Output highlight
   - **Rationale:** Output is read-only and passive; its size must not block valid Input replacement or expose the UI to an avoidable large-regex scan.

#### Confirmed Decisions
- Structure: canonical frontmatter plus three phase files.
- Find scope: Input-only count and active navigation; passive Output highlighting.
- Regex semantics: safe zero-width support with existing regex-tool caps.
- Replacement semantics: JavaScript replacement tokens in regex mode; literal replacement in literal mode.
- Navigation: reset to first after search-affecting changes, cyclic wrap, Replace advances.
- Oversized Output: skip passive regex highlighting while keeping valid Input operations enabled.
- Tests: pure engine tests plus focused `ToolIoPanels` interaction tests.

#### Action Items
- [x] Add canonical plan frontmatter and phase links.
- [x] Reconcile match-count scope throughout the plan.
- [x] Replace ambiguous helper signatures with structured result and match-metadata requirements.
- [x] Add regex limits, zero-width semantics, JavaScript token coverage, and component regression tests.
- [x] Create and populate the three canonical phase files.

#### Impact on Phases
- Phase 1: define bounded matching and replacement contracts, including zero-width progress and JavaScript replacement tokens.
- Phase 2: scope active navigation/counting to Input, keep passive Output highlighting, and add interaction tests.
- Phase 3: enforce focused and full quality gates plus manual acceptance checks.

### Post-Propagation Verification Results
- **Tier:** Standard
- **Claims checked:** 36
- **Verified:** 36 | **Failed:** 0 | **Unverified:** 0
- `ak plan validate plans/260728-1655-find-replace --json` returns `valid: true`.
- Canonical frontmatter and all three linked phase files exist and parse successfully.
- Match scope is consistently Input-only for count/navigation/replacement and passive for Output/error highlighting.
- Empty query, invalid regex, over-limit regex, and valid no-match states are explicitly separated by the Phase 1 contract.
- JavaScript replacement-token metadata and tests are explicit for Replace One and Replace All.
- Regex limits and oversized-Output behavior are consistent across the overview, engine, UI, tests, and risk notes.
- Focused helper and component tests plus full quality gates are assigned to phases.

### Whole-Plan Consistency Sweep
- Files reread: `plan.md`, `phase-01-find-replace-engine.md`, `phase-02-tooliopanels-integration.md`, `phase-03-verification-and-regression-gate.md`
- Decision deltas checked: 8
- Reconciled stale references: 6 (structure, match scope, helper result contract, replacement tokens, regex limits, oversized Output)
- Unresolved contradictions: 0
