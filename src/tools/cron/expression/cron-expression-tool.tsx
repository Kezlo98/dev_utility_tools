import { useMemo, useState } from "react";

import {
  describe,
  isValidCron,
  nextRuns,
  listTimezones,
  systemTimezone,
  normalizeExpression,
  CRON_SYNTAX_NOTE,
  type CronFieldMode,
} from "@/lib/cron-utils";
import { Input } from "@/components/ui/input";

/**
 * Cron expression explorer: type an expression, get a plain-English
 * description, the next 10 executions in a chosen timezone, and 5/6-field
 * mode. Invalid input is caught by the parser, never by the error boundary.
 * In 6-field mode the leading seconds field is stripped for scheduling
 * (cron-parser v4 is minute-granular) and surfaced explicitly — never silently
 * misparsed.
 */
export default function CronExpressionTool() {
  const [expr, setExpr] = useState("0 9 * * 1");
  const [mode, setMode] = useState<CronFieldMode>("5");
  const [tz, setTz] = useState(systemTimezone());

  const zones = useMemo(() => listTimezones(), []);
  const normalized = useMemo(
    () => normalizeExpression(expr, mode),
    [expr, mode],
  );
  const target = normalized.fiveField;
  const valid = !!target && isValidCron(target);
  const description = useMemo(
    () => (valid ? describe(target) : ""),
    [target, valid],
  );
  const runs = useMemo(
    () => (valid ? nextRuns(target, 10, tz) : []),
    [target, valid, tz],
  );

  const empty = !expr.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="minute hour day month weekday   ·   0 9 * * 1"
          spellCheck={false}
          className="flex-1 font-mono text-sm"
          aria-label="Cron expression"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Fields
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as CronFieldMode)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Field mode"
          >
            <option value="5">5 (standard)</option>
            <option value="6">6 (with seconds)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Timezone
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="h-9 max-w-[12rem] rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Timezone"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>

      {normalized.error ? (
        <p role="alert" className="text-sm text-destructive">
          {normalized.error}{" "}
          <span className="text-muted-foreground">{CRON_SYNTAX_NOTE}</span>
        </p>
      ) : !valid ? (
        <p role="alert" className="text-sm text-destructive">
          {empty
            ? "Enter a cron expression to begin."
            : "Invalid cron expression."}{" "}
          <span className="text-muted-foreground">{CRON_SYNTAX_NOTE}</span>
        </p>
      ) : (
        <>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </span>
            <p className="mt-1 text-sm">{description}</p>
            {normalized.seconds && (
              <p className="mt-1 text-xs text-muted-foreground">
                Seconds field "{normalized.seconds}" applies to the description;
                run preview is scheduled at minute granularity.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="w-12 px-3 py-2">#</th>
                  <th className="px-3 py-2">Next execution ({tz})</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr
                    key={r.millis}
                    className="border-b border-border px-3 last:border-b-0 odd:bg-muted/20"
                  >
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">{r.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
