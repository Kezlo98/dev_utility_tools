import { describe, it, expect } from "vitest";

import { formatJson } from "./format-json";

describe("formatJson", () => {
  it("pretty-prints compact JSON with a 2-space indent", () => {
    const { output, error } = formatJson('{"a":1,"b":[2,3]}');
    expect(error).toBeNull();
    expect(output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it("returns a readable error for malformed JSON without throwing", () => {
    const { output, error } = formatJson("{not json}");
    expect(output).toBe("");
    expect(error).not.toBeNull();
    expect(typeof error).toBe("string");
  });

  it("treats empty input as no-op (no error)", () => {
    expect(formatJson("")).toEqual({ output: "", error: null });
    expect(formatJson("   ")).toEqual({ output: "", error: null });
  });
});
