import * as React from "react";
import { cn } from "@/lib/utils";
import { EMAIL_STATUS, CAMPAIGN_STATUS, LEAD_STATUS, type EmailStatus, type CampaignStatus, type LeadStatus } from "@/lib/constants";

interface StatusBadgeProps {
  status: EmailStatus | CampaignStatus | LeadStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-muted text-muted-foreground border-border";

  switch (status) {
    case EMAIL_STATUS.NOT_SENT:
    case LEAD_STATUS.NEW:
    case CAMPAIGN_STATUS.DRAFT:
      colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
      break;
    case EMAIL_STATUS.QUEUED:
    case CAMPAIGN_STATUS.READY:
      colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
    case EMAIL_STATUS.SENDING:
    case CAMPAIGN_STATUS.RUNNING:
      colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case EMAIL_STATUS.SENT:
    case CAMPAIGN_STATUS.COMPLETED:
    case LEAD_STATUS.QUALIFIED:
      colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case EMAIL_STATUS.FAILED:
    case CAMPAIGN_STATUS.CANCELLED:
    case LEAD_STATUS.DISQUALIFIED:
      colorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
      break;
    case EMAIL_STATUS.REPLIED:
    case LEAD_STATUS.REPLIED:
      colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
      break;
    case EMAIL_STATUS.UNSUBSCRIBED:
    case LEAD_STATUS.DO_NOT_CONTACT:
      colorClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      break;
    case CAMPAIGN_STATUS.PAUSED:
      colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight",
        colorClass,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
