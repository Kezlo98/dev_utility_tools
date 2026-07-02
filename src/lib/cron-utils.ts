import { parseExpression } from "cron-parser";
import cronstrue from "cronstrue";

/** Subset of cron syntax this tool accepts (cron-parser + cronstrue share it). */
export const CRON_SYNTAX_NOTE =
  "Standard 5-field cron: minute hour day-of-month month day-of-week. " +
  "Ranges (-), lists (,), steps (*/n), and * are supported. The ? wildcard " +
  "(common in Quartz) is not — use * instead.";

/**
 * Curated fallback timezone list, used when
 * `Intl.supportedValuesOf("timeZone")` is unavailable (older WebViews).
 */
export const FALLBACK_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/** Best-effort IANA timezone list the host WebView can render. */
export function listTimezones(): string[] {
  try {
    // supportedValuesOf is missing on very old engines; guard accordingly.
    const zones = (
      Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf?.("timeZone");
    if (zones && zones.length > 0) return zones;
  } catch {
    // fall through to curated list
  }
  return FALLBACK_TIMEZONES;
}

/** The user's system timezone, if resolvable. */
export function systemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Human-readable description of a cron expression, or an error message. */
export function describe(expression: string): string {
  try {
    return cronstrue.toString(expression, {
      verbose: true,
      throwExceptionOnParseError: true,
    });
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/** True when both cronstrue and cron-parser accept the expression. */
export function isValidCron(expression: string): boolean {
  try {
    cronstrue.toString(expression);
    parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}

export type CronFieldMode = "5" | "6";

export interface NormalizedExpr {
  /** 5-field expression to feed cronstrue / cron-parser. */
  fiveField: string;
  /** Seconds field when 6-field mode is active, otherwise undefined. */
  seconds?: string;
  /** Set when the input does not match the selected field mode's shape. */
  error?: string;
}

/**
 * Normalize raw input for the selected field mode. 5-field mode passes the
 * trimmed input through unchanged (cronstrue/cron-parser validate leniently).
 * 6-field mode requires exactly six tokens and strips the leading seconds
 * field — cron-parser v4 schedules at minute granularity, so seconds are
 * surfaced separately and never silently misparsed as a minute value.
 */
export function normalizeExpression(
  input: string,
  mode: CronFieldMode,
): NormalizedExpr {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (mode === "6") {
    if (tokens.length !== 6) {
      return {
        fiveField: "",
        error:
          "6-field mode needs exactly 6 fields: seconds minute hour day month weekday.",
      };
    }
    return { fiveField: tokens.slice(1).join(" "), seconds: tokens[0] };
  }
  return { fiveField: input.trim() };
}

export interface NextRun {
  /** Absolute epoch milliseconds. */
  millis: number;
  /** Display string formatted in the chosen timezone + locale. */
  label: string;
}

/**
 * Next `count` executions of `expression` after `from` in `tz`. Returns an
 * empty array when the expression is invalid — callers surface `describe()` for
 * the reason. Guards against runaway iterators with a hard cap.
 */
export function nextRuns(
  expression: string,
  count: number,
  tz: string,
  from: Date = new Date(),
): NextRun[] {
  try {
    const it = parseExpression(expression, { tz, currentDate: from });
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "long",
      timeZone: tz,
    });
    const runs: NextRun[] = [];
    // Cap iterations so a malformed expression can never spin forever.
    const cap = Math.min(Math.max(count, 0), 100);
    for (let i = 0; i < cap; i++) {
      const next = it.next();
      runs.push({
        millis: next.getTime(),
        label: formatter.format(next.toDate()),
      });
    }
    return runs;
  } catch {
    return [];
  }
}

export interface CrontabRow {
  /** 1-based source line number. */
  line: number;
  /** Raw, untrimmed source line. */
  raw: string;
  expr: string;
  command: string;
  valid: boolean;
  description: string;
  error?: string;
  next?: string;
}

/**
 * Parse crontab-style multiline text. Blank lines and `#` comment lines are
 * skipped from the result. Each remaining row is split on whitespace: the first
 * five fields form the cron expression, the rest form the command. A 6-field
 * expression (with seconds) is not supported in crontab mode — only classic
 * 5-field entries, which is the crontab convention.
 */
export function parseCrontab(text: string, tz: string): CrontabRow[] {
  const rows: CrontabRow[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    // Split into tokens; first 5 are the expression, remainder is the command.
    // A real crontab entry always has a command, so fewer than 6 tokens is
    // malformed — a bare 5-field expression with nothing to run is invalid.
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 6) {
      rows.push({
        line: lineNo,
        raw,
        expr: trimmed,
        command: "",
        valid: false,
        description: "",
        error: "Needs 5 cron fields plus a command.",
      });
      return;
    }

    const expr = tokens.slice(0, 5).join(" ");
    const command = tokens.slice(5).join(" ");

    let description = "";
    let error: string | undefined;
    try {
      cronstrue.toString(expr, { throwExceptionOnParseError: true });
      description = describe(expr);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const runs = error ? [] : nextRuns(expr, 1, tz);
    rows.push({
      line: lineNo,
      raw,
      expr,
      command,
      valid: !error,
      description,
      error,
      next: runs[0]?.label,
    });
  });

  return rows;
}
