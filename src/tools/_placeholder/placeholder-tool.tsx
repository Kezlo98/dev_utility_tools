import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Temporary tool to exercise the full shell before any real tool exists:
 * favorite toggle, palette navigation, error boundary. Echoes input and offers
 * a button that deliberately throws to verify the boundary catches it.
 */
function PlaceholderTool() {
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Core shell is live. Real tools arrive in Phases 3–6. Try the favorite
        star above, <kbd>Cmd/Ctrl+K</kbd> for the palette, or the button below
        to test the error boundary.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something to see it echoed…"
        rows={6}
      />
      <p className="text-sm">
        <span className="text-muted-foreground">Echo:</span> {text || "(empty)"}
      </p>
      <Button
        variant="destructive"
        onClick={() => {
          throw new Error("Simulated tool crash — the boundary should catch this.");
        }}
      >
        Test error boundary
      </Button>
    </div>
  );
}

export default PlaceholderTool;
