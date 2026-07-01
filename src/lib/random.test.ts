import { describe, it, expect } from "vitest";

import { secureRandomInt, pickN, shuffleString } from "./random";

describe("secureRandomInt", () => {
  it("returns 0 for maxExclusive = 1", () => {
    expect(secureRandomInt(1)).toBe(0);
  });

  it("always stays within [0, maxExclusive)", () => {
    for (let i = 0; i < 5000; i++) {
      const v = secureRandomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });

  it("throws for invalid ranges", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(() => secureRandomInt(2.5)).toThrow(RangeError);
  });

  it("produces a roughly uniform distribution (chi-squared spot check)", () => {
    const buckets = [0, 0, 0, 0];
    const trials = 20000;
    const expected = trials / 4;
    for (let i = 0; i < trials; i++) buckets[secureRandomInt(4)]++;
    // Chi-squared with df=3 has mean 3; a biased generator lands in the
    // hundreds. A generous ceiling (30 ≈ 11σ) keeps this a non-flaky spot
    // check that still trips on real modulo bias.
    const chi = buckets.reduce((sum, n) => sum + Math.pow(n - expected, 2) / expected, 0);
    expect(chi).toBeLessThan(30);
  });
});

describe("pickN", () => {
  it("returns a string of length n from the charset", () => {
    const out = pickN("ab", 20);
    expect(out).toHaveLength(20);
    for (const ch of out) expect("ab").toContain(ch);
  });

  it("throws on empty charset", () => {
    expect(() => pickN("", 3)).toThrow();
  });
});

describe("shuffleString", () => {
  it("preserves the multiset of characters", () => {
    const s = "abcdefghij";
    const shuffled = shuffleString(s);
    expect(shuffled.split("").sort().join("")).toBe(s);
  });
});
