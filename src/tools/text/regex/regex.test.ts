import { describe, it, expect } from "vitest";

import {
  runRegex,
  buildSegments,
  MAX_PATTERN_LEN,
  MAX_TEST_LEN,
} from "./regex";

describe("runRegex", () => {
  it("finds all global matches", () => {
    const { matches, error } = runRegex("\\d+", "g", "a1 b22 c333");
    expect(error).toBeNull();
    expect(matches.map((m) => m.match)).toEqual(["1", "22", "333"]);
  });

  it("returns only the first match without the global flag", () => {
    const { matches } = runRegex("\\d", "", "12345");
    expect(matches).toHaveLength(1);
    expect(matches[0].match).toBe("1");
  });

  it("captures groups", () => {
    const { matches } = runRegex("(\\w+)(\\d)", "", "foo7");
    expect(matches[0].groups).toEqual(["foo", "7"]);
  });

  it("surfaces invalid patterns as a readable error", () => {
    const { matches, error } = runRegex("(unclosed", "g", "test");
    expect(matches).toHaveLength(0);
    expect(error).not.toBeNull();
  });

  it("rejects patterns over the length cap", () => {
    const { error } = runRegex("a".repeat(MAX_PATTERN_LEN + 1), "g", "aaa");
    expect(error).toMatch(/limit/i);
  });

  it("rejects test strings over the size cap", () => {
    const { error } = runRegex("a", "g", "x".repeat(MAX_TEST_LEN + 1));
    expect(error).toMatch(/limit/i);
  });

  it("does not loop forever on zero-width global matches", () => {
    const { matches } = runRegex("^", "gm", "line1\nline2\nline3");
    expect(matches).toHaveLength(3);
  });
});

describe("buildSegments", () => {
  it("round-trips exactly for normal matches", () => {
    const test = "a1 b22 c333";
    const { matches } = runRegex("\\d+", "g", test);
    const segments = buildSegments(test, matches);
    expect(segments.map((s) => s.text).join("")).toBe(test);
    expect(segments.filter((s) => s.matched).map((s) => s.text)).toEqual([
      "1",
      "22",
      "333",
    ]);
  });

  it("round-trips exactly for zero-width matches (no dropped chars)", () => {
    for (const [pattern, flags, test] of [
      ["^", "gm", "line1\nline2"],
      ["\\b", "g", "hello world"],
      ["$", "gm", "ab\ncd"],
      ["a*?", "g", "aaa"],
    ] as const) {
      const { matches } = runRegex(pattern, flags, test);
      const segments = buildSegments(test, matches);
      expect(segments.map((s) => s.text).join("")).toBe(test);
    }
  });

  it("returns the whole string as one plain segment when there are no matches", () => {
    const segments = buildSegments("hello", []);
    expect(segments).toEqual([{ text: "hello", matched: false }]);
  });
});
