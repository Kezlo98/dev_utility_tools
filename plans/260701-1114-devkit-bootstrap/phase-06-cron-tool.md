---
phase: 6
title: "Cron Tool"
status: done
effort: "S"
---

# Phase 6: Cron Tool

## Overview

Single tool: parse and explain a cron expression, preview next N run times, and validate crontab-style input. JS-only, no Rust needed.

## Requirements

- Accept standard 5-field cron (minute hour day month day-of-week)
- Accept 6-field (with seconds) as an optional mode
- Human-readable description ("At 9:00 AM, on the first day of the month")
- Preview next 10 executions in a chosen timezone (default: system tz)
- Validate a full crontab (multiline, comment lines starting with `#`)

## Files to Create

```
src/tools/cron/expression/index.ts
src/tools/cron/expression/cron-expression-tool.tsx
src/tools/cron/crontab/index.ts
src/tools/cron/crontab/crontab-tool.tsx
src/lib/cron-utils.ts                     # describe(), nextRuns(), parseCrontab()
```

Update:
```
src/tools/registry.ts
```

## Dependencies to Install

```
cronstrue@^2 cron-parser@^4
```

Optional: `luxon` if timezone formatting beyond `Intl.DateTimeFormat` is needed. Skip for bootstrap; `Intl` covers zoned display.

## Implementation Steps

1. **cron-utils.ts.**
   - `describe(expr, opts)` → `cronstrue.toString(expr, { verbose: true, throwExceptionOnParseError: false })`
   - `nextRuns(expr, count, tz)` → `cronParser.parseExpression(expr, { tz })` → loop `.next()` `count` times, format each via `Intl.DateTimeFormat`
   - `parseCrontab(text)` → split by `\n`, skip blank + `#` lines, for each row split on whitespace: first 5 fields = expression, rest = command; return `{ line, expr, command, valid, error?, description }[]`
2. **Cron expression tool.** Single-line input, 5-field / 6-field radio, description below, timezone select (populated from `Intl.supportedValuesOf("timeZone")`), next-10 table.
3. **Crontab tool.** Multiline textarea, live-parsed table showing each row's expression, command, description, next run, and error if any.
4. **Registry.** Two entries in the Cron category; keywords: `["cron","schedule","expression"]`, `["crontab","cron","schedule"]`.

## Verification

- `"0 9 * * 1"` → "At 09:00 AM, only on Monday"; next 10 runs all Mondays at 09:00 local
- `"*/15 * * * *"` → "Every 15 minutes"; next runs 15 min apart
- Invalid `"a b c d e"` → `valid: false`, error message shown, tool remains interactive
- Crontab with mixed comments + blanks parses only non-empty non-comment rows

## Success Criteria

- [x] Both tools render inside `ToolPageShell`
- [x] Timezone dropdown includes user's system timezone as default
- [x] Invalid expressions never crash the tool (caught by parse, not by boundary)
- [x] Unit tests for `describe`, `nextRuns`, `parseCrontab` happy paths + 2 invalid inputs

## Risks & Rollback

- **Risk:** `cron-parser` behavior differs from `cronstrue` on edge cases (e.g., `?` in day-of-week). Mitigation: document the accepted subset in the tool's help text; reject unsupported chars up front.
- **Risk:** `Intl.supportedValuesOf` unsupported in older WebViews. Mitigation: fall back to a curated list of common zones if the call throws.
- **Rollback:** delete `src/tools/cron/`, drop deps, remove registry entries.
