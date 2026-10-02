"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Users,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  MailCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  dailyLimit: number;
  subjectTemplate: string;
  bodyTemplate: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    queued: number;
    replied: number;
    skipped: number;
  };
  recipients: Array<{
    id: string;
    businessName: string;
    email: string;
    emailStatus: string;
    sentAt?: string | null;
    error?: string | null;
  }>;
  createdAt: string;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "recipients" | "logs">("overview");

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load campaign");
      setCampaign(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleAction = async (action: "START" | "PAUSE" | "RESUME" | "CANCEL") => {
    if (action === "START" && !confirm("Confirm start: Are you ready to begin sending outreach emails for this sequence?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `Failed to ${action} campaign`);
      setCampaign(json.data);
    } catch (err: any) {
      alert(err.message || `Action failed`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="p-12 text-center text-xs font-mono text-muted-foreground">
        Loading sequence details...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-sm text-foreground">Campaign not found</p>
        <Link href="/dashboard/campaigns">
          <Button size="sm" variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const progress = campaign.stats.total > 0
    ? Math.round((campaign.stats.sent / campaign.stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {campaign.name}
              </h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Created {formatDate(campaign.createdAt)} &bull; ID: {campaign.id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {campaign.status === "READY" && (
            <Button
              onClick={() => handleAction("START")}
              disabled={actionLoading}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start Campaign
            </Button>
          )}

          {campaign.status === "RUNNING" && (
            <Button
              onClick={() => handleAction("PAUSE")}
              disabled={actionLoading}
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              Pause
            </Button>
          )}

          {campaign.status === "PAUSED" && (
            <Button
              onClick={() => handleAction("RESUME")}
              disabled={actionLoading}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Resume
            </Button>
          )}

          {campaign.status !== "CANCELLED" && campaign.status !== "COMPLETED" && (
            <Button
              onClick={() => handleAction("CANCEL")}
              disabled={actionLoading}
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Cancel
            </Button>
          )}

          <Button
            onClick={fetchCampaign}
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Progress & Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">TOTAL RECIPIENTS</span>
          <div className="mt-1 text-2xl font-semibold font-mono">{campaign.stats.total}</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">DELIVERED</span>
          <div className="mt-1 text-2xl font-semibold font-mono text-emerald-400">
            {campaign.stats.sent}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">FAILED / ERRORS</span>
          <div className="mt-1 text-2xl font-semibold font-mono text-rose-400">
            {campaign.stats.failed}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60">
          <span className="text-[11px] font-mono text-muted-foreground block">DAILY LIMIT</span>
          <div className="mt-1 text-2xl font-semibold font-mono">{campaign.dailyLimit} / day</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/40 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Overall Sequence Completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-medium gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Templates & Strategy
        </button>
        <button
          onClick={() => setActiveTab("recipients")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "recipients"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Recipient Snapshot ({campaign.recipients.length})
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase">Subject Line</h3>
            <div className="text-sm font-medium text-foreground bg-background p-3 rounded-lg border border-border/80">
              {campaign.subjectTemplate}
            </div>

            <h3 className="text-xs font-mono text-muted-foreground uppercase pt-2">Email Body Template</h3>
            <div className="text-xs whitespace-pre-wrap font-mono text-foreground bg-background p-4 rounded-lg border border-border/80 leading-relaxed">
              {campaign.bodyTemplate}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Recipients */}
      {activeTab === "recipients" && (
        <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs font-mono text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Notes / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaign.recipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground font-mono">
                      No recipients in snapshot.
                    </td>
                  </tr>
                ) : (
                  campaign.recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{r.businessName}</td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{r.email}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.emailStatus} />
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                        {r.sentAt ? formatDate(r.sentAt) : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {r.error || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
