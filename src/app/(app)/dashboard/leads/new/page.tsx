"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Search, Check, AlertCircle, Building2, Globe, Mail, Phone, MapPin, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultLead {
  businessName: string;
  category?: string;
  niche?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  source: string;
  dedupeKey: string;
}

export default function LeadGeneratorPage() {
  const [provider, setProvider] = useState("scrape_do");
  const [category, setCategory] = useState("Software Agency");
  const [niche, setNiche] = useState("Web Development");
  const [city, setCity] = useState("Bangalore");
  const [country, setCountry] = useState("India");
  const [maxResults, setMaxResults] = useState(15);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [results, setResults] = useState<SearchResultLead[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          category,
          niche,
          city,
          country,
          maxResults,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to search leads");
      }

      const leads: SearchResultLead[] = json.data?.leads || [];
      setResults(leads);
      setSelectedIndices(new Set(leads.map((_, i) => i)));
    } catch (err: any) {
      setError(err.message || "An error occurred during search");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, i) => i)));
    }
  };

  const toggleSelectOne = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleSaveSelected = async () => {
    if (selectedIndices.size === 0) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const selectedLeads = Array.from(selectedIndices).map((i) => results[i]);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: selectedLeads }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to save leads");
      }

      setSuccessMessage(json.data?.message || "Leads successfully processed");
    } catch (err: any) {
      setError(err.message || "Failed to save leads");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Lead Discovery Engine
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provider-agnostic query pipeline with automated deduplication & phone/email normalization.
            </p>
          </div>
        </div>

        <Link href="/dashboard/leads">
          <Button variant="outline" size="sm">
            View Saved Leads
          </Button>
        </Link>
      </div>

      {/* Search Form Card */}
      <form onSubmit={handleSearch} className="p-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">CATEGORY</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="e.g. Software Agency, Clinic, Dental"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">NICHE / KEYWORD</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Web Development, B2B"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">CITY / REGION</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="e.g. Bangalore, Mumbai, London"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">COUNTRY</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India, United States"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">PROVIDER SOURCE</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="scrape_do">Google Maps via Scrape.do (Live & Real-time)</option>
              <option value="google_places">Google Places API (New)</option>
              <option value="osm">OpenStreetMap / Overpass (Legacy / Stale)</option>
              <option value="csv">Custom CSV Import</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground">MAX RESULTS</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={10}>10 Leads</option>
              <option value={15}>15 Leads</option>
              <option value={25}>25 Leads</option>
              <option value={50}>50 Leads</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">
            {provider === "scrape_do"
              ? "Live Google Maps scraper (fresh websites, phone numbers, ratings)"
              : provider === "google_places"
              ? "Official Google Places API (New)"
              : provider === "osm"
              ? "OpenStreetMap public directory"
              : "Direct CSV file import"}
          </span>
          <Button type="submit" disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            {loading ? "Discovering Leads..." : "Search Leads"}
          </Button>
        </div>
      </form>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-3 text-sm">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-card/40">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIndices.size === results.length}
                onChange={toggleSelectAll}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-mono text-muted-foreground">
                {selectedIndices.size} of {results.length} selected
              </span>
            </div>

            <Button
              onClick={handleSaveSelected}
              disabled={saving || selectedIndices.size === 0}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Database className="h-4 w-4" />
              {saving ? "Saving & Deduplicating..." : `Save ${selectedIndices.size} Selected to Database`}
            </Button>
          </div>

          {/* Results Table */}
          <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs font-mono text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {results.map((lead, idx) => {
                    const isSelected = selectedIndices.has(idx);
                    return (
                      <tr
                        key={lead.dedupeKey || idx}
                        onClick={() => toggleSelectOne(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/40"
                        }`}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(idx)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{lead.businessName}</span>
                          </div>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{lead.website.replace(/^https?:\/\//, "")}</span>
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
                            <span className="truncate max-w-[150px]">{lead.city || lead.address || "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            {lead.source}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
