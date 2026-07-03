import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { generateBulk, type UuidKind } from "./uuid";

const KINDS: { value: UuidKind; label: string }[] = [
  { value: "v4", label: "UUID v4" },
  { value: "v7", label: "UUID v7" },
  { value: "ulid", label: "ULID" },
];

/**
 * UUID/ULID generator. Output is produced on click (never on keystroke) so bulk
 * generation stays cheap and predictable. Count is clamped to 1–100.
 */
export default function UuidTool() {
  const [kind, setKind] = useState<UuidKind>("v4");
  const [count, setCount] = useState(1);
  const [output, setOutput] = useState("");

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="inline-flex rounded-xl bg-muted/40 p-1 border border-border/40 backdrop-blur-sm shadow-sm gap-0.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
                kind === k.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/20",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2.5 text-xs font-bold font-display uppercase tracking-widest text-muted-foreground/80">
          Count
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-9 w-20 bg-background/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 focus-visible:border-primary/50 text-center font-mono rounded-lg"
          />
        </label>
        <Button
          size="sm"
          onClick={() => setOutput(generateBulk(kind, count))}
          className="h-9 px-4 rounded-lg shadow-sm"
        >
          Generate
        </Button>
        <span className="ml-auto">
          <CopyButton text={output} disabled={!output} />
        </span>
      </div>
      <Textarea
        readOnly
        value={output}
        placeholder="Generated ids appear here…"
        spellCheck={false}
        className="min-h-[50vh] flex-1 resize-none font-mono text-sm rounded-xl border-border/50 bg-background/20 backdrop-blur-[2px] p-4 resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary/40"
      />
    </div>
  );
}
