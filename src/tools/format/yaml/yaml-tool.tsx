import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import { formatYaml } from "./format-yaml";

/** YAML pretty-printer. Reparse + re-emit on every keystroke. */
export default function YamlTool() {
  const [input, setInput] = useState("");
  const { output, error } = useMemo(() => formatYaml(input), [input]);

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      inputPlaceholder={"key: value\nlist:\n  - one\n  - two"}
      outputPlaceholder="Formatted YAML appears here…"
    />
  );
}
