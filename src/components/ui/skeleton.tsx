import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Base Skeleton Component with Shimmer Effect
 * Provides a modern, animated loading placeholder
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/60 dark:before:via-gray-100/10 before:to-transparent',
        className
      )}
      {...props}
    />
  )
}

/**
 * Card Skeleton - For product/sale cards
 */
export function SkeletonCard() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  )
}

/**
 * Table Row Skeleton
 */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Stats Card Skeleton - For dashboard KPIs
 */
export function SkeletonStats() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3 border border-gray-200 dark:border-gray-700">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
