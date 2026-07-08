# Release & Signing

DevKit ships from CI. This doc covers how a release is produced, the first-launch experience for the **unsigned** bootstrap builds, and how to enable code signing later without rewriting the workflow.

## Producing a release

The [`build-and-release`](../.github/workflows/ci-build-and-release.yml) workflow runs on two triggers:

- **Tag push** — `git tag vX.Y.Z && git push --tags`
- **Manual dispatch** — via the GitHub Actions UI ("Run workflow")

On a **tag push**, a `changelog` gate job runs first, then the build matrix:

| Runner           | Artifact                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `macos-latest`   | Universal `.dmg` + `.app.tar.gz` (aarch64 + x86_64 lipo'd via `--target universal-apple-darwin`) |
| `windows-latest` | `.msi` (WiX) + `-setup.exe` (NSIS)                                                               |

Artifacts are attached to a **draft** GitHub release.

### Changelog gate (source of truth)

[`CHANGELOG.md`](../CHANGELOG.md) is the single source of truth for release notes. On a tag push the `changelog` job:

1. Derives the version from the tag (`v0.2.0` → `0.2.0`).
2. Extracts the matching `## [0.2.0]` section from `CHANGELOG.md`.
3. **Fails the release before any build runs** if that section is missing (`::error::No CHANGELOG.md section for …`).
4. Passes the extracted text into the GitHub release body, which the in-app update modal renders.

So the release checklist is: **add a `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md` before tagging `vX.Y.Z`.** Keep the heading format exact (`## [X.Y.Z]`) — the extractor and the app both key off it.

The gate is tag-guarded (`github.ref_type == 'tag'`). A **manual dispatch** runs on a branch ref, so the gate is skipped and the build publishes with **no injected changelog body** — dispatch builds are for smoke-testing, not for releases the notifier should surface.

### Manual publish is required (draft window)

Releases are created as **drafts** (`releaseDraft: true`, retained intentionally). The in-app update notifier polls the **anonymous** GitHub Releases API, which does **not** return draft releases. So a draft is invisible to users until a maintainer publishes it:

1. Let CI finish and attach the artifacts to the draft release.
2. Smoke-test the bundles.
3. **Publish the draft in the GitHub Releases UI.**

Only after publishing does the update icon appear in users' running apps. The draft window is the deliberate review gate — do not flip `releaseDraft` to `false`.

Quality gate: the [`typecheck-lint`](../.github/workflows/ci-typecheck-lint.yml) workflow runs on every PR and push to `master` — frontend typecheck/lint/tests and Rust `fmt`/`clippy`/`test`. It must be green before a release tag.

## Bootstrap ships unsigned

Code-signing certificates (Apple Developer + Windows Authenticode) are **not yet provisioned**. The builds are therefore unsigned, which means the OS will warn on first launch. This is expected, not a bug.

### macOS — Gatekeeper

The unsigned `.dmg` is blocked by Gatekeeper on first launch:

1. Drag **DevKit.app** to `/Applications`.
2. Right-click (or Control-click) **DevKit.app** → **Open**.
3. Confirm the "DevKit cannot be opened because Apple cannot check it for malicious software" prompt → **Open**.

After the first confirmation, the app launches normally on subsequent opens.

### Windows — SmartScreen

The unsigned `.exe` / `.msi` triggers SmartScreen:

1. Run the installer.
2. On the "Windows protected your PC" blue screen, click **More info**.
3. Click **Run anyway**.

## Enabling signing (follow-up)

The signing pipeline is already scaffolded — enabling it later is a **secret-population step, not a workflow edit**. Populate these GitHub repository secrets and the next release signs automatically:

### macOS (Apple)

| Secret                       | Value                                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| `APPLE_CERTIFICATE`          | Developer ID Application certificate, base64-encoded `.p12`              |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12`                                                  |
| `APPLE_SIGNING_IDENTITY`     | Signing identity name, e.g. `Developer ID Application: Your Name (TEAM)` |
| `APPLE_ID`                   | Apple ID for notarization                                                |
| `APPLE_PASSWORD`             | App-specific password (appleid.apple.com → Sign-In & Security)           |
| `APPLE_TEAM_ID`              | Developer Team ID                                                        |

Export the `.p12` and base64 it: `base64 -i developer-id.p12 | pbcopy`.

Notarization (`APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID`) is optional but recommended — it produces a ticketed build that avoids the right-click → Open dance. Stapling is handled by `tauri-action` when notarization secrets are present.

### Windows (Authenticode)

| Secret                         | Value                            |
| ------------------------------ | -------------------------------- |
| `WINDOWS_CERTIFICATE`          | Authenticode PFX, base64-encoded |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the PFX             |

The Windows `timestampUrl` (`http://timestamp.digicert.com`) is already configured in [`tauri.conf.json`](../src-tauri/tauri.conf.json), so signed builds are timestamped automatically.

### Tauri updater (optional, post-bootstrap)

If auto-update is added later, also set `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` so update bundles are signed and the updater verifies them at install time.

## Notes

- The universal-macOS build step requires both `aarch64-apple-darwin` and `x86_64-apple-darwin` Rust targets — the workflow installs them explicitly. If building locally, run `rustup target add aarch64-apple-darwin x86_64-apple-darwin` first.
- Signing is the only remaining gap; it has no effect on the app's functionality, only on first-launch trust prompts.
