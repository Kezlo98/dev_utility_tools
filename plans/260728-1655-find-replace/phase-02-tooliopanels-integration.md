---
phase: 2
title: "ToolIoPanels Integration"
status: completed
priority: P1
effort: "2.5h"
dependencies: [1]
---

# Phase 2: ToolIoPanels Integration

<!-- Updated: Validation Session 1 - Input-only active scope, passive Output highlighting, and component tests -->

## Overview

Integrate the pure engine into the shared `ToolIoPanels` search UI without changing its public props. Add an opt-in Replace row, bounded regex controls, cyclic Input navigation, passive Output highlighting, accessible controls, and focused interaction tests.

## Requirements

- Functional:
  - Ctrl/Cmd+F opens and focuses the existing Find UI; Esc closes it and clears the query as today.
  - A chevron expands/collapses a Replace row without affecting the default collapsed layout.
  - `Aa` and `.*` toggles recompute matches immediately and expose pressed state.
  - The badge and active index count Input matches only. Output and error text remain passively highlighted but never enter navigation or replacement.
  - Oversized regex Input shows a blocking inline error. Oversized Output skips only passive regex highlighting and does not disable valid Input actions.
  - Enter/Shift+Enter move through Input matches cyclically.
  - Query, case, regex, and manual Input edits reset to the first match. Replace One preserves the deliberate advance-to-next exception.
  - Replace One and Replace All call `onInputChange`; the parent continues to derive Output.
  - Invalid, over-limit, empty-query, and no-match states disable Replace actions.
  - Zero-width matches remain countable/navigable/replaceable but produce no empty `<mark>`.
- Non-functional:
  - `ToolIoPanels` props and all six callers remain unchanged.
  - Icon-only buttons have `type="button"`, accessible labels/titles, visible focus behavior, and appropriate `aria-expanded`/`aria-pressed`.
  - Keep the existing scroll-synchronized backdrop and Tailwind visual language.

## Architecture

`ToolIoPanels` owns query, replacement, visibility, toggle, and active-index state. Memoized engine results are computed separately for Input and passive Output/error text. Input errors control actions; Output over-limit status only suppresses its own highlight.

`SearchableTextarea` receives precomputed match ranges plus an optional active index instead of rebuilding regexes internally. Its renderer emits plain spans and non-empty `<mark>` segments; the Input active match receives stronger styling while Output has no active state.

Use an explicit internal-replace guard/ref or equivalent event-aware state transition so the controlled `input` prop update caused by Replace One advances to the next match, while ordinary text edits and unrelated external Input changes reset to index zero.

## Related Code Files

- Modify: `src/components/tool-io-panels.tsx`
- Create: `src/components/tool-io-panels.test.tsx`
- Consume: `src/lib/find-replace.ts`
- Reference only: the six existing ToolIoPanels callers under `src/tools/`

## Implementation Steps

1. Run GitNexus upstream impact for `ToolIoPanels`, `SearchableTextarea`, `highlightText`, and `countMatches` before editing; warn and stop if any result is HIGH or CRITICAL.
2. Replace inline escape/count/highlight matching with imports and range-based rendering from the Phase 1 engine.
3. Add Replace visibility/value, case, regex, and active-index state plus memoized Input and passive Output results.
4. Implement reset/clamp/wrap transitions and the Replace One advance exception for controlled updates.
5. Add the chevron, toggles, Replace field, Replace/Replace All buttons, current/total Input badge, inline error, and accessible state attributes.
6. Preserve current Ctrl/Cmd+F and Esc behavior; add Enter/Shift+Enter navigation in the Find field.
7. Add RTL/jsdom tests for:
   - open/focus/close and collapsed default state;
   - case and regex toggles;
   - Input-only count with Output passive highlighting;
   - invalid/over-limit Input errors and oversized Output highlight suppression;
   - forward/backward wrap and reset rules;
   - Replace One advance and Replace All controlled updates;
   - zero-width safety and disabled states.
8. Run `npm run test -- src/components/tool-io-panels.test.tsx`.

## Success Criteria

- [x] All six existing callers compile without edits.
- [x] Default Find open/close/highlight behavior remains available.
- [x] Input count/navigation and Output passive highlighting follow the validated scope.
- [x] Replace actions update only Input through `onInputChange`.
- [x] Invalid and over-limit states are readable and non-throwing.
- [x] Controls are keyboard-accessible and expose toggle/expanded state.
- [x] Focused component tests pass.

## Risk Assessment

- Controlled Input updates can race with active-index resets. Test the Replace One transition against a stateful harness, not a static mock callback alone.
- Backdrop text and `<mark>` segmentation must rejoin exactly to the original string or visual alignment drifts.
- Output/error content may change after every replacement; memoize independently and suppress only its own over-limit regex highlight.
