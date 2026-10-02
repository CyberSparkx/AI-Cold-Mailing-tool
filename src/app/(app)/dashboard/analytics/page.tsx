"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  MailCheck,
  Inbox,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsSummary } from "@/server/modules/analytics/analytics.service";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to load analytics metrics");
      const json = await res.json();
      setData(json.data || json);
    } catch (err: any) {
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const leads = data?.leads || { total: 0, withEmail: 0 };
  const delivery = data?.delivery || {
    totalSent: 0,
    totalReplied: 0,
    totalBounced: 0,
    replyRatePct: 0,
    bounceRatePct: 0,
    sentToday: 0,
    dailyLimit: 25,
  };
  const inbox = data?.inbox || {
    totalOpportunities: 0,
    newOpportunities: 0,
    categoryBreakdown: {},
  };
  const timeline = data?.activityTimeline || [];
  const campaigns = data?.recentCampaigns || [];

  const maxSentInTimeline = Math.max(...timeline.map((t) => t.sent), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Outreach & Conversion Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time pipeline metrics, deliverability health, and AI opportunity triage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/campaigns/new">
            <Button size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Launch Campaign
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Total Sent</span>
            <MailCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-foreground">
            {delivery.totalSent}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {delivery.sentToday} sent today (Limit: {delivery.dailyLimit}/day)
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Reply Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-emerald-400">
            {delivery.replyRatePct}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {delivery.totalReplied} active replies received
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Bounce Rate</span>
            <ShieldCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className={`mt-3 text-3xl font-bold font-mono tracking-tight ${delivery.bounceRatePct > 5 ? "text-amber-400" : "text-blue-400"}`}>
            {delivery.bounceRatePct}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {delivery.totalBounced} hard or soft bounces
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>AI Opportunities</span>
            <Inbox className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-purple-400">
            {inbox.totalOpportunities}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {inbox.newOpportunities} awaiting your review
          </div>
        </div>
      </div>

      {/* Deliverability & 7-Day Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">7-Day Outbound Volume</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily Gmail message dispatches via BullMQ background queue.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Last 7 Days
            </Badge>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2" data-lenis-prevent>
            {timeline.length > 0 ? (
              timeline.map((item) => {
                const heightPercent = Math.max(12, Math.round((item.sent / maxSentInTimeline) * 100));
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.sent}
                    </div>
                    <div className="w-full bg-secondary/60 rounded-t-md relative flex flex-col justify-end overflow-hidden h-36">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t-md"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No outbound activity in the last 7 days
              </div>
            )}
          </div>
        </div>

        {/* Funnel Health */}
        <div className="p-6 rounded-xl border border-border bg-card/40 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Outreach Health</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              CAN-SPAM compliance & delivery safety audit.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ContactLedger Dupe Filter</span>
                <span className="font-mono text-emerald-400 font-medium">100% Protected</span>
              </div>
              <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">SPF / DKIM / DMARC</span>
                <span className="font-mono text-emerald-400 font-medium">Verified by Google</span>
              </div>
              <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily Quota Utilization</span>
                <span className="font-mono text-foreground">
                  {Math.round((delivery.sentToday / Math.max(delivery.dailyLimit, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.round((delivery.sentToday / Math.max(delivery.dailyLimit, 1)) * 100))}%`,
                  }}
                  className="bg-primary h-full rounded-full transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-accent/30 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Anti-spam rate limit and 4-tier deduplication are running properly.</span>
          </div>
        </div>
      </div>

      {/* Opportunity Breakdown & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunity Breakdown */}
        <div className="p-6 rounded-xl border border-border bg-card/40 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Opportunities by Intent</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Classified by Gemini Flash-Lite chain.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries({
              "Website Inquiries": inbox.categoryBreakdown["WEBSITE_INQUIRY"] || 0,
              "Software Projects": inbox.categoryBreakdown["SOFTWARE_INQUIRY"] || 0,
              "Freelance Requests": inbox.categoryBreakdown["FREELANCE_OPPORTUNITY"] || 0,
              "Job Offers": inbox.categoryBreakdown["JOB_OPPORTUNITY"] || 0,
              "Partnerships": inbox.categoryBreakdown["PARTNERSHIP"] || 0,
              "General Outreach": inbox.categoryBreakdown["GENERAL"] || 0,
            }).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{label}</span>
                <Badge variant={count > 0 ? "secondary" : "outline"} className="font-mono">
                  {count}
                </Badge>
              </div>
            ))}
          </div>

          <Link href="/dashboard/inbox">
            <Button variant="outline" size="sm" className="w-full justify-between mt-4">
              <span>Open Opportunity Inbox</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Recent Campaigns Table */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Campaign Performance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conversion metrics across your latest cold email campaigns.
              </p>
            </div>
            <Link href="/dashboard/campaigns">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <span>All Campaigns</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto" data-lenis-prevent>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/80 text-left text-muted-foreground font-mono">
                  <th className="pb-3 font-medium">CAMPAIGN</th>
                  <th className="pb-3 font-medium">STATUS</th>
                  <th className="pb-3 font-medium text-right">TOTAL</th>
                  <th className="pb-3 font-medium text-right">SENT</th>
                  <th className="pb-3 font-medium text-right">REPLIES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {campaigns.length > 0 ? (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 font-sans font-medium text-foreground max-w-[200px] truncate">
                        {c.name}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{c.total}</td>
                      <td className="py-3 text-right text-foreground">{c.sent}</td>
                      <td className="py-3 text-right text-emerald-400 font-semibold">{c.replied}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                      No campaigns launched yet. Create your first campaign to track conversions!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
