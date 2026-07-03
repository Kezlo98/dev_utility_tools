import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ThemeMode } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

/** Light / Dark / System dropdown. The chosen mode is persisted in the store. */
export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const Active = OPTIONS.find((o) => o.mode === theme)!.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2.5 bg-background/30 border-border/50 hover:bg-accent/80 transition-all duration-300 rounded-lg shadow-sm"
        >
          <Active className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize font-sans text-sm">{theme}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {OPTIONS.map(({ mode, label, icon: Icon }) => (
          <DropdownMenuItem key={mode} onClick={() => setTheme(mode)}>
            <Icon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
