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
    {
      label: "Unix (seconds)",
      value: view.unixSeconds ? String(view.unixSeconds) : "",
    },
    {
      label: "Unix (ms)",
      value: view.unixMillis ? String(view.unixMillis) : "",
    },
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
          className="font-mono text-sm bg-background/30 border-border/50 placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 focus-visible:border-primary/50 transition-all duration-300 rounded-lg h-10"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput(String(Date.now()))}
          className="bg-background/30 border-border/50 hover:bg-accent/80 shrink-0 h-10 px-4"
        >
          Now (ms)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
          className="bg-background/30 border-border/50 hover:bg-accent/80 shrink-0 h-10 px-4"
        >
          Now (s)
        </Button>
      </div>

      {view.error ? (
        <p role="alert" className="text-sm text-destructive">
          {view.error}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/20 backdrop-blur-sm shadow-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 last:border-b-0 hover:bg-accent/40 transition-all duration-300"
            >
              <span className="w-36 shrink-0 text-[11px] font-bold font-display uppercase tracking-widest text-muted-foreground/80">
                {row.label}
              </span>
              <code className="flex-1 truncate font-mono text-sm text-foreground/90">
                {row.value || "-"}
              </code>
              {row.value && <CopyButton text={row.value} compact />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
