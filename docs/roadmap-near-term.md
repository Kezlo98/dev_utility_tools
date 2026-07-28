# DevKit Near-Term Roadmap

Short-horizon feature roadmap for DevKit. These are the next tools queued up
after the global spotlight launcher and base64-file support. For the full
release timeline (code signing, auto-updater, asymmetric crypto), see
[project-roadmap.md](./project-roadmap.md).

Status legend: `Planned` · `In Progress` · `Done`

---

## Prioritized Queue

### 1. Flowchart Support

- **Status:** Planned
- **Category:** `diagrams` (new category)
- **Goal:** Edit and render diagrams directly inside DevKit without an external
  service or account.
- **Scope:**
  - Text-to-diagram editing via [Mermaid](https://mermaid.js.org/) — flowchart,
    sequence, class, and state diagrams first.
  - Live preview pane (edit on the left, render on the right).
  - Export to PNG / SVG.
  - Copy diagram source and copy rendered image.
  - Persist source to the namespaced app store so drafts survive reloads.
- **Out of scope (defer):** Excalidraw-style freehand canvas, collaborative
  multi-cursor editing, cloud sync.
- **Open questions:**
  - Bundle `mermaid` (large) vs. lazy-load on first open?
  - Also support a D2 or PlantUML source mode, or Mermaid-only for v1?
- **Affected areas:** new `src/tools/diagrams/flowchart/`, registry barrel,
  `Tool` type category extension, `menu-panel` category sort.

### 2. Epoch Time

- **Status:** Planned
- **Category:** `generators` (alongside existing `timestamp`)
- **Goal:** A focused epoch tool that complements the existing Timestamp
  converter — live "current epoch" readout plus richer epoch <-> human
  conversions.
- **Scope:**
  - Live current epoch ticker (seconds and milliseconds).
  - Convert epoch (s/ms/µs) -> ISO-8601, local, and relative ("3 hours ago").
  - Convert human date -> epoch in s and ms.
  - One-click copy for each output and a configurable timezone selector.
  - Input validation with clear errors for out-of-range / non-numeric values.
- **Relationship to Timestamp tool:** Timestamp stays a bidirectional Unix <->
  ISO converter; Epoch Time centers on the *current value* and multiple
  resolutions (s/ms/µs) and relative-time display.
- **Affected areas:** new `src/tools/generators/epoch/`, registry barrel.

---

## Next Up (Lower Priority)

- **Color tools** — picker, hex/rgb/hsl converter, contrast checker.
- **Placeholder data generator** — fake names, emails, addresses for dev/test
  fixtures.
- **Hash expansion** — list multiple algorithm outputs side-by-side from one
  input.

## Done

- Global spotlight launcher (hotkey, tray, query-param mount) — see
  [260716-2305-global-spotlight-quick-access-launcher](../plans/260716-2305-global-spotlight-quick-access-launcher).
- Base64 file encode/decode support.
