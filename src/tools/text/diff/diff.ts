import { diffLines, type Change } from "diff";

/** Per-side input cap to keep the WebView responsive on large pastes. */
export const MAX_DIFF_INPUT = 100 * 1024; // 100 KB

export interface DiffResult {
  parts: Change[];
  error: string | null;
}

/** Collapse internal whitespace runs and trim each line, preserving structure. */
function normalizeWhitespace(input: string): string {
  return input
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n");
}

/**
 * Line diff of two inputs. When `ignoreWhitespace` is set, both sides are
 * whitespace-normalized first so pure formatting changes (indentation, line
 * breaks) collapse to "no change". Inputs over 100 KB each are rejected with a
 * readable error rather than freezing the UI.
 */
export function computeDiff(a: string, b: string, ignoreWhitespace: boolean): DiffResult {
  if (a.length > MAX_DIFF_INPUT || b.length > MAX_DIFF_INPUT) {
    return {
      parts: [],
      error: `Inputs are capped at ${MAX_DIFF_INPUT / 1024} KB per side to keep the UI responsive.`,
    };
  }
  const left = ignoreWhitespace ? normalizeWhitespace(a) : a;
  const right = ignoreWhitespace ? normalizeWhitespace(b) : b;
  return { parts: diffLines(left, right), error: null };
}
