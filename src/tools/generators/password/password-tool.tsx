import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import {
  generatePassword,
  CHAR_CLASSES,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from "./password";

type ClassKey = (typeof CHAR_CLASSES)[number]["key"];

/**
 * Password generator backed by Web Crypto (see `src/lib/random.ts`). Output is
 * produced on click; class toggles and a length slider drive generation.
 */
export default function PasswordTool() {
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<ClassKey, boolean>>({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  });
  const [output, setOutput] = useState("");

  const noneEnabled = !Object.values(enabled).some(Boolean);

  function toggle(key: ClassKey) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          readOnly
          value={output}
          placeholder="Click Generate…"
          spellCheck={false}
          className="font-mono text-base bg-background/30 border-border/50 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/50 transition-all duration-300 rounded-lg h-11 px-4 tracking-wide font-semibold select-all"
        />
        {output && <CopyButton text={output} />}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() =>
            setOutput(
              generatePassword({
                length,
                uppercase: enabled.uppercase,
                lowercase: enabled.lowercase,
                digits: enabled.digits,
                symbols: enabled.symbols,
              }),
            )
          }
          className="h-10 px-5 rounded-lg shadow-sm"
          disabled={noneEnabled}
        >
          Generate
        </Button>
        {noneEnabled && (
          <span className="text-xs font-medium text-destructive">
            Enable at least one character class.
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 bg-muted/20 px-4 py-3 rounded-xl border border-border/40 backdrop-blur-sm">
        <label className="w-20 text-xs font-bold font-display uppercase tracking-widest text-muted-foreground/80">Length</label>
        <input
          type="range"
          min={PASSWORD_MIN}
          max={PASSWORD_MAX}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="flex-1 accent-primary h-1 rounded-lg cursor-pointer bg-border/80"
        />
        <Input
          type="number"
          min={PASSWORD_MIN}
          max={PASSWORD_MAX}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="h-9 w-20 bg-background/30 border-border/50 text-center font-mono rounded-lg"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CHAR_CLASSES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            aria-pressed={enabled[c.key]}
            className={cn(
              "rounded-lg border px-4 py-2 text-xs font-semibold font-sans transition-colors duration-150 shadow-sm",
              enabled[c.key]
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground hover:bg-accent/40",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
