import { describe, expect, it } from "vitest";

import {
  MAX_MATCHES,
  MAX_PATTERN_LEN,
  MAX_TEST_LEN,
  collectMatches,
  compileSearch,
  moveMatch,
  normalizeIndex,
  replaceAll,
  replaceOne,
  type SearchOptions,
} from "./find-replace";

const literal: SearchOptions = { caseSensitive: false, useRegex: false };
const regex: SearchOptions = { caseSensitive: false, useRegex: true };

function matches(text: string, query: string, options = regex) {
  const result = collectMatches(text, compileSearch(query, options));
  if (result.kind !== "matches") throw new Error("Expected matches");
  return result.matches;
}

describe("compileSearch", () => {
  it("treats literal metacharacters literally and applies case sensitivity", () => {
    const insensitive = collectMatches("a.b A.B axb", compileSearch("a.b", literal));
    const sensitive = collectMatches(
      "a.b A.B axb",
      compileSearch("a.b", { ...literal, caseSensitive: true }),
    );

    expect(insensitive).toMatchObject({ kind: "matches", matches: [{ index: 0 }, { index: 4 }] });
    expect(sensitive).toMatchObject({ kind: "matches", matches: [{ index: 0 }] });
    expect(collectMatches("a.b axb", compileSearch("a.b", literal))).toMatchObject({
      kind: "matches",
      matches: [{ index: 0 }],
    });
    for (const query of ["*", "[", "\\"]) {
      expect(collectMatches(query, compileSearch(query, literal))).toMatchObject({
        kind: "matches",
        matches: [{ index: 0 }],
      });
    }
  });

  it("distinguishes empty, invalid, and overlong regex queries", () => {
    expect(compileSearch("", regex)).toMatchObject({ kind: "empty" });
    expect(compileSearch("(", regex)).toMatchObject({ kind: "error", code: "invalid-pattern" });
    expect(compileSearch("x".repeat(MAX_PATTERN_LEN + 1), regex)).toMatchObject({
      kind: "error",
      code: "pattern-too-long",
    });
  });

  it("does not apply regex limits to literal searches", () => {
    expect(compileSearch("x".repeat(MAX_PATTERN_LEN + 1), literal)).toMatchObject({
      kind: "ready",
      useRegex: false,
    });
  });
});

describe("collectMatches", () => {
  it("reports regex text limits and a match overflow before replacement", () => {
    const tooLong = collectMatches(
      "x".repeat(MAX_TEST_LEN + 1),
      compileSearch("x", regex),
    );
    const overflow = collectMatches(
      "x".repeat(MAX_MATCHES + 1),
      compileSearch("x", regex),
    );

    expect(tooLong).toMatchObject({ kind: "error", code: "test-too-long" });
    expect(overflow).toMatchObject({ kind: "error", code: "match-limit" });
  });

  it("collects adjacent matches and safely advances zero-width matches", () => {
    expect(matches("aaa", "a").map((match) => [match.index, match.end])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(matches("ab cd", "\\b").map((match) => match.index)).toEqual([0, 2, 3, 5]);
    expect(matches("", "^$").map((match) => match.index)).toEqual([0]);
  });

  it("preserves captures, named groups, and full input context", () => {
    const [match] = matches("before alice after", "(?<name>alice)");

    expect(match).toMatchObject({
      index: 7,
      end: 12,
      match: "alice",
      captures: ["alice"],
      namedGroups: { name: "alice" },
      input: "before alice after",
    });
  });
});

describe("match navigation", () => {
  it("normalizes indices and wraps in both directions", () => {
    expect(normalizeIndex(-1, 3)).toBe(2);
    expect(normalizeIndex(5, 3)).toBe(2);
    expect(normalizeIndex(3, 0)).toBe(0);
    expect(moveMatch(2, 3, "next")).toBe(0);
    expect(moveMatch(0, 3, "previous")).toBe(2);
    expect(moveMatch(0, 0, "next")).toBe(0);
  });
});

describe("replacement", () => {
  it("keeps literal replacement values literal", () => {
    const compiled = compileSearch("a", literal);
    const [match] = matches("a a", "a", literal);

    expect(replaceOne("a a", match, "$&-$1", false)).toEqual({
      kind: "success",
      text: "$&-$1 a",
    });
    expect(replaceAll("a a", compiled, "$&-$1")).toEqual({
      kind: "success",
      text: "$&-$1 $&-$1",
    });
  });

  it("matches native JavaScript regex replacement tokens for Replace One", () => {
    const cases = [
      { text: "abc", query: "(a)", replacement: "$$-$&-$1-$12-$99-$01-$`-$'" },
      { text: "abc", query: "(?<word>a)", replacement: "$<word>-$<missing>" },
      { text: "abc", query: "(a)?b", replacement: "<$1>" },
      { text: "hello", query: "(?<=he)l", replacement: "[$&:$`:$']" },
    ];

    for (const { text, query, replacement } of cases) {
      const [match] = matches(text, query);
      expect(replaceOne(text, match, replacement, true)).toEqual({
        kind: "success",
        text: text.replace(new RegExp(query), replacement),
      });
    }
  });

  it("uses native replacement semantics for regex Replace All", () => {
    const compiled = compileSearch("(?<letter>a)", regex);

    expect(replaceAll("aba", compiled, "<$<letter>:$&>")).toEqual({
      kind: "success",
      text: "<a:a>b<a:a>",
    });
  });

  it("refuses Replace All when matching overflows the cap", () => {
    const text = "x".repeat(MAX_MATCHES + 1);

    expect(replaceAll(text, compileSearch("x", regex), "y")).toMatchObject({
      kind: "error",
      code: "match-limit",
    });
  });

  it("preserves invalid and over-limit compiled-search errors", () => {
    expect(replaceAll("text", compileSearch("(", regex), "x")).toMatchObject({
      kind: "error",
      code: "invalid-pattern",
    });
    expect(
      replaceAll("text", compileSearch("x".repeat(MAX_PATTERN_LEN + 1), regex), "x"),
    ).toMatchObject({ kind: "error", code: "pattern-too-long" });
  });

  it("replaces a zero-width match with JavaScript semantics", () => {
    const [match] = matches("abc", "^");

    expect(replaceOne("abc", match, "start-", true)).toEqual({
      kind: "success",
      text: "start-abc",
    });
  });
});
