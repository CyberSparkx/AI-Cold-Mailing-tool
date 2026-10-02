"use client";

import { signIn } from "next-auth/react";
import { Mail, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard/overview" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-xl">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Connect your Google account to access your personal cold outreach suite.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-11 flex items-center justify-center gap-3 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <div className="p-3.5 rounded-lg bg-accent/40 border border-border/80 text-[11px] text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Incremental Scope Permission</span>
            </div>
            <p className="leading-relaxed">
              Sign-in only requests basic identity. Outreach and inbox permissions (Gmail Send/Read, Sheets) are requested strictly on demand per module.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 text-center">
          <a
            href="https://narenroy.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:text-foreground font-mono"
          >
            Developed by Naren Roy
          </a>
        </div>
      </div>
    </div>
  );
}
