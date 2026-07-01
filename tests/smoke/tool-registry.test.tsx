import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { getAllTools } from "@/lib/registry";
import { ToolPageShell } from "@/components/tool-page-shell";
import type { Tool } from "@/lib/types";

/**
 * Registry smoke test: every registered tool must mount inside ToolPageShell
 * without throwing. This guards new tools against crashes that unit tests on
 * isolated helpers would miss (bad imports, hooks called conditionally, etc.).
 *
 * Render-only: no tool actions are triggered, so favorite/IPC state is never
 * mutated. A tool that throws on mount logs to console.error via
 * ToolErrorBoundary — the spy assertion catches that.
 */

// Stub the Tauri IPC bridge so Rust-backed tools (bcrypt/JWT) import cleanly in
// jsdom. Commands are only invoked on user action, never on mount, so the
// stubs are never reached during these render-only checks.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const tools = getAllTools();

describe("tool registry", () => {
  // 18 = the 17 tools in the original plan, with Cron implemented as two
  // distinct tools (expression explorer + crontab validator) per phase 6.
  it("exposes the full bootstrap toolset with unique ids", () => {
    const ids = tools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tools).toHaveLength(18);
  });

  it.each(tools.map((t) => [t.id, t] as const))(
    "mounts %s inside ToolPageShell without crashing",
    (_id, tool: Tool) => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const ToolComponent = tool.component;

      render(
        <ToolPageShell tool={tool}>
          <ToolComponent />
        </ToolPageShell>,
      );

      // Shell renders the tool name in its header.
      expect(screen.getByText(tool.name)).toBeInTheDocument();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    },
  );
});
