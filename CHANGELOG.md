# Changelog

All notable changes to DevKit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Each release section is headed `## [X.Y.Z] - YYYY-MM-DD`. The release CI extracts
the section matching the pushed tag (`vX.Y.Z` → `## [X.Y.Z]`) into the GitHub
release body, so keep this heading format exact — the extractor and the in-app
update modal both depend on it.

## [Unreleased]

### Added

- Manual update notifier: checks GitHub Releases on launch and hourly, surfaces
  an update icon beside the app name, and shows a modal with the combined
  changelog of every newer release.

## [0.1.0] - 2026-07-01

### Added

- Initial DevKit release: offline developer utility toolbox built on Tauri v2 +
  React + Tailwind.
- Format & encode tools: JSON, YAML, XML, SQL formatters and Base64 / URL
  encoders.
- Generators & text tools.
- Rust-backed crypto tools: hashing, bcrypt, and JWT.
- Cron expression explorer and crontab validator.
- Command palette, theme switching, and searchable tool navigation.
