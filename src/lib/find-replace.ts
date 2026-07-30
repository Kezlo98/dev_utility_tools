export const MAX_PATTERN_LEN = 500;
export const MAX_TEST_LEN = 200 * 1024;
export const MAX_MATCHES = 10_000;

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
}

export interface SearchMatch {
  index: number;
  end: number;
  match: string;
  captures: (string | undefined)[];
  namedGroups: Record<string, string | undefined> | undefined;
  input: string;
}

export type CompiledSearch =
  | { kind: "empty"; query: string }
  | { kind: "ready"; query: string; regex: RegExp; useRegex: boolean }
  | { kind: "error"; code: "invalid-pattern" | "pattern-too-long"; message: string };

export type MatchCollection =
  | { kind: "empty"; matches: [] }
  | {
      kind: "error";
      code:
        | "invalid-pattern"
        | "pattern-too-long"
        | "test-too-long"
        | "match-limit";
      message: string;
      matches: [];
    }
  | { kind: "matches"; matches: SearchMatch[] };

export type ReplacementResult =
  | { kind: "success"; text: string }
  | {
      kind: "error";
      code:
        | "invalid-search"
        | "invalid-pattern"
        | "pattern-too-long"
        | "test-too-long"
        | "match-limit";
      message: string;
    };

export function compileSearch(
  query: string,
  options: SearchOptions,
): CompiledSearch {
  if (query.length > MAX_PATTERN_LEN && options.useRegex) {
    return {
      kind: "error",
      code: "pattern-too-long",
      message: `Pattern exceeds the ${MAX_PATTERN_LEN}-character limit.`,
    };
  }
  if (query.length === 0) return { kind: "empty", query };

  const source = options.useRegex ? query : escapeRegExp(query);
  const flags = `g${options.caseSensitive ? "" : "i"}`;
  try {
    return {
      kind: "ready",
      query,
      regex: new RegExp(source, flags),
      useRegex: options.useRegex,
    };
  } catch (error) {
    return {
      kind: "error",
      code: "invalid-pattern",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function collectMatches(
  text: string,
  compiled: CompiledSearch,
): MatchCollection {
  if (compiled.kind === "empty") return { kind: "empty", matches: [] };
  if (compiled.kind === "error") {
    return {
      kind: "error",
      code: compiled.code,
      message: compiled.message,
      matches: [],
    };
  }
  if (compiled.useRegex && text.length > MAX_TEST_LEN) {
    return {
      kind: "error",
      code: "test-too-long",
      message: `Test string exceeds the ${MAX_TEST_LEN / 1024} KB limit.`,
      matches: [],
    };
  }

  const regex = new RegExp(compiled.regex.source, compiled.regex.flags);
  const matches: SearchMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push(toSearchMatch(match, text));
    if (matches.length > MAX_MATCHES) {
      return {
        kind: "error",
        code: "match-limit",
        message: `Search exceeds the ${MAX_MATCHES.toLocaleString()}-match limit.`,
        matches: [],
      };
    }
    if (match[0].length === 0) regex.lastIndex += 1;
  }

  return { kind: "matches", matches };
}

export function normalizeIndex(index: number, count: number): number {
  if (count === 0) return 0;
  return ((index % count) + count) % count;
}

export function moveMatch(
  currentIndex: number,
  count: number,
  direction: "next" | "previous",
): number {
  if (count === 0) return 0;
  const current = normalizeIndex(currentIndex, count);
  return normalizeIndex(current + (direction === "next" ? 1 : -1), count);
}

export function replaceOne(
  text: string,
  match: SearchMatch,
  replacement: string,
  useRegex: boolean,
): ReplacementResult {
  const value = useRegex
    ? expandReplacement(replacement, match)
    : replacement;
  return {
    kind: "success",
    text: text.slice(0, match.index) + value + text.slice(match.end),
  };
}

export function replaceAll(
  text: string,
  compiled: CompiledSearch,
  replacement: string,
): ReplacementResult {
  const collection = collectMatches(text, compiled);
  if (collection.kind === "empty") {
    return { kind: "success", text };
  }
  if (collection.kind === "error") {
    return {
      kind: "error",
      code: collection.code,
      message: collection.message,
    };
  }
  if (compiled.kind !== "ready") {
    return { kind: "error", code: "invalid-search", message: "Search is not valid." };
  }

  const regex = new RegExp(compiled.regex.source, compiled.regex.flags);
  const value = compiled.useRegex
    ? text.replace(regex, replacement)
    : text.replace(regex, () => replacement);
  return { kind: "success", text: value };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSearchMatch(match: RegExpExecArray, input: string): SearchMatch {
  return {
    index: match.index,
    end: match.index + match[0].length,
    match: match[0],
    captures: match.slice(1),
    namedGroups: match.groups,
    input,
  };
}

function expandReplacement(replacement: string, match: SearchMatch): string {
  let result = "";
  for (let index = 0; index < replacement.length; index += 1) {
    if (replacement[index] !== "$" || index + 1 >= replacement.length) {
      result += replacement[index];
      continue;
    }

    const token = replacement[index + 1];
    if (token === "$") {
      result += "$";
      index += 1;
    } else if (token === "&") {
      result += match.match;
      index += 1;
    } else if (token === "`") {
      result += match.input.slice(0, match.index);
      index += 1;
    } else if (token === "'") {
      result += match.input.slice(match.end);
      index += 1;
    } else if (token === "<") {
      const close = replacement.indexOf(">", index + 2);
      const name = close === -1 ? "" : replacement.slice(index + 2, close);
      if (close !== -1 && match.namedGroups) {
        result += match.namedGroups[name] ?? "";
        index = close;
      } else {
        result += "$";
      }
    } else if (token >= "0" && token <= "9") {
      const first = Number(token);
      const secondToken = replacement[index + 2];
      const hasSecond = secondToken >= "0" && secondToken <= "9";
      const twoDigit = hasSecond ? first * 10 + Number(secondToken) : first;
      if (twoDigit > 0 && twoDigit <= match.captures.length) {
        result += match.captures[twoDigit - 1] ?? "";
        index += hasSecond ? 2 : 1;
      } else if (hasSecond && first > 0 && first <= match.captures.length) {
        result += match.captures[first - 1] ?? "";
        result += secondToken;
        index += 2;
      } else {
        result += "$";
      }
    } else {
      result += "$";
    }
  }
  return result;
}
