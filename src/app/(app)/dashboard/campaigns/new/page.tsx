"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, Check, AlertCircle, Eye, Sliders, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewCampaignWizardPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Enterprise Outreach Q4");
  const [sourceType, setSourceType] = useState<"LEADS" | "MANUAL">("LEADS");
  const [dailyLimit, setDailyLimit] = useState(25);
  const [sendWindowStart, setSendWindowStart] = useState(9);
  const [sendWindowEnd, setSendWindowEnd] = useState(17);
  const [isFollowUp, setIsFollowUp] = useState(false);

  // Template state
  const [subjectTemplate, setSubjectTemplate] = useState("Modernizing {{businessName}}'s web experience");
  const [bodyTemplate, setBodyTemplate] = useState(
    `Hi {{businessName}} team,

I was looking at {{businessName}}'s digital presence in {{city}} and noticed some key areas where high-performance engineering could drive more inquiries.

I build custom, ultra-fast web platforms and autonomous AI workflows for modern teams. You can see my recent case studies and live work at {{portfolioUrl}}.

Would you be open to a brief 10-minute exchange this Thursday to explore if we might be a good fit?`
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertVariable = (tag: string) => {
    setBodyTemplate((prev) => prev + ` {{${tag}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sourceType,
          subjectTemplate,
          bodyTemplate,
          dailyLimit,
          sendWindowStart,
          sendWindowEnd,
          isFollowUp,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create campaign");
      }

      router.push(`/dashboard/campaigns/${json.data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
      setLoading(false);
    }
  };

  // Preview interpolation
  const sampleSubject = subjectTemplate
    .replace(/\{\{businessName\}\}/g, "Apex Technologies")
    .replace(/\{\{city\}\}/g, "Bangalore")
    .replace(/\{\{category\}\}/g, "Software");

  const sampleBody = bodyTemplate
    .replace(/\{\{businessName\}\}/g, "Apex Technologies")
    .replace(/\{\{city\}\}/g, "Bangalore")
    .replace(/\{\{category\}\}/g, "Software")
    .replace(/\{\{portfolioUrl\}\}/g, "https://narenroy.in/")
    .replace(/\{\{senderName\}\}/g, "Naren Roy");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Cold Outreach Sequence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure templates, recipient snapshot source, and sending safety limits.
          </p>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div
          className={`p-3 rounded-lg border text-center transition-all ${
            step === 1
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : step > 1
              ? "border-border bg-card text-foreground"
              : "border-border/50 text-muted-foreground"
          }`}
        >
          1. SEQUENCE SETUP
        </div>
        <div
          className={`p-3 rounded-lg border text-center transition-all ${
            step === 2
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : step > 2
              ? "border-border bg-card text-foreground"
              : "border-border/50 text-muted-foreground"
          }`}
        >
          2. TEMPLATE & TAGS
        </div>
        <div
          className={`p-3 rounded-lg border text-center transition-all ${
            step === 3
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-border/50 text-muted-foreground"
          }`}
        >
          3. SAFETY & PREVIEW
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-border bg-card/60 space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">CAMPAIGN TITLE</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Q4 Web Agency Inquiries"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-muted-foreground">RECIPIENT SNAPSHOT SOURCE</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSourceType("LEADS")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    sourceType === "LEADS"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-accent/40"
                  }`}
                >
                  <div className="font-semibold text-sm">Saved Database Leads</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Import all current verified leads from your Leads repository snapshot.
                  </p>
                </div>

                <div
                  onClick={() => setSourceType("MANUAL")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    sourceType === "MANUAL"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card hover:bg-accent/40"
                  }`}
                >
                  <div className="font-semibold text-sm">Manual / On-the-Fly</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add recipients manually or upload CSV later from the recipient tab.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-accent/30 border border-border/60 text-xs text-muted-foreground flex items-center gap-3">
              <input
                type="checkbox"
                id="followUp"
                checked={isFollowUp}
                onChange={(e) => setIsFollowUp(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="followUp" className="cursor-pointer">
                <strong>Explicit Follow-Up Mode:</strong> Check this only if you want to bypass the default ContactLedger duplicate block to send a second touch.
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">SUBJECT LINE TEMPLATE</label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-[11px] text-muted-foreground">
                Deceptive fake prefixes (like "Re:" on first touch) are strictly prohibited by compliance engine.
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-muted-foreground">EMAIL BODY TEMPLATE</label>
                <div className="flex flex-wrap gap-1.5">
                  {["businessName", "city", "category", "portfolioUrl", "senderName"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/20 hover:text-primary transition-colors border border-border/80"
                    >
                      + {`{{${tag}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={8}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground">DAILY LIMIT (CAP: 100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground">WINDOW START (HOUR: 0-23)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={sendWindowStart}
                  onChange={(e) => setSendWindowStart(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground">WINDOW END (HOUR: 0-23)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={sendWindowEnd}
                  onChange={(e) => setSendWindowEnd(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                INTERPOLATED MESSAGE PREVIEW
              </span>

              <div className="p-5 rounded-xl border border-border bg-background space-y-4">
                <div className="text-xs font-semibold text-foreground border-b border-border/60 pb-2">
                  Subject: <span className="font-normal text-muted-foreground">{sampleSubject}</span>
                </div>
                <div className="text-xs whitespace-pre-wrap text-foreground font-sans leading-relaxed">
                  {sampleBody}
                </div>
                <div className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground space-y-1">
                  <div><strong>Naren Roy</strong> &bull; https://narenroy.in/</div>
                  <div>Kolkata, West Bengal, India</div>
                  <div className="text-primary underline cursor-pointer">One-click unsubscribe (RFC 8058 compliant)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-4 border-t border-border/80 flex items-center justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button type="submit" size="sm" disabled={loading} className="gap-2">
            {step < 3 ? (
              "Next Step"
            ) : loading ? (
              "Creating Campaign..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Sequence
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
