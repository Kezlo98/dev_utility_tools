import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import { formatXml } from "./format-xml";

/** XML pretty-printer. Reparse + re-emit on every keystroke. */
export default function XmlTool() {
  const [input, setInput] = useState("");
  const { output, error } = useMemo(() => formatXml(input), [input]);

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      inputPlaceholder='<root><item id="1">hello</item></root>'
      outputPlaceholder="Formatted XML appears here…"
    />
  );
}
