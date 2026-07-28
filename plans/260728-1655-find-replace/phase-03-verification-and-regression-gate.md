---
phase: 3
title: "Verification and Regression Gate"
status: in-progress
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Verification and Regression Gate

<!-- Updated: Validation Session 1 - focused/full gates and acceptance trace -->

## Overview

Run focused and repository-wide quality gates, inspect GitNexus change impact, and manually trace every validated behavior across the shared component before implementation is considered complete.

## Requirements

- Functional:
  - Exercise literal, case-sensitive, regex, invalid, over-limit, zero-width, Replace One, Replace All, and cyclic navigation behavior.
  - Confirm all six ToolIoPanels-backed tools still derive Output after Input replacement.
  - Confirm Output/error highlighting remains passive and an oversized Output does not block valid Input replacement.
- Non-functional:
  - No ignored test, type, lint, console, accessibility, or GitNexus scope failures.
  - No per-tool edits unless verification proves the unchanged shared prop contract insufficient.

## Architecture

Verification proceeds from narrow to broad: helper tests, component tests, full Vitest, TypeScript, ESLint, then manual acceptance tracing. GitNexus change detection is the final scope check before any commit, as required by repository instructions.

## Related Code Files

- Verify: `src/lib/find-replace.ts`
- Verify: `src/lib/find-replace.test.ts`
- Verify: `src/components/tool-io-panels.tsx`
- Verify: `src/components/tool-io-panels.test.tsx`
- Reference only: six existing ToolIoPanels callers and `tests/smoke/tool-registry.test.tsx`

## Implementation Steps

1. Run focused tests:
   - `npm run test -- src/lib/find-replace.test.ts`
   - `npm run test -- src/components/tool-io-panels.test.tsx`
2. Run full gates:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
3. Manually trace acceptance criteria in at least one formatter and one encoder/hash tool:
   - collapsed Find and Ctrl/Cmd+F/Esc;
   - Input-only current/total count with passive Output/error highlights;
   - case and regex toggle recomputation;
   - invalid pattern, pattern length, Input length, match limit, and oversized Output behavior;
   - Enter/Shift+Enter cyclic wrap and reset rules;
   - Replace One advance and Replace All;
   - zero-width patterns and JavaScript replacement tokens.
4. Confirm no runtime console errors and keyboard focus states/ARIA attributes are present.
5. Run `gitnexus_detect_changes({scope: "all"})`; reconcile every changed symbol and affected flow with this plan.
6. Re-run the six-caller search and confirm no public prop changes or caller edits were introduced.

## Success Criteria

- [x] Focused helper and component suites pass.
- [x] Typecheck, lint, and full Vitest pass without ignored failures.
- [ ] Every acceptance criterion has a manual pass result.
- [x] All six tools retain derived Output behavior after replacement.
- [x] GitNexus reports only expected symbols/flows and all d=1 dependents are accounted for.
- [x] No evergreen documentation claims require an update; if discovery proves otherwise, update the smallest owning document.

## Risk Assessment

- jsdom cannot prove pixel-perfect backdrop alignment or native desktop shortcut behavior. Keep a short manual Tauri/WebView pass.
- Regex backtracking cannot be safely timeout-cancelled on the main thread in this scope. Verify caps and document that they bound input size rather than guarantee execution time.
- A passing registry smoke test proves mount safety only; interaction tests and manual checks remain mandatory.
