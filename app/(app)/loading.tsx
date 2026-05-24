export default function Loading() {
  return (
    <div className="p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title skeleton */}
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
        </div>

        {/* Bottom section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
