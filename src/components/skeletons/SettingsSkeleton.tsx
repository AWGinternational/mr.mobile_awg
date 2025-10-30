'use client'

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-gray-700 pb-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div
            style={{ animationDelay: '0ms' }}
            className="animate-in slide-in-from-bottom-4 duration-500"
          >
            <SkeletonCard />
          </div>
          <div
            style={{ animationDelay: '50ms' }}
            className="animate-in slide-in-from-bottom-4 duration-500"
          >
            <SkeletonCard />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div
            style={{ animationDelay: '100ms' }}
            className="animate-in slide-in-from-bottom-4 duration-500"
          >
            <SkeletonCard />
          </div>
          <div
            style={{ animationDelay: '150ms' }}
            className="animate-in slide-in-from-bottom-4 duration-500"
          >
            <SkeletonCard />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-6 border-t dark:border-gray-700">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
