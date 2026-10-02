/**
 * Generic dashboard loading state.
 * Shown instantly for any dashboard sub-page while its
 * async Server Component fetches data.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Page title bar */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/60" />
      </div>

      {/* Content placeholder rows */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-card/60"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-xl border border-border bg-card/60"
          />
        ))}
      </div>
    </div>
  );
}
