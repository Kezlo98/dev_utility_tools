import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { toTimestamp } from "./timestamp";

/** Two-way Unix timestamp ↔ ISO 8601 converter. Updates live as you type. */
export default function TimestampTool() {
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));
  const view = useMemo(() => toTimestamp(input), [input]);

  const rows = [
    { label: "Unix (seconds)", value: view.unixSeconds ? String(view.unixSeconds) : "" },
    { label: "Unix (ms)", value: view.unixMillis ? String(view.unixMillis) : "" },
    { label: "UTC (ISO 8601)", value: view.isoUtc },
    { label: "Local time", value: view.isoLocal },
    { label: "Weekday", value: view.weekday },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1700000000  ·  1700000000000  ·  2023-11-14T22:13:20Z"
          spellCheck={false}
          className="font-mono text-sm"
        />
        <Button variant="outline" size="sm" onClick={() => setInput(String(Date.now()))}>
          Now (ms)
        </Button>
        <Button variant="outline" size="sm" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
          Now (s)
        </Button>
      </div>

      {view.error ? (
        <p role="alert" className="text-sm text-destructive">
          {view.error}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0 odd:bg-muted/30"
            >
              <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </span>
              <code className="flex-1 truncate font-mono text-sm">{row.value || "—"}</code>
              {row.value && <CopyButton text={row.value} compact />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
