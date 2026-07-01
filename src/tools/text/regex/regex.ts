export const MAX_PATTERN_LEN = 500;
export const MAX_TEST_LEN = 200 * 1024; // 200 KB
/** Hard cap on collected matches so a pathological global pattern can't OOM the UI. */
const MAX_MATCHES = 10000;

export interface RegexMatch {
  index: number;
  match: string;
  groups: (string | undefined)[];
}

export interface RegexResult {
  matches: RegexMatch[];
  error: string | null;
}

/**
 * Run `pattern` (with `flags`) against `test`. Length caps protect against
 * catastrophic input size; a zero-width-match guard and a match ceiling keep
 * global patterns from looping forever. Invalid patterns return a readable
 * error instead of throwing.
 */
export function runRegex(pattern: string, flags: string, test: string): RegexResult {
  if (pattern.length > MAX_PATTERN_LEN) {
    return { matches: [], error: `Pattern exceeds the ${MAX_PATTERN_LEN}-character limit.` };
  }
  if (test.length > MAX_TEST_LEN) {
    return { matches: [], error: `Test string exceeds the ${MAX_TEST_LEN / 1024} KB limit.` };
  }
  if (!pattern) return { matches: [], error: null };

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : String(e) };
  }

  const matches: RegexMatch[] = [];
  const global = re.global;

  if (global) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(test)) !== null) {
      matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
      if (matches.length >= MAX_MATCHES) break;
      // Advance past zero-width matches so the engine doesn't re-match the
      // same position forever (and doesn't emit duplicate indices).
      if (m[0] === "") re.lastIndex++;
    }
  } else {
    const m = re.exec(test);
    if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
  }

  return { matches, error: null };
}

/**
 * Split `test` into plain and matched segments for inline highlighting.
 * Zero-width matches (e.g. `^`, `\b`, `$`) are skipped for highlighting since
 * they consume no characters; advancing past them would otherwise drop input.
 * The result always re-joins to the original `test` string.
 */
export function buildSegments(
  test: string,
  matches: RegexMatch[],
): { text: string; matched: boolean }[] {
  if (matches.length === 0) return test ? [{ text: test, matched: false }] : [];
  const segments: { text: string; matched: boolean }[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.match.length === 0) continue; // zero-width: nothing to highlight
    if (m.index < cursor) continue; // overlap guard
    if (m.index > cursor) segments.push({ text: test.slice(cursor, m.index), matched: false });
    segments.push({ text: m.match, matched: true });
    cursor = m.index + m.match.length;
  }
  if (cursor < test.length) segments.push({ text: test.slice(cursor), matched: false });
  return segments;
}
