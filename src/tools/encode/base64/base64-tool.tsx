import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import { DirectionToggle, type Direction } from "@/tools/encode/direction-toggle";
import { transformBase64 } from "./base64";

/** Base64 encoder/decoder with a UTF-8 safe, direction-toggle UI. */
export default function Base64Tool() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");

  const { output, error } = useMemo(() => transformBase64(input, direction), [input, direction]);

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      controls={
        <DirectionToggle direction={direction} onDirectionChange={setDirection} />
      }
      inputPlaceholder={direction === "encode" ? "Text to encode…" : "Base64 to decode…"}
      outputPlaceholder={direction === "encode" ? "Base64 output…" : "Decoded text…"}
    />
  );
}
