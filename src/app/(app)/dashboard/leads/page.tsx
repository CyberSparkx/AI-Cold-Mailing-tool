"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Download, Search, RefreshCw, Trash2, Globe, Mail, Phone, MapPin, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

interface LeadItem {
  id: string;
  businessName: string;
  category?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  status: string;
  emailStatus: string;
  createdAt: string;
}

export default function LeadsListPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load leads");
      }

      setLeads(json.data?.items || []);
      setTotal(json.data?.total || 0);
      setTotalPages(json.data?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      fetchLeads();
    } catch (err: any) {
      alert(err.message || "Failed to delete lead");
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (statusFilter) params.append("status", statusFilter);
    window.open(`/api/leads/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Saved Leads Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deduplicated client repository with cross-channel contact metadata and campaign state tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            disabled={total === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Link href="/dashboard/leads/new">
            <Button size="sm" className="gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              Discover Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by business or domain..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
          </select>

          <Button
            onClick={fetchLeads}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-mono text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4">Email Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground font-mono">
                    Loading records from MongoDB...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center space-y-3">
                    <Building2 className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <div className="text-sm font-medium text-foreground">No leads found</div>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Use the Lead Discovery Engine to search verified directories and import prospective clients.
                    </p>
                    <div className="pt-2">
                      <Link href="/dashboard/leads/new">
                        <Button size="sm" className="gap-2 text-xs">
                          <Sparkles className="h-3.5 w-3.5" />
                          Launch Lead Discovery
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{lead.businessName}</div>
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{lead.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {lead.email ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-foreground">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{lead.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{lead.city || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.emailStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => handleDelete(lead.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete lead"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>
              Showing page {page} of {totalPages} ({total} total leads)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
