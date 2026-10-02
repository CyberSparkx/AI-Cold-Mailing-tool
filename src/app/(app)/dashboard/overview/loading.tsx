/**
 * Streaming skeleton for the Overview page.
 * Next.js renders this immediately while the async page component
 * fetches data from MongoDB Atlas — the user sees content right away
 * instead of a blank white screen.
 */
export default function DashboardOverviewLoading() {
  return (
    <div className="space-y-8 max-w-6xl animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="h-4 w-80 rounded bg-muted/60" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-lg bg-muted" />
          <div className="h-9 w-32 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-border bg-card/60"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded mb-2 bg-muted" />
            <div className="h-3 w-36 rounded bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Rate Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-border bg-card/40 flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted/60" />
            </div>
            <div className="h-12 w-12 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      {/* Quick-Launch Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl border border-border/80 bg-card/40 space-y-4"
          >
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted/60" />
              <div className="h-3 w-4/5 rounded bg-muted/60" />
              <div className="h-3 w-3/5 rounded bg-muted/60" />
            </div>
            <div className="h-9 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      {/* Compliance Footer Card */}
      <div className="p-6 rounded-xl border border-border/80 bg-accent/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-52 rounded bg-muted" />
            <div className="h-3 w-80 rounded bg-muted/60" />
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="h-9 w-32 rounded-lg bg-muted" />
          <div className="h-9 w-28 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
