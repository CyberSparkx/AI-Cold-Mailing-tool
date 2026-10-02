"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Brain, Cpu, DollarSign, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiSummary {
  month: string;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  tokenCap: number;
  percentUsed: number;
  estimatedCostUsd: number;
}

export default function AiSettingsPage() {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [testInput, setTestInput] = useState("Hi Naren, we are looking to hire a freelance engineer for our Next.js dashboard project. What is your availability?");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/ai");
      const json = await res.json();
      if (res.ok) setSummary(json.data);
    } catch {
      // offline / mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleTestClassify = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLASSIFY", sampleInput: testInput }),
      });
      const json = await res.json();
      setTestResult(json.data);
    } catch {
      alert("Failed to test AI chain");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gemini AI Models & Token Budget
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model tiering, LangChain structured output chains, and durable monthly expenditure caps.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">MONTHLY TOKEN USAGE</span>
          <div className="mt-2 text-2xl font-semibold font-mono">
            {summary?.totalTokens.toLocaleString() || 0} / {summary?.tokenCap.toLocaleString() || "1,000,000"}
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${summary?.percentUsed || 0}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-1.5 block">
            {summary?.percentUsed || 0}% of monthly budget cap
          </span>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">ESTIMATED SPEND (USD)</span>
          <div className="mt-2 text-2xl font-semibold font-mono text-emerald-400">
            ${summary?.estimatedCostUsd.toFixed(4) || "0.0000"}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-3 block">
            Gemini 2.0 Flash-Lite tiering saves ~85%
          </span>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">MODEL TIERING</span>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div>Classify: <span className="text-primary font-semibold">Flash-Lite</span></div>
            <div>Personalize: <span className="text-purple-400 font-semibold">Flash</span></div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-2 block">
            Pre-filtered before LLM invocation
          </span>
        </div>
      </div>

      {/* Sandbox Test Card */}
      <div className="p-6 rounded-xl border border-border bg-card/60 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Interactive AI Triage Sandbox</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground">SAMPLE INCOMING EMAIL SNIPPET</label>
          <textarea
            rows={3}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full px-3 py-2 text-xs font-sans rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Structured LangChain output with prompt injection safety
          </span>
          <Button
            onClick={handleTestClassify}
            disabled={testing}
            size="sm"
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {testing ? "Analyzing..." : "Test Classification"}
          </Button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs font-mono">
            <div className="text-primary font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Structured Output Parsed</span>
            </div>
            <pre className="p-3 rounded-lg bg-background border border-border text-[11px] text-foreground overflow-x-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
