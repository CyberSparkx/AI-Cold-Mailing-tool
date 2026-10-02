"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  Sparkles,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface InboxItem {
  id: string;
  sender?: string | null;
  senderEmail: string;
  subject?: string | null;
  snippet?: string | null;
  receivedAt: string;
  classification?: string | null;
  confidence?: number | null;
  reason?: string | null;
  isOpportunity: boolean;
  opportunityStatus: string;
}

export default function InboxDashboardPage() {
  const [messages, setMessages] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [onlyOpportunities, setOnlyOpportunities] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<InboxItem | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "30",
      });
      if (filterCategory) params.append("category", filterCategory);
      if (onlyOpportunities) params.append("onlyOpportunities", "true");

      const res = await fetch(`/api/inbox?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load messages");
      setMessages(json.data?.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, onlyOpportunities]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        fetchMessages();
      }
    } catch {
      // offline / mock
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityStatus: status }),
      });
      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, opportunityStatus: status } : null));
      }
    } catch {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inbound Opportunity Inbox
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zero-bloat Gmail synchronization with automated prefiltering and high-intent opportunity classification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSync}
            disabled={syncing}
            size="sm"
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing Gmail..." : "Sync Latest Messages"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOnlyOpportunities(true)}
            variant={onlyOpportunities ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            High-Intent Opportunities
          </Button>

          <Button
            onClick={() => setOnlyOpportunities(false)}
            variant={!onlyOpportunities ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
          >
            <Inbox className="h-3.5 w-3.5" />
            All Inbound Mail
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Classifications</option>
            <option value="FREELANCE_OPPORTUNITY">Freelance Opportunity</option>
            <option value="SOFTWARE_INQUIRY">Software Inquiry</option>
            <option value="WEBSITE_INQUIRY">Website Inquiry</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="GENERAL">General</option>
            <option value="NOT_RELEVANT">Not Relevant</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Opportunities and Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List Column */}
        <div className="lg:col-span-2 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-muted-foreground">
              Scanning inbox opportunities...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-16 rounded-xl border border-border bg-card/40 text-center space-y-3">
              <Inbox className="h-8 w-8 text-muted-foreground/60 mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No opportunities found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No inbound emails match the current filters. Click "Sync Latest Messages" to check your Gmail account.
              </p>
            </div>
          ) : (
            messages.map((item) => {
              const isSelected = selectedMessage?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMessage(item)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-card/60 hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {item.sender?.split("<")[0] || item.senderEmail}
                        </span>
                        {item.classification && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {item.classification.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-foreground">{item.subject}</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formatDate(item.receivedAt)}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.opportunityStatus}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                    {item.snippet}
                  </p>

                  {item.reason && (
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Reason: {item.reason}</span>
                      {item.confidence && (
                        <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Message Detail Drawer */}
        <div className="lg:col-span-1">
          {selectedMessage ? (
            <div className="p-6 rounded-xl border border-border bg-card/80 sticky top-24 space-y-5">
              <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-4">
                <div>
                  <h3 className="font-semibold text-base text-foreground">Opportunity Details</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(selectedMessage.receivedAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMessage(null)}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-mono block text-[10px]">SENDER</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedMessage.sender}</div>
                  <div className="text-muted-foreground font-mono">{selectedMessage.senderEmail}</div>
                </div>

                <div>
                  <span className="text-muted-foreground font-mono block text-[10px]">SUBJECT</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedMessage.subject}</div>
                </div>

                <div>
                  <span className="text-muted-foreground font-mono block text-[10px]">MESSAGE SNIPPET</span>
                  <div className="mt-1 p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed">
                    {selectedMessage.snippet}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground font-mono block text-[10px]">TRIAGE STATUS</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {["NEW", "REVIEWED", "REPLIED", "DISMISSED"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedMessage.id, status)}
                        className={`px-2 py-1.5 rounded text-[11px] font-mono border transition-all ${
                          selectedMessage.opportunityStatus === status
                            ? "border-primary bg-primary text-primary-foreground font-semibold"
                            : "border-border bg-background text-muted-foreground hover:bg-accent/40"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-2">
              <Mail className="h-6 w-6 mx-auto opacity-50" />
              <p>Select any inbound inquiry on the left to inspect triage signals and update opportunity status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
