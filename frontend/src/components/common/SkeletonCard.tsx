export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export function JobCardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-4">
        <SkeletonBox className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-2/3" />
          <SkeletonBox className="h-4 w-1/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-20 rounded-full" />
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonBox className="h-4 w-1/4" />
    </div>
  )
}

export function ApplicationRowSkeleton() {
  return (
    <div className="card p-4 flex items-center gap-4">
      <SkeletonBox className="h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-1/3" />
        <SkeletonBox className="h-3 w-1/4" />
      </div>
      <SkeletonBox className="h-6 w-20 rounded-full" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <SkeletonBox className="h-4 w-1/2" />
      <SkeletonBox className="h-8 w-1/3" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-4 w-28" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>
    </div>
  )
}
