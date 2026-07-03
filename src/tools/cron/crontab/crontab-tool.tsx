import { useMemo, useState } from "react";

import {
  parseCrontab,
  listTimezones,
  systemTimezone,
  CRON_SYNTAX_NOTE,
} from "@/lib/cron-utils";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = `# m h dom mon dow command
0 9 * * 1 /usr/local/bin/weekly-backup
*/15 * * * * /usr/bin/healthcheck
0 0 1 * * echo "monthly report"
a b c d e broken-command`;

/**
 * Crontab validator: paste a crontab, see each non-comment row parsed into
 * expression, command, plain-English description, next run, and any error.
 * Invalid rows are flagged inline without disrupting the rest.
 */
export default function CrontabTool() {
  const [text, setText] = useState(SAMPLE);
  const [tz, setTz] = useState(systemTimezone());

  const zones = useMemo(() => listTimezones(), []);
  const rows = useMemo(() => parseCrontab(text, tz), [text, tz]);
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
          {invalidCount > 0 && (
            <span className="text-destructive"> · {invalidCount} invalid</span>
          )}
        </span>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Timezone
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="h-8 max-w-[12rem] rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="# m h dom mon dow command"
        spellCheck={false}
        className="min-h-[24vh] flex-1 resize-none font-mono text-sm"
      />

      <p className="text-xs text-muted-foreground">{CRON_SYNTAX_NOTE}</p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries yet. Non-empty, non-comment lines become rows.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="w-12 px-3 py-2">Line</th>
                <th className="px-3 py-2">Expression</th>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Next run</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.line}
                  className={`border-b border-border align-top last:border-b-0 ${
                    r.valid ? "odd:bg-muted/20" : "bg-destructive/5"
                  }`}
                >
                  <td className="px-3 py-2 text-muted-foreground">{r.line}</td>
                  <td className="px-3 py-2 font-mono">{r.expr}</td>
                  <td
                    className="max-w-xs truncate px-3 py-2 font-mono"
                    title={r.command}
                  >
                    {r.command || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {r.valid ? (
                      r.description
                    ) : (
                      <span role="alert" className="text-destructive">
                        {r.error}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {r.next ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
