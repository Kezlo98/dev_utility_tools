# Find & Replace Integration Reached the Automated Gate

**Date**: 2026-07-28 22:54 ICT
**Severity**: Medium
**Component**: Shared `ToolIoPanels` find/replace workflow
**Status**: Resolved for automated verification; manual UI smoke pending

## What Happened

Phase 1 delivered the bounded pure engine in `src/lib/find-replace.ts`; Phase 2 connected it to the shared `ToolIoPanels` UI and its six unchanged consumers. The implementation now supports literal and regex search, case matching, cyclic navigation, Replace One, Replace All, zero-width safety, and JavaScript replacement tokens.

## The Brutal Truth

This was more irritating than it should have been. The feature looked like a small toolbar extension, but controlled React updates and regex edge cases made it easy to ship behavior that merely appeared correct. We burned time on failures that tests should have exposed immediately, especially active-match advancement after replacement. The relief is that the final automated gate is clean; the unfinished live smoke check is still a real gap, not paperwork.

## Technical Details

Initial failures covered four weak spots:

- Jest DOM matcher typing was absent, so assertions such as `toHaveFocus()` and `toBeInTheDocument()` failed TypeScript until the test environment typing was corrected.
- Search focus was delayed through `useEffect`, causing the Ctrl/Cmd+F test to race the focus behavior.
- Replace One initially reset or retained the wrong active index instead of advancing to the next surviving match after the controlled `onInputChange` update.
- Highlight rendering used a quadratic lookup pattern; `highlightRanges()` now traverses ordered match ranges once rather than repeatedly searching the collection.

The corrected replacement path records the expected updated input plus `nextOffset` in `replacePendingRef`, then recomputes and selects the first surviving `SearchMatch` at or after that offset. Regex collection enforces the 500-character pattern, 200 KB scanned-input, and 10,000-match caps.

## What We Tried

We first relied on state resets after input changes. That failed because replacement is deliberately different from a manual edit: it must advance. Treating focus as synchronous also failed; the test had to respect React effect timing instead of pretending the DOM updated immediately.

## Root Cause Analysis

We treated search state as if every input update had identical semantics. It does not. Manual editing resets navigation; Replace One must carry intent across the parent-controlled update. The highlight code also optimized for convenience before considering repeated lookup cost.

## Lessons Learned

Model replacement as an explicit transition, not a generic text change. Test focus and controlled-update timing directly. Preserve ordered match ranges and render them in one pass instead of adding hidden quadratic work to every highlight refresh.

## Next Steps

- Owner: implementation maintainer. Run a manual live Find/Replace smoke pass before release, covering JSON plus URL or Hash.
- Verify Ctrl/Cmd+F, Escape, toggles, navigation, Replace One, and Replace All in the desktop UI.
- Do not publish externally; this local journal is the source of truth.

## Validation

- `npm run typecheck`: passed.
- Focused tests: 23/23 passed.
- Full tests: 171/171 passed.
- Lint: 0 errors; pre-existing `src/components/ui/button.tsx:57` `react-refresh/only-export-components` warning remains.
- Production build: passed; existing Vite warning reports a 930.97 kB JavaScript chunk above the 500 kB advisory threshold.
- Manual live UI smoke: pending because the agent-browser CLI was unavailable.

Status: DONE_WITH_CONCERNS
Summary: Phases 1 and 2 are complete and all automated gates pass; live UI validation remains outstanding.
Concerns/Blockers: Agent-browser CLI was unavailable, so no manual in-app smoke test was performed.
