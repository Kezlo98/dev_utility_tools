import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { runRegex, buildSegments } from "./regex";

const FLAG_RE = /^[gimsuy]*$/;

/**
 * Regex tester. Pattern + flags drive live inline highlighting of the test
 * string and a group table from the first match. Input length caps guard
 * against catastrophic pattern sizes (ReDoS on the engine itself is an
 * accepted trade-off per the phase plan).
 */
export default function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [test, setTest] = useState("");

  const flagError = FLAG_RE.test(flags)
    ? null
    : "Flags must be any of g i m s u y.";
  const { matches, error } = useMemo(
    () =>
      flagError
        ? { matches: [], error: flagError }
        : runRegex(pattern, flags, test),
    [pattern, flags, test, flagError],
  );
  const segments = useMemo(() => buildSegments(test, matches), [test, matches]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center rounded-md border border-input px-2">
          <span className="select-none text-muted-foreground">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            spellCheck={false}
            className="h-9 flex-1 bg-transparent px-1 font-mono text-sm outline-none"
          />
          <span className="select-none text-muted-foreground">/</span>
        </div>
        <Input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          aria-label="Flags"
          spellCheck={false}
          className="h-9 w-20 font-mono text-sm"
        />
      </div>
      <Textarea
        value={test}
        onChange={(e) => setTest(e.target.value)}
        placeholder="Test string…"
        spellCheck={false}
        className="min-h-[16vh] resize-none font-mono text-sm"
      />
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border p-3">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </p>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">
              {segments.length === 0 ? (
                <span className="text-muted-foreground">
                  Highlights appear here…
                </span>
              ) : (
                segments.map((seg, i) => (
                  <span
                    key={i}
                    className={cn(
                      seg.matched &&
                        "rounded bg-yellow-500/30 dark:bg-yellow-500/40",
                    )}
                  >
                    {seg.text}
                  </span>
                ))
              )}
            </pre>
            {matches[0] && matches[0].groups.length > 0 && (
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="border-b border-border px-2 py-1">Group</th>
                    <th className="border-b border-border px-2 py-1">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {matches[0].groups.map((g, i) => (
                    <tr key={i} className="odd:bg-muted/30">
                      <td className="px-2 py-1 font-mono text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="break-all px-2 py-1 font-mono">
                        {g ?? "(undefined)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
