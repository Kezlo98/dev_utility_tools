import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/** Tool categories drive MenuPanel grouping and registry barrels. */
export type ToolCategory =
  | "format-validate"
  | "encode-hash-crypto"
  | "generators"
  | "text-dev"
  | "cron";

/**
 * A single developer utility tool. Each tool plugs into ToolPageShell and the
 * command palette without knowing about the surrounding shell.
 */
export interface Tool {
  /** Stable unique id, used as persistence key and palette token. */
  id: string;
  /** Display name (A→Z sorted in the menu). */
  name: string;
  /** Lucide icon rendered in menu + palette. */
  icon: LucideIcon;
  category: ToolCategory;
  /** Renders inside ToolPageShell. */
  component: ComponentType;
  /** Extra tokens fed to palette fuzzy filter alongside name. */
  keywords?: string[];
}

export type ThemeMode = "light" | "dark" | "system";

/** Human-readable category labels for section headers. */
export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  "format-validate": "Format & Validate",
  "encode-hash-crypto": "Encode / Hash / Crypto",
  generators: "Generators",
  "text-dev": "Text & Dev",
  cron: "Cron",
};
