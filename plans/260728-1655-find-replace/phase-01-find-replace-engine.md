---
phase: 1
title: "Find/Replace Engine"
status: completed
priority: P1
effort: "2.5h"
dependencies: []
---

# Phase 1: Find/Replace Engine

<!-- Updated: Validation Session 1 - bounded regex, zero-width, and JavaScript replacement-token contracts -->

## Overview

Create the pure TypeScript engine used by `ToolIoPanels` for literal and regex matching, navigation, Replace, and Replace All. Keep DOM and React state out of this module so edge cases are deterministic and exhaustively testable.

## Requirements

- Functional:
  - Literal mode escapes regex metacharacters, honors the case toggle, and treats replacement text literally.
  - Regex mode compiles only `g` plus optional `i`; it does not add implicit multiline or dot-all flags.
  - Compile and match operations return structured results that distinguish empty query, invalid pattern, over-limit input, and valid zero-match input.
  - Regex mode enforces `MAX_PATTERN_LEN = 500`, `MAX_TEST_LEN = 200 * 1024`, and `MAX_MATCHES = 10_000`. Literal mode remains uncapped.
  - Match metadata retains start/end offsets, full match text, captures, named groups, and original input context needed for JavaScript replacement tokens.
  - Zero-width matches advance the regex cursor explicitly; collection never loops at the same offset.
  - Navigation helpers normalize and move an active index cyclically.
  - Replace One expands JavaScript tokens (`$$`, `$&`, `$1`-`$99`, `$<name>`, ``$` ``, `$'`) from full match context. Replace All uses equivalent native JavaScript regex semantics.
- Non-functional:
  - Synchronous, side-effect-free helpers only.
  - No new dependency; use platform `RegExp` and string APIs.
  - Types must make error and over-limit states explicit instead of using a single ambiguous `null`.

## Architecture

`compileSearch(query, options)` returns a discriminated result containing either a global `RegExp`, an empty-query state, or a readable compile/limit error. `collectMatches(text, compiled, limits)` returns match metadata plus a limit error when an additional match proves the 10,000 ceiling was exceeded. It must reset or clone regex state so callers never depend on a mutated `lastIndex`.

`replaceOne(text, match, replacement, useRegex)` uses the selected match metadata to expand standard JavaScript replacement tokens without re-running the pattern against an isolated substring; this preserves lookaround and surrounding-context semantics. `replaceAll` uses a fresh global regex and passes a function replacement in literal mode so `$` sequences stay literal.

Keep cap values local to this feature but numerically aligned with `src/tools/text/regex/regex.ts`; importing from a tool module would invert the `lib` dependency boundary. A future shared-regex extraction remains out of scope.

## Related Code Files

- Create: `src/lib/find-replace.ts`
- Create: `src/lib/find-replace.test.ts`
- Reference only: `src/tools/text/regex/regex.ts`

## Implementation Steps

1. Define option, match, compile-result, and collection-result types plus the three validated regex limits.
2. Implement literal escaping and structured compilation for empty, literal, valid regex, invalid regex, and overlong pattern cases.
3. Implement bounded match collection with cloned/reset regex state, zero-width forward progress, capture/named-group metadata, and overflow detection.
4. Implement cyclic index normalization and previous/next movement.
5. Implement literal Replace One/All and regex Replace One/All with complete JavaScript replacement-token expansion.
6. Add focused tests for:
   - literal metacharacters and case sensitivity;
   - invalid patterns and all three regex limits;
   - no matches, adjacent matches, and overlapping-looking patterns;
   - zero-width patterns at start, middle, end, and empty input;
   - cyclic index behavior;
   - numeric/named/unmatched groups and every supported `$` token;
   - lookaround-sensitive Replace One and literal `$` preservation.
7. Run `npm run test -- src/lib/find-replace.test.ts`.

## Success Criteria

- [x] Empty query and invalid regex produce distinguishable typed results.
- [x] Regex work is bounded by the agreed pattern, input, and match limits.
- [x] Zero-width patterns terminate and retain correct offsets.
- [x] Replace One and Replace All match JavaScript replacement-token behavior in regex mode.
- [x] Literal replacement never expands `$` tokens.
- [x] Focused helper tests pass.

## Risk Assessment

- Manual token expansion can drift from JavaScript behavior. Mitigate with table-driven equivalence tests against native `String.replace`.
- A 10,000-match ceiling must not cause partial Replace All. Detect overflow and return an error before mutation.
- Regex caps reduce but cannot eliminate catastrophic backtracking. Regex remains local, explicit, bounded by input length, and documented as synchronous.
