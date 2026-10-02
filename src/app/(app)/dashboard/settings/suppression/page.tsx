"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Plus, Trash2, RefreshCw, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface SuppressionItem {
  id: string;
  emailNormalized?: string | null;
  domain?: string | null;
  reason: string;
  note?: string | null;
  createdAt: string;
}

export default function SuppressionSettingsPage() {
  const [entries, setEntries] = useState<SuppressionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [emailOrDomain, setEmailOrDomain] = useState("");
  const [reason, setReason] = useState("MANUAL");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppression");
      const json = await res.json();
      if (res.ok) setEntries(json.data || []);
    } catch {
      // offline / mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);

    const isEmail = emailOrDomain.includes("@");
    const payload = {
      email: isEmail ? emailOrDomain.trim() : undefined,
      domain: !isEmail ? emailOrDomain.trim() : undefined,
      reason,
      note: note.trim() || undefined,
    };

    try {
      const res = await fetch("/api/suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to add suppression entry");

      setEmailOrDomain("");
      setNote("");
      fetchEntries();
    } catch (err: any) {
      setError(err.message || "Failed to add suppression entry");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry from suppression list?")) return;
    try {
      await fetch(`/api/suppression?id=${id}`, { method: "DELETE" });
      fetchEntries();
    } catch {
      alert("Failed to delete entry");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Do-Not-Contact & Suppression List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Global suppression ledger. Any addresses or domains on this list are automatically blocked from all current and future sequences.
          </p>
        </div>
      </div>

      {/* Add Form Card */}
      <form onSubmit={handleAdd} className="p-6 rounded-xl border border-border bg-card/60 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Block Email or Entire Domain</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-mono text-muted-foreground">EMAIL ADDRESS OR DOMAIN</label>
            <input
              type="text"
              value={emailOrDomain}
              onChange={(e) => setEmailOrDomain(e.target.value)}
              required
              placeholder="e.g. competitor.com or unwanted@domain.com"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground">REASON</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="MANUAL">Manual Block</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Hard Bounced</option>
              <option value="REPLIED_NEGATIVE">Negative Reply</option>
              <option value="COMPLAINT">Complaint</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">OPTIONAL NOTE</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Requested removal via LinkedIn message"
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={adding} className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding..." : "Add to Suppression List"}
          </Button>
        </div>
      </form>

      {/* Entries Table */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground uppercase">
            Suppressed Entries ({entries.length})
          </span>
          <Button onClick={fetchEntries} variant="ghost" size="icon" className="h-7 w-7">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-mono text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Blocked Target</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Note</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground font-mono">
                    Suppression list is currently empty.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-foreground">
                      {item.emailNormalized || `@${item.domain}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                      {item.note || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
