import { describe, it, expect } from "vitest";

import { computeDiff, MAX_DIFF_INPUT } from "./diff";

describe("computeDiff", () => {
  it("flags added and removed lines", () => {
    const { parts, error } = computeDiff("a\nb\nc", "a\nB\nc", false);
    expect(error).toBeNull();
    expect(parts.some((p) => p.removed && p.value.includes("b"))).toBe(true);
    expect(parts.some((p) => p.added && p.value.includes("B"))).toBe(true);
  });

  it("reports no change for identical inputs", () => {
    const { parts } = computeDiff("same\nhere", "same\nhere", false);
    expect(parts.every((p) => !p.added && !p.removed)).toBe(true);
  });

  it("ignore-whitespace collapses pure whitespace-only changes", () => {
    // Leading, trailing, and inter-token spacing vary but no content change.
    const { parts } = computeDiff("  foo   bar  ", "foo bar", true);
    expect(parts.every((p) => !p.added && !p.removed)).toBe(true);
  });

  it("still detects real changes even with ignore-whitespace", () => {
    const { parts } = computeDiff("foo", "bar", true);
    expect(parts.some((p) => p.removed)).toBe(true);
    expect(parts.some((p) => p.added)).toBe(true);
  });

  it("rejects inputs over the per-side cap", () => {
    const big = "x".repeat(MAX_DIFF_INPUT + 1);
    const { parts, error } = computeDiff(big, "y", false);
    expect(parts).toHaveLength(0);
    expect(error).toMatch(/cap/i);
  });
});
