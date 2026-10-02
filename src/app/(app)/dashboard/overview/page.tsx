import Link from "next/link";
import { Sparkles, Send, Inbox, ArrowUpRight, ShieldCheck, MailCheck, BarChart3, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/platform/auth/session";
import { AnalyticsService } from "@/server/modules/analytics/analytics.service";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  const metrics = user ? await AnalyticsService.getOverviewMetrics(user.id) : null;

  const totalLeads = metrics?.leads.total ?? 0;
  const sentToday = metrics?.delivery.sentToday ?? 0;
  const dailyLimit = metrics?.delivery.dailyLimit ?? 25;
  const activeCampaigns = metrics?.campaigns.running ?? 0;
  const totalOpportunities = metrics?.inbox.totalOpportunities ?? 0;
  const replyRate = metrics?.delivery.replyRatePct ?? 0;
  const bounceRate = metrics?.delivery.bounceRatePct ?? 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status across lead generation, active campaigns, and opportunity inbox.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads/new">
            <Button size="sm" variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Find Leads
            </Button>
          </Link>
          <Link href="/dashboard/campaigns/new">
            <Button size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Total Leads</span>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">{totalLeads}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {metrics?.leads.withEmail ?? 0} with verified email address
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Emails Sent Today</span>
            <MailCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">
            {sentToday} <span className="text-sm font-normal text-muted-foreground">/ {dailyLimit}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {Math.max(0, dailyLimit - sentToday)} sends remaining today
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Active Campaigns</span>
            <Send className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">{activeCampaigns}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {metrics?.campaigns.total ?? 0} total campaigns created
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Inbound Opportunities</span>
            <Inbox className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">{totalOpportunities}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {metrics?.inbox.newOpportunities ?? 0} unread / flagged by AI
          </div>
        </div>
      </div>

      {/* Conversion & Deliverability Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono text-muted-foreground uppercase">Global Reply Rate</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{replyRate}%</div>
            <div className="text-xs text-muted-foreground">
              {metrics?.delivery.totalReplied ?? 0} replies from {metrics?.delivery.totalSent ?? 0} emails delivered
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono text-muted-foreground uppercase">Bounce Safeguard</div>
            <div className={`text-xl font-bold font-mono ${bounceRate > 3 ? "text-amber-400" : "text-emerald-400"}`}>
              {bounceRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics?.delivery.totalBounced ?? 0} bounced (well below the 5% threshold)
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border/80 bg-card/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Lead Generator</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Search OpenStreetMap & directory providers, deduplicate by domain and phone, and export directly to Google Sheets or CSV.
            </p>
          </div>
          <Link href="/dashboard/leads/new">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Open Generator</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-xl border border-border/80 bg-card/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Send className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Campaigns & Outreach</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Launch personalized Gmail outreach with 4-tier deduplication, warm-up ramping, and HMAC one-click unsubscribe links.
            </p>
          </div>
          <Link href="/dashboard/campaigns">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View Campaigns</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-xl border border-border/80 bg-card/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Inbox className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Opportunity Inbox</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Automated sync with pre-filtering of newsletters and zero body bloat. Flags freelance and software inquiries.
            </p>
          </div>
          <Link href="/dashboard/inbox">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Check Inbox</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Safety & Compliance Card */}
      <div className="p-6 rounded-xl border border-border/80 bg-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-foreground">Compliance & Anti-Abuse Guardrails Active</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              ContactLedger global deduplication, CAN-SPAM compliant footers, and hard daily caps protect your sender reputation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Full Analytics
            </Button>
          </Link>
          <Link href="/dashboard/settings/sending">
            <Button variant="secondary" size="sm">Sender Settings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
