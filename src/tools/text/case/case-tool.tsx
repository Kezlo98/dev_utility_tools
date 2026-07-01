import { useMemo, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { convertCase, type CaseKind } from "@/lib/case-transforms";

const ORDER: { key: CaseKind; label: string }[] = [
  { key: "camel", label: "camelCase" },
  { key: "pascal", label: "PascalCase" },
  { key: "snake", label: "snake_case" },
  { key: "kebab", label: "kebab-case" },
  { key: "constant", label: "CONSTANT_CASE" },
  { key: "title", label: "Title Case" },
];

/**
 * Case converter. Tokenizes the input once and re-emits six common variants
 * side by side, updating live.
 */
export default function CaseTool() {
  const [input, setInput] = useState("");
  const variants = useMemo(() => convertCase(input), [input]);

  return (
    <div className="flex h-full flex-col gap-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="helloWorld  ·  hello_world  ·  Hello World …"
        spellCheck={false}
        className="min-h-[18vh] resize-none font-mono text-sm"
      />
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        {ORDER.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0 odd:bg-muted/30"
          >
            <span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
            <code className="flex-1 break-all font-mono text-sm">{variants[key]}</code>
            {variants[key] && <CopyButton text={variants[key]} compact />}
          </div>
        ))}
      </div>
    </div>
  );
}
