import { load, dump, CORE_SCHEMA } from "js-yaml";

/**
 * YAML formatter. Re-emits valid YAML with 2-space indent and a 120-char wrap.
 * Uses CORE_SCHEMA to disable JS-specific tags (e.g. `!!js/function`) so
 * untrusted YAML cannot trigger code execution on parse.
 */
export function formatYaml(input: string): { output: string; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: null };
  try {
    const value = load(trimmed, { schema: CORE_SCHEMA });
    return { output: dump(value, { indent: 2, lineWidth: 120 }), error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : String(e) };
  }
}
