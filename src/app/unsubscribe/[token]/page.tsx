"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export default function UnsubscribePage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function executeUnsubscribe() {
      try {
        const res = await fetch(`/api/unsubscribe/${params.token}`, { method: "POST" });
        const json = await res.json();
        if (res.ok && json.success) {
          setSuccess(true);
          setMessage(json.data?.message || "You have been unsubscribed.");
          setEmail(json.data?.email || "");
        } else {
          setSuccess(false);
          setMessage(json.error?.message || "Invalid or expired unsubscribe link.");
        }
      } catch {
        setSuccess(false);
        setMessage("An error occurred while processing your request.");
      } finally {
        setLoading(false);
      }
    }
    executeUnsubscribe();
  }, [params.token]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-primary/20">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-xl text-center space-y-4">
        {loading ? (
          <div className="py-8 space-y-3">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Processing unsubscribe request...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Unsubscribed Successfully</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {email ? <strong className="text-foreground">{email}</strong> : "Your email address"} has been permanently added to our do-not-contact suppression list.
            </p>
            <div className="pt-2 p-3 rounded-lg bg-accent/40 border border-border/80 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Compliant with CAN-SPAM, GDPR & PECR regulations</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Unsubscribe Error</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
