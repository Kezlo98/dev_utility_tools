import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import {
  DirectionToggle,
  type Direction,
} from "@/tools/encode/direction-toggle";
import { transformUrl } from "./url";

/** URL percent-encode/decode tool with a direction-toggle UI. */
export default function UrlTool() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");

  const { output, error } = useMemo(
    () => transformUrl(input, direction),
    [input, direction],
  );

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      controls={
        <DirectionToggle
          direction={direction}
          onDirectionChange={setDirection}
        />
      }
      inputPlaceholder={
        direction === "encode"
          ? "Text to URL-encode…"
          : "Encoded text to decode…"
      }
      outputPlaceholder={
        direction === "encode" ? "URL-encoded output…" : "Decoded text…"
      }
    />
  );
}
