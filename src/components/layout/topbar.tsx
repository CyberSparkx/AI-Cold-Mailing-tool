"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border/80 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
          <span>SYSTEM READY</span>
          <span>/</span>
          <span className="text-foreground font-sans font-medium">Outreach Platform</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/50 border border-border/80 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground text-[11px] font-mono">Dedupe & Anti-Spam Guard Active</span>
        </div>

        <a
          href="https://narenroy.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-accent/50"
        >
          <span>Portfolio</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
