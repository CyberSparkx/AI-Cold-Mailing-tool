"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Shield, FileSpreadsheet, Send, Inbox, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleStatus {
  connected: boolean;
  email: string | null;
  status: string;
  services: {
    sheets: boolean;
    gmailSend: boolean;
    gmailRead: boolean;
  };
}

export default function GoogleSettingsPage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/status");
      const json = await res.json();
      if (res.ok) {
        setStatus(json.data);
      }
    } catch {
      // offline / mock fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = (service: "SHEETS" | "GMAIL_SEND" | "GMAIL_READ" | "ALL") => {
    window.location.href = `/api/google/connect?service=${service}`;
  };

  const handleDisconnect = async (service: "SHEETS" | "GMAIL_SEND" | "GMAIL_READ" | "ALL") => {
    if (!confirm(`Are you sure you want to disconnect ${service}?`)) return;
    setDisconnecting(service);
    try {
      await fetch("/api/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      fetchStatus();
    } catch {
      alert("Failed to disconnect service");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Google Account Connections
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage incremental consent scopes for Sheets synchronization, cold mail sending, and opportunity inbox.
            </p>
          </div>
        </div>

        <Button
          onClick={fetchStatus}
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Account Info Card */}
      <div className="p-6 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-mono text-muted-foreground uppercase">Linked Account</span>
          <div className="font-semibold text-foreground text-sm flex items-center gap-2">
            <span>{status?.email || "No Google Account Linked"}</span>
            {status?.connected && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {status?.connected && (
          <Button
            onClick={() => handleDisconnect("ALL")}
            variant="destructive"
            size="sm"
            disabled={Boolean(disconnecting)}
            className="text-xs"
          >
            Disconnect All Services
          </Button>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Incremental Module Permissions</h2>

        {/* 1. Google Sheets */}
        <div className="p-5 rounded-xl border border-border bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Google Sheets Integration</h3>
                {status?.services.sheets ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <XCircle className="h-3 w-3" /> Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                Export discovered leads directly to your Google Drive and synchronize sending statuses in real-time.
              </p>
            </div>
          </div>

          <div>
            {status?.services.sheets ? (
              <Button
                onClick={() => handleDisconnect("SHEETS")}
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => handleConnect("SHEETS")}
                size="sm"
                className="text-xs gap-1.5"
              >
                Connect Sheets
              </Button>
            )}
          </div>
        </div>

        {/* 2. Gmail Send */}
        <div className="p-5 rounded-xl border border-border bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Gmail Outreach Sending</h3>
                {status?.services.gmailSend ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <XCircle className="h-3 w-3" /> Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                Required for Cold Email Campaigns module. Dispatches cold mail via official Gmail API with custom RFC Message-IDs and CAN-SPAM headers.
              </p>
            </div>
          </div>

          <div>
            {status?.services.gmailSend ? (
              <Button
                onClick={() => handleDisconnect("GMAIL_SEND")}
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => handleConnect("GMAIL_SEND")}
                size="sm"
                className="text-xs gap-1.5"
              >
                Connect Gmail Send
              </Button>
            )}
          </div>
        </div>

        {/* 3. Gmail Read */}
        <div className="p-5 rounded-xl border border-border bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Gmail Opportunity Inbox</h3>
                {status?.services.gmailRead ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <XCircle className="h-3 w-3" /> Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                Required for Inbox Opportunity module. Incrementally reads headers & snippets to classify inbound leads with Gemini AI.
              </p>
            </div>
          </div>

          <div>
            {status?.services.gmailRead ? (
              <Button
                onClick={() => handleDisconnect("GMAIL_READ")}
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => handleConnect("GMAIL_READ")}
                size="sm"
                className="text-xs gap-1.5"
              >
                Connect Inbox Read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
