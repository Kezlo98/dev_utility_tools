import { useMemo, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { computeDiff } from "./diff";

/**
 * Side-by-side text diff. Two editable inputs render a colored line diff below
 * (green = added, red = removed). An ignore-whitespace toggle normalizes both
 * sides so pure formatting changes collapse.
 */
export default function DiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const { parts, error } = useMemo(
    () => computeDiff(left, right, ignoreWhitespace),
    [left, right, ignoreWhitespace],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Ignore whitespace
        </label>
      </div>
      <div className="grid min-h-[24vh] grid-cols-1 gap-3 md:grid-cols-2">
        <Textarea
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="Original text…"
          spellCheck={false}
          className="min-h-[24vh] flex-1 resize-none font-mono text-sm"
        />
        <Textarea
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Changed text…"
          spellCheck={false}
          className="min-h-[24vh] flex-1 resize-none font-mono text-sm"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        {error ? (
          <p role="alert" className="p-3 text-sm text-destructive">
            {error}
          </p>
        ) : parts.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Diff appears here…</p>
        ) : (
          <pre className="font-mono text-sm">
            {parts.map((part, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap px-3 py-0.5",
                  part.added && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  part.removed && "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                )}
              >
                {part.value}
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}
