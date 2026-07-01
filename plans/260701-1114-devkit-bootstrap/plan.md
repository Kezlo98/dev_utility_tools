---
title: "DevKit Bootstrap"
description: "Cross-platform (macOS + Windows) developer utilities desktop app: 17 tools across Format/Validate, Encode/Hash/Crypto, Generators, Text/Dev, Cron. Tauri v2 + React 18 + shadcn/ui."
status: pending
priority: P2
branch: "master"
tags: [desktop, tauri, react, bootstrap]
blockedBy: []
blocks: []
created: "2026-07-01T04:25:59.244Z"
createdBy: "ck:plan"
source: skill
---

# DevKit Bootstrap

## Overview

DevKit is a menu-driven desktop utility app for developers. A vertical `MenuPanel` (left) lists 17 tools with favorites-first + A→Z ordering and search. A `ToolPage` (right) renders the selected tool inside a shared `ToolPageShell` (header, favorite star, error boundary, consistent padding). Dark mode cascades to every tool.

**Stack (locked):** Tauri v2 · React 18 · TypeScript · Vite · shadcn/ui · Tailwind CSS · Rust for crypto commands.

**Bundle:** `com.kezlo.devkit`. Targets: macOS universal (`aarch64` + `x86_64`) and Windows `x86_64`.

## Scope

**17 tools, 5 categories:**

- **Format/Validate:** JSON, YAML, XML, SQL
- **Encode/Hash/Crypto:** Base64, URL encode, Hash (MD5/SHA-1/SHA-256/SHA-512), bcrypt, JWT decode/verify
- **Generators:** UUID/ULID, Password (Web Crypto), QR code, Timestamp
- **Text/Dev:** Case converter, Text diff, Regex tester
- **Cron:** Cron expression + crontab

Password generation and SHA-* hashing use the WebView's `crypto.subtle` (OS CSPRNG + native digests). MD5 uses a small JS lib (no Web Crypto support). Only bcrypt and JWT verify keep Rust command backing.

**Shared features:** favorites, theme (light/dark/system), last-active tool restore, `Cmd/Ctrl+K` command palette with fuzzy search + recents, per-tool error boundary.

**Out of scope for bootstrap:** auto-update, telemetry, plugins, cloud sync, i18n.

## Phases

| Phase | Name | Status | Depends on |
|-------|------|--------|-----------|
| 1 | [Scaffold](./phase-01-scaffold.md) | Done | — |
| 2 | [Core Shell](./phase-02-core-shell.md) | Done | 1 |
| 3 | [Tool Wave A - Format & Encode](./phase-03-tool-wave-a-format-encode.md) | Done | 2 |
| 4 | [Tool Wave B - Generators & Text](./phase-04-tool-wave-b-generators-text.md) | Done | 2 |
| 5 | [Tool Wave C - Rust-backed Crypto](./phase-05-tool-wave-c-rust-backed-crypto.md) | Pending | 2 |
| 6 | [Cron Tool](./phase-06-cron-tool.md) | Pending | 2 |
| 7 | [Polish & CI](./phase-07-polish-ci.md) | Pending | 3, 4, 5, 6 |

Phases 3–6 can run in parallel after Phase 2 lands.

## Acceptance Criteria

- [ ] `npm run tauri dev` launches the app on macOS and Windows
- [ ] All 17 tools render inside `ToolPageShell` with working favorite toggle
- [ ] Favorites, theme, last-active tool, palette recents persist across restart
- [ ] `Cmd/Ctrl+K` opens palette; typing filters tools; Enter navigates
- [ ] Dark mode toggle cascades to every tool without per-tool overrides
- [ ] Rust crypto commands return `Result<T, String>` and surface errors in the UI
- [ ] CI produces unsigned `.dmg` (universal) and unsigned `.msi`/`.exe` artifacts (signing is post-bootstrap follow-up)
- [ ] `npm run typecheck`, `npm run lint`, `cargo check` all clean

## Dependencies

None external. Node 20 LTS, Rust stable ≥ 1.77, Xcode CLT (macOS), MSVC Build Tools (Windows).

## Risks

