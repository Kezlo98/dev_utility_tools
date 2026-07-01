/**
 * JSON formatter. Re-pretty-prints valid JSON with 2-space indent. Returns a
 * readable error message for malformed input so the tool never throws.
 */
export function formatJson(input: string): { output: string; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: null };
  try {
    const value = JSON.parse(trimmed);
    return { output: JSON.stringify(value, null, 2), error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : String(e) };
  }
}
