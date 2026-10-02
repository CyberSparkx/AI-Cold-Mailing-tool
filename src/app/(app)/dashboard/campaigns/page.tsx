"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Plus, ArrowRight, RefreshCw, Calendar, Mail, AlertCircle, Play, Pause, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  dailyLimit: number;
  stats: {
    total: number;
    sent: number;
    failed: number;
    queued: number;
    replied: number;
    skipped: number;
  };
  startedAt?: string | null;
  createdAt: string;
}

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load campaigns");
      setCampaigns(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Outreach Campaigns
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated, throttled sequences with ContactLedger duplicate prevention and warm-up pacing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchCampaigns}
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/dashboard/campaigns/new">
            <Button size="sm" className="gap-2 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Campaigns Grid */}
      {loading && campaigns.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground font-mono">
          Loading campaign sequences...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-16 rounded-2xl border border-border bg-card/40 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Send className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">No active campaigns yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Launch a sequence by importing prospective leads from your directory or custom CSV snapshot.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard/campaigns/new">
              <Button size="sm" className="gap-2 text-xs">
                <Plus className="h-4 w-4" />
                Launch First Campaign
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const progress = c.stats.total > 0 ? Math.round((c.stats.sent / c.stats.total) * 100) : 0;

            return (
              <div
                key={c.id}
                className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{c.name}</h3>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Created {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>Delivery Progress</span>
                      <span>{c.stats.sent} / {c.stats.total} ({progress}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Pill Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-muted/40 border border-border/50">
                      <span className="text-muted-foreground block text-[10px]">DAILY CAP</span>
                      <span className="font-semibold text-foreground">{c.dailyLimit} / day</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40 border border-border/50">
                      <span className="text-muted-foreground block text-[10px]">FAILED</span>
                      <span className="font-semibold text-rose-400">{c.stats.failed}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40 border border-border/50">
                      <span className="text-muted-foreground block text-[10px]">SKIPPED</span>
                      <span className="font-semibold text-zinc-400">{c.stats.skipped}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {c.status === "RUNNING" ? "Actively dispatching" : "Ready for control"}
                  </span>
                  <Link href={`/dashboard/campaigns/${c.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <span>Manage Sequence</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
