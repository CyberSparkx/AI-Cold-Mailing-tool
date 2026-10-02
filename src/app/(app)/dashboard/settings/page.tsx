"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Shield, Key, Sliders, ExternalLink, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsOverviewPage() {
  const [senderName, setSenderName] = useState("Naren Roy");
  const [portfolioUrl, setPortfolioUrl] = useState("https://narenroy.in/");
  const [postalAddress, setPostalAddress] = useState("Kolkata, West Bengal, India");
  const [signature, setSignature] = useState("Best regards,\nNaren Roy\nFull Stack & AI Engineer\nhttps://narenroy.in/");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure sender identity, compliance defaults, and third-party integrations.
        </p>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 text-xs font-medium">
        <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">
          Sender Profile
        </Link>
        <Link href="/dashboard/settings/google" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
          Google Connections
        </Link>
        <Link href="/dashboard/settings/sending" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
          Sending Limits & Safety
        </Link>
        <Link href="/dashboard/settings/ai" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
          AI Budget & Models
        </Link>
      </div>

      {/* Sender Profile Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl border border-border bg-card/60 space-y-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Sender Identity & Compliance</h2>
          <p className="text-xs text-muted-foreground">
            Information included in your cold outreach headers and compliant email footers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">SENDER DISPLAY NAME</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">PORTFOLIO URL</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground">POSTAL ADDRESS (CAN-SPAM MANDATORY)</label>
          <input
            type="text"
            value={postalAddress}
            onChange={(e) => setPostalAddress(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-[11px] text-muted-foreground">
            A valid physical or registered mailing address is legally required in cold outreach footers.
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground">DEFAULT EMAIL SIGNATURE</label>
          <textarea
            rows={4}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">
            {saved ? "Changes saved successfully!" : "Default values loaded from config"}
          </span>
          <Button type="submit" size="sm" className="gap-2">
            {saved && <Check className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
