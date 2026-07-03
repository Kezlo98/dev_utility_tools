# Deployment & Packaging Guide

This guide details how to build, sign, and release DevKit. The build process runs automatically via GitHub Actions, compiling installer packages for macOS and Windows.

---

## 1. Prerequisites for Building Locally

To build the application on your local machine, ensure the following tools are installed:

- **Node.js:** v20 LTS
- **Rust:** stable channel (v1.77 or newer)
- **macOS Requirements:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows Requirements:** Visual Studio Build Tools with the "Desktop development with C++" workload installed.

---

## 2. Local Build Commands

Run the following commands in the project root:

### macOS

To compile a universal app bundle supporting both Apple Silicon (`aarch64`) and Intel (`x86_64`) chips:

1. Install both Rust compilation targets:
   ```bash
   rustup target add aarch64-apple-darwin x86_64-apple-darwin
   ```
2. Run the Tauri compiler with the target flag:
   ```bash
   npm run tauri build -- --target universal-apple-darwin
   ```

The output bundles will be located in:
`src-tauri/target/universal-apple-darwin/release/bundle/`

### Windows

To compile a 64-bit installer:

```bash
npm run tauri build
```

The output `.msi` and `.exe` files will be located in:
`src-tauri/target/release/bundle/`

---

## 3. Continuous Integration & Release Automation

Releases are managed by the GitHub Actions workflow located in [.github/workflows/ci-build-and-release.yml](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/.github/workflows/ci-build-and-release.yml).

- **Triggers:**
  - Pushing a version tag: `git tag vX.Y.Z && git push --tags`
  - Manual execution: Via the GitHub Actions repository UI.
- **Workflow Pipeline:**
  - Installs Node 20 and stable Rust toolchains.
  - Spins up a matrix matching `macos-latest` (with cross-compilation targets) and `windows-latest` runners.
  - Compiles frontend assets and calls `tauri-action` to build distributables.
  - Bundles the binaries and uploads them to a **Draft Release** on GitHub.

---

## 4. Code Signing Configuration

During the initial bootstrap phase, installers are built **unsigned** to bypass the need for active developer certs. When certs are provisioned, signing can be enabled simply by adding the secrets listed below to your GitHub repository.

Refer to [release-and-signing.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/release-and-signing.md) for certificate export guidelines and OS-specific first-launch Gatekeeper/SmartScreen bypass instructions.

### macOS (Apple Developer Certificates)

Add these secrets to sign and notarize macOS `.dmg` and `.app` bundles:

- `APPLE_CERTIFICATE` - Base64-encoded developer ID certificate (`.p12`)
- `APPLE_CERTIFICATE_PASSWORD` - Password associated with the certificate
- `APPLE_SIGNING_IDENTITY` - Name of the developer identity (e.g., `Developer ID Application: Company Name`)
- `APPLE_ID` - Apple developer account email address
- `APPLE_PASSWORD` - App-specific password generated on appleid.apple.com
- `APPLE_TEAM_ID` - Developer portal Team ID

### Windows (Authenticode Certificate)

Add these secrets to sign `.msi` and `-setup.exe` installers:

- `WINDOWS_CERTIFICATE` - Base64-encoded Authenticode code-signing certificate (`.pfx`)
- `WINDOWS_CERTIFICATE_PASSWORD` - Password associated with the certificate

The timestamp authority (`http://timestamp.digicert.com`) is pre-configured in [tauri.conf.json](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/tauri.conf.json#L42) to automate signature verification.

## Related Documents

- [release-and-signing.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/release-and-signing.md) - Bypass guides and certificate exports
- [project-roadmap.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/project-roadmap.md) - Release milestones
- [system-architecture.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/system-architecture.md) - Binary sandboxing parameters
