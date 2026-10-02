import Link from "next/link";
import { Sparkles, Send, Inbox, ArrowUpRight, CheckCircle2, ShieldCheck, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
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
        <div className="p-5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Total Leads</span>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">0</div>
          <div className="mt-1 text-xs text-muted-foreground">Ready for targeted sequences</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Emails Sent Today</span>
            <MailCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">0 / 25</div>
          <div className="mt-1 text-xs text-muted-foreground">Daily safety limit enforced</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Active Campaigns</span>
            <Send className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">0</div>
          <div className="mt-1 text-xs text-muted-foreground">0 queued for worker</div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Inbound Opportunities</span>
            <Inbox className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-semibold font-mono tracking-tight">0</div>
          <div className="mt-1 text-xs text-muted-foreground">Classified by Gemini AI</div>
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
        <Link href="/dashboard/settings/sending">
          <Button variant="outline" size="sm">Sender Settings</Button>
        </Link>
      </div>
    </div>
  );
}
