import { describe, it, expect } from "vitest";

import { formatYaml } from "./format-yaml";

describe("formatYaml", () => {
  it("re-emits YAML with consistent indentation", () => {
    const { output, error } = formatYaml("name: DevKit\nlist:\n- a\n- b");
    expect(error).toBeNull();
    expect(output).toContain("name: DevKit");
    expect(output).toContain("- a");
    // Round-trip stability: re-formatting the output is idempotent.
    expect(formatYaml(output).output).toBe(output);
  });

  it("returns a readable error for malformed YAML", () => {
    const { output, error } = formatYaml("a: ]invalid");
    expect(output).toBe("");
    expect(error).not.toBeNull();
  });

  it("treats empty input as no-op", () => {
    expect(formatYaml("")).toEqual({ output: "", error: null });
  });
});
