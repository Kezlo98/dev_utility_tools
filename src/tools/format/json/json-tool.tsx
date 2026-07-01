import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import { formatJson } from "./format-json";

/**
 * JSON pretty-printer. Reformats on every keystroke; parse failures render as
 * a readable inline error so the tool stays interactive.
 */
export default function JsonTool() {
  const [input, setInput] = useState("");
  const { output, error } = useMemo(() => formatJson(input), [input]);

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      inputPlaceholder='Paste JSON, e.g. {"hello":"world"}'
      outputPlaceholder="Formatted JSON appears here…"
    />
  );
}
