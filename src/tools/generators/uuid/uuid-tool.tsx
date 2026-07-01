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
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-input p-0.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                kind === k.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Count
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-8 w-20"
          />
        </label>
        <Button size="sm" onClick={() => setOutput(generateBulk(kind, count))}>
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
        className="min-h-[50vh] flex-1 resize-none font-mono text-sm"
      />
    </div>
  );
}
