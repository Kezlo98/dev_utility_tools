import { ArrowLeftRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Encode/decode direction shared by the Base64 and URL tools. */
export type Direction = "encode" | "decode";

interface Props {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  encodeLabel?: string;
  decodeLabel?: string;
}

/**
 * Two-segment Encode/Decode switch with a flip button. Shared by the Base64
 * and URL tools so their direction UI stays identical.
 */
export function DirectionToggle({
  direction,
  onDirectionChange,
  encodeLabel = "Encode",
  decodeLabel = "Decode",
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-md border border-input p-0.5">
        {(["encode", "decode"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => onDirectionChange(dir)}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              direction === dir
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {dir === "encode" ? encodeLabel : decodeLabel}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Swap direction"
        title="Swap direction"
        onClick={() => onDirectionChange(direction === "encode" ? "decode" : "encode")}
      >
        <ArrowLeftRight />
      </Button>
    </div>
  );
}
