import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyText } from "@/lib/copy";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  /** Controlled input value (source text the user edits). */
  input: string;
  onInputChange: (value: string) => void;
  /** Transformed result. Ignored when `error` is set. */
  output: string;
  /** When set, the output pane renders this message instead of `output`. */
  error?: string | null;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  /** Optional toolbar rendered above the two panes (e.g. language dropdown, direction toggle). */
  controls?: ReactNode;
}

/**
 * Shared side-by-side input/output layout used by every Format & Encode tool.
 * The input pane is editable; the output pane is read-only and shows either the
 * transformed result or a readable error. A copy button sits on the output
 * header with a transient "Copied" confirmation — no global toast needed.
 */
export function ToolIoPanels({
  input,
  onInputChange,
  output,
  error = null,
  inputPlaceholder,
  outputPlaceholder,
  controls,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      {controls && <div className="flex items-center gap-2">{controls}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <Pane label="Input">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={false}
            className="min-h-[40vh] flex-1 resize-none font-mono text-sm"
          />
        </Pane>
        <Pane label="Output" action={<CopyButton text={error ? "" : output} disabled={!!error || !output} />}>
          {error ? (
            <p
              role="alert"
              className="min-h-[40vh] flex-1 overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive"
            >
              {error}
            </p>
          ) : (
            <Textarea
              value={output}
              readOnly
              placeholder={outputPlaceholder}
              spellCheck={false}
              className="min-h-[40vh] flex-1 resize-none font-mono text-sm"
            />
          )}
        </Pane>
      </div>
    </div>
  );
}

function Pane({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function CopyButton({ text, disabled }: { text: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Copy output"
      title="Copy output"
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
