export default function Loading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-60 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
