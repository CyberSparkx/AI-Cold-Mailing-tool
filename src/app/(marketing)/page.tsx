import Link from "next/link";
import { ArrowRight, Sparkles, Send, Inbox, ShieldCheck, Database, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="h-16 border-b border-border/80 px-6 sm:px-12 flex items-center justify-between backdrop-blur-md bg-background/50 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            CM
          </div>
          <span className="font-semibold text-sm tracking-tight">Cold Outreach Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard/overview">
            <Button size="sm" className="gap-2">
              Launch Console
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-6 sm:px-12 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs font-mono mb-8 text-muted-foreground shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Autonomous 3-Module Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
          Targeted outreach that respects boundaries and safeguards reputation.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          A modular platform engineered for high-intent client acquisition. Generate leads from verified directories, dispatch throttled cold sequences via Gmail, and classify inbound opportunities using Gemini AI.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard/overview">
            <Button size="lg" className="gap-2 px-6">
              Enter Workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/leads/new">
            <Button size="lg" variant="outline" className="gap-2 px-6">
              <Sparkles className="h-4 w-4 text-primary" />
              Lead Generator
            </Button>
          </Link>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">1. Lead Discovery</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Provider-agnostic search across OpenStreetMap, directories, and CSV files with automated domain deduplication and phone/email normalization.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Send className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">2. Safe Campaigns</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              4-tier duplicate protection, durable daily limits, automatic warm-up ramping, and HMAC one-click unsubscribe headers in every send.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Inbox className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">3. Opportunity Inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Incremental Gmail sync with zero mailbox bloat. High-precision Gemini structured classification separates genuine inquiries from noise.
            </p>
          </div>
        </div>

        {/* Technical Specs Strip */}
        <div className="mt-16 w-full p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-wrap items-center justify-around gap-4 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>MongoDB + Prisma</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>ContactLedger Dedupe</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>BullMQ Redis Queue</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>Designed for autonomous outreach & lead acquisition.</div>
        <div className="flex items-center gap-4">
          <a
            href="https://narenroy.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Author: Naren Roy (narenroy.in)
          </a>
        </div>
      </footer>
    </div>
  );
}