- **Both platforms ship unsigned for bootstrap** (Validation Session 1, Decision #4). macOS Gatekeeper will block on first launch (right-click → Open); Windows SmartScreen will warn on unsigned `.exe`/`.msi`. Mitigation: document the first-launch bypass in `release-and-signing.md`; add Apple Developer + Authenticode signing as a post-bootstrap follow-up once certs are provisioned.
- **Universal binary lipo step** can fail silently if only one arch target is installed. Mitigation: CI installs both `aarch64-apple-darwin` and `x86_64-apple-darwin` explicitly.
- **cmdk + shadcn** portal conflicts inside the Tauri WebView. Mitigation: mount palette at the app root, not inside a scrolling region.

## Rollback

Each phase writes only to the paths it declares. Revert with `git checkout -- <phase paths>`. No DB, no external state.

## Validation Log

### Session 1 — 2026-07-01

**Verification Results**
- Claims checked: 5 (external deps + Tauri v2 capability shapes)
- Verified: 0 | Failed: 0 | Unverified: 5 (empty repo — no code to grep against yet)
- Tier: Full (7 phases)
- Notes: Tauri v2 capability schema for store plugin and command allowlist flagged `[UNVERIFIED]` — confirm against installed schemas at implementation time (Phase 5 already documents this).

**Interview Decisions**

1. **Password generator location** → **Web Crypto (JS-side).**
   - Uses `crypto.getRandomValues()` — same OS CSPRNG as Rust `OsRng`, no IPC round-trip, no Rust command needed.
   - Moves Phase 5 → Phase 4 (Text/Generators wave). Phase 5 shrinks to hash + bcrypt + JWT.
2. **JWT algorithms** → **Symmetric only (HS256/384/512).** RS256/ES256 defer to post-bootstrap.
3. **Regex safety** → **Length caps only** (500-char pattern, 200 KB input). No worker/timeout.
4. **Code signing (both platforms)** → **Ship unsigned** for bootstrap. macOS Gatekeeper first-launch bypass and Windows SmartScreen warning documented in `release-and-signing.md`. Signing env vars scaffolded in CI so enabling later is a secret-population, not a workflow rewrite.
5. **Hash tool split** → **SHA-1/256/384/512 via `crypto.subtle.digest`; MD5 via JS lib (`js-md5` or `spark-md5`).**
   - Reduces Rust surface: only bcrypt + JWT verify remain in Rust.
   - Note: SHA-384 comes free from Web Crypto; add to the algorithm dropdown.
6. **Persistence backend** → **`localStorage`.**
   - Tauri v2 WebView persists localStorage across app restarts (macOS `~/Library/WebKit/com.kezlo.devkit/`, Windows `%LOCALAPPDATA%\com.kezlo.devkit\EBWebView\`).
   - Drop `@tauri-apps/plugin-store` from Phase 2. Small JSON strings only (< 1 KB total for favorites + theme + lastActiveToolId + 8 palette recents).
7. **`cron-parser`** → keep `^4` for bootstrap.

**Propagation**
- `plan.md`: scope, acceptance criteria, risks updated for unsigned-both-platforms + Web Crypto scope shifts.
- Phase 2: persistence backend swap (plugin-store → localStorage); drop Cargo/capability changes.
- Phase 4: add password generator (Web Crypto) + `src/lib/random.ts`.
- Phase 5: drop password + hash Rust commands; split hash tool (SHA* Web Crypto + MD5 `spark-md5`); JWT scope pre-checks unsupported algs; bcrypt mandatory `spawn_blocking`.
- Phase 7: both macOS + Windows unsigned; Rust test line trimmed (no `hash_input`, no password); notarization risk removed; new SHA/MD5/password JS tests added.

### Whole-Plan Consistency Sweep

- `plan.md` acceptance criterion line 63 aligned with Decision #4 (both unsigned). ✓
- `plan.md` risk block collapsed macOS/Windows signing into a single unsigned-bootstrap risk. ✓
- Phase 2: no Tauri store plugin, Cargo, or capability references. ✓
- Phase 4: password tool + `random.ts` added; tool count updated to 7. ✓
- Phase 5: password removed; hash split (SHA* WebCrypto + MD5 `spark-md5`); only bcrypt + JWT Rust commands remain; `hash_input`/`generate_password` scrubbed from `generate_handler!` and capability allowlist. ✓
- Phase 7: Rust `cargo test` line no longer references hash vectors or password guarantees; new JS test line added for `hash()` + password class + `secureRandomInt`; notarization risk removed; unsigned-on-both-platforms confirmed in Requirements + Signing env block. ✓
- Full-tree grep of stale terms — `@tauri-apps/plugin-store`, `OsRng`, `hash_input`, `generate_password`, "signed .dmg", "Signed macOS", "signing secrets are present" — returns zero hits in the plan tree.

Result: **No unresolved contradictions. Plan eligible for implementation.**
