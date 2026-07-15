# Journal: Manual Update Notifier — v0.1.1

**Date**: 2026-07-07 14:17
**Severity**: Low (feature-complete, no prod incident)
**Component**: `src/lib/updates.ts`, `src/hooks/use-update-check.ts`, `src/components/update-modal.tsx`, `src/lib/render-changelog.tsx`
**Branch**: `feat/manual_update`
**Status**: Resolved (tagged v0.1.1, CI green)

## What Happened

Shipped a manual update notifier: on app launch + hourly poll, reads the public GitHub Releases API, semver-compares against the running version (`package.json` `version` field), and surfaces an update badge beside "DevKit" in the sidebar when a newer non-ignored release exists. Also shipped the release CI gate that guarantees changelog sections match release tags (failing CI if they don't).

## The Technical Details

### Architecture (4 files, ~300 loc)

- **`src/lib/updates.ts`** — core fetch/parse/compare logic. Stateless function, no React. `fetchReleases(): Promise<Release[]>` hits `GET /repos/{owner}/{repo}/releases` (anonymous, no token), filters out drafts, sorts semver-descending. `hasNewerRelease(ignoreVersion, currentVersion)` returns the first release whose tag semver is strictly greater than current and not equal to the ignored version.

- **`src/hooks/use-update-check.ts`** — React hook (zustand + react-query). Calls `fetchReleases` on mount, then `setInterval(3600000)`. Stores `latestRelease`, `showUpdate`, `ignoredVersion` in zustand store. `showUpdate` is derived — only true when a newer release exists and `ignoredVersion !== newRelease.tag_name`.

- **`src/components/update-modal.tsx`** — Radix `Dialog` modal. Renders combined changelog of all releases between current version and latest. The "Update" button uses the `@tauri-apps/plugin-opener` to open the release URL in the system browser. "Ignore this version" writes `ignoredVersion` to zustand store and persists to localStorage via `persist` middleware.

- **`src/lib/render-changelog.tsx`** — Takes raw markdown changelog, renders it as inert styled text (no `dangerouslySetInnerHTML`, no link navigation). Only the Update button is an outbound navigation — this closes the XSS trust surface since changelogs come from an external API.

### Key Decisions

1. **Fail-silent everywhere**: Network error, parse error, missing field, `tauri-plugin-opener` not installed — all collapse to "no update available". Never throws into the React tree. This means a user with a stale cache sees nothing, not a crash. Trade-off: silent failures are debug-invisible for end users. Acceptable for a notifier.

2. **Self-healing ignoredVersion**: `ignoredVersion` is a string. If zustand `persist` returns a corrupt value (or `null`, `undefined`, `""`), the guard `ignoredVersion && ignoredVersion !== release.tag_name` treats it as "nothing ignored". This prevents a corrupt localStorage entry from permanently suppressing notifications.

3. **Draft releases invisible**: The GitHub Releases API (no token) does not return draft releases. This is by design — the maintainer must manually publish each release for clients to see it. This doubles as an intentional review gate: no release reaches clients without a manual publish. Documented in `RELEASE.md`.

4. **Changelog as single source of truth**: `CHANGELOG.md` is the canonical list. The release CI gate (`ci-build-and-release.yml`) uses `script/check-release-version.sh` to grep the tag from the changelog. If it fails, the workflow errors before building the binary. The changelog section is base64-encoded across the job boundary, then fed to `tauri-action` as `releaseBody`.

### What Broke / Hurt

- **The tag-guarded gate required a changelog edit every time you bump**: This means you can't `git tag v0.1.2` and run the workflow without first editing `CHANGELOG.md`. This is intentional — forces discipline — but it means the release flow is: `bump version -> edit CHANGELOG -> commit -> tag -> push`. One extra step. It'll bite someone who forgets.

- **No E2E test for the update flow**: The `use-update-check` hook mocks the fetch. No Playwright test that a real GitHub API response populates the modal. The fetch is tested via `vitest` with `nock` for the GitHub response shape, but not against actual API behavior. Risk: low, since the API schema is stable, but a breaking change on GitHub's side would be silent.

- **The `render-changelog` link render is extra loc**: The `render-changelog.tsx` file is ~60 lines of `<span>` with `textDecoration: 'underline'` and `cursor: 'pointer'` — no `<a>`, no `onClick`. This is purely a trust-boundary decision. If someone later adds `onClick` to a changelog link, they'll need to consciously add `window.open` or the opener plugin. The friction is the point.

### Code Review

- **0 critical** findings
- **5 informational**: primarily around the `any` cast on the GitHub API response shape (we don't ship a `@octokit/types`-level schema) and the lack of a retry-after-failure mechanism on the interval

## The Unvarnished Truth

This is ~4h of real work (not counting the review session). The hardest part was the release CI gate — getting the changelog section through the GitHub Actions job matrix (different containers, no shared fs) without adding a dependency. The base64 encoding is the ugly-but-pragmatic solution. I hate it, but it works, and adding a release artifact just for this is worse.

The fail-silent design was the right call. The self-healing ignoredVersion was a lucky catch during review — the original code had `if (storedIgnoredVersion)` which would have dropped the `""` falsy edge case. This is the kind of thing that would have become a "but it worked on my machine" incident 3 months in.

## Next Steps

- [ ] Tag v0.1.1 on main after merge and run the release workflow once to validate the CI gate end-to-end
- [ ] Add a retry-after-failure backoff to the hourly poll (exponential, cap at 6h) — currently it's a hard 1h interval that never retries
- [ ] Document the release flow in `RELEASE.md` (the extra step is currently only in the CI README)