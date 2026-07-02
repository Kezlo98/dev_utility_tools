import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Tool name shown in the fallback so the user knows what failed. */
  toolName?: string;
}

interface State {
  error: Error | null;
}

/**
 * Per-tool error boundary. A throw inside any tool is caught here so the rest
 * of the shell (menu, palette, other tools) stays usable. The reset button
 * clears the error so the user can retry without navigating away.
 */
export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[DevKit] tool "${this.props.toolName ?? "unknown"}" crashed`,
      {
        error,
        info,
      },
    );
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-semibold">This tool hit an error</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.props.toolName ? `${this.props.toolName}: ` : ""}
            {this.state.error.message}
          </p>
          <Button variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
