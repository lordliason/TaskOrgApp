import { memo } from 'react';

// Base skeleton component with shimmer animation
const Skeleton = memo(function Skeleton({
  className = '',
  width,
  height,
  rounded = 'lg',
  animate = true
}) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-dark-hover ${roundedClasses[rounded]} ${animate ? 'skeleton-shimmer' : ''} ${className}`}
      style={{ width, height }}
    />
  );
});

// Task list skeleton
export const TaskListSkeleton = memo(function TaskListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-dark-hover rounded-xl"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Checkbox */}
          <Skeleton width={24} height={24} rounded="full" />

          {/* Priority indicators */}
          <div className="flex flex-col gap-1">
            <Skeleton width={8} height={8} rounded="full" />
            <Skeleton width={8} height={8} rounded="full" />
          </div>

          {/* Avatar */}
          <Skeleton width={32} height={32} rounded="full" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} rounded="md" />
            <div className="flex gap-2">
              <Skeleton width={60} height={18} rounded="md" />
              <Skeleton width={40} height={18} rounded="md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Task matrix skeleton
export const TaskMatrixSkeleton = memo(function TaskMatrixSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 p-1 bg-dark-card rounded-2xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={80} height={36} rounded="xl" />
        ))}
      </div>

      {/* Matrix skeleton */}
      <div className="grid grid-cols-[40px_1fr_1fr] grid-rows-2 min-h-[500px] gap-2">
        {/* Left labels */}
        <div className="row-span-2" />

        {/* Quadrants */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark-hover/50 rounded-3xl p-4 relative"
          >
            <Skeleton width={80} height={14} rounded="md" className="mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => (
                <Skeleton
                  key={j}
                  width={40 + Math.random() * 20}
                  height={40 + Math.random() * 20}
                  rounded="full"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Leaderboard skeleton
export const LeaderboardSkeleton = memo(function LeaderboardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton width={28} height={28} rounded="md" />
          <Skeleton width={140} height={28} rounded="md" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={90} height={36} rounded="lg" />
          ))}
        </div>
      </div>

      {/* Entries skeleton */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-dark-hover rounded-2xl"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Rank */}
            <Skeleton width={40} height={40} rounded="full" />

            {/* Avatar */}
            <Skeleton width={48} height={48} rounded="full" />

            {/* Info */}
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height={20} rounded="md" />
              <Skeleton width="25%" height={14} rounded="md" />
            </div>

            {/* Points */}
            <div className="text-right space-y-1">
              <Skeleton width={60} height={28} rounded="md" />
              <Skeleton width={40} height={12} rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Card skeleton for settings/general use
export const CardSkeleton = memo(function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
      <Skeleton width="40%" height={24} rounded="md" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${70 + Math.random() * 30}%`}
          height={16}
          rounded="md"
        />
      ))}
    </div>
  );
});

// Daily planner skeleton
export const DailyPlannerSkeleton = memo(function DailyPlannerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={180} height={28} rounded="md" />
          <Skeleton width={240} height={16} rounded="md" />
        </div>
        <div className="flex gap-2">
          <Skeleton width={120} height={40} rounded="xl" />
          <Skeleton width={120} height={40} rounded="xl" />
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Morning', 'Afternoon', 'Evening'].map((period) => (
          <div key={period} className="bg-dark-card rounded-3xl p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-dark-border">
              <Skeleton width={40} height={40} rounded="full" />
              <Skeleton width={80} height={20} rounded="md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 bg-dark-hover rounded-2xl space-y-2">
                  <Skeleton width="70%" height={16} rounded="md" />
                  <Skeleton width="40%" height={12} rounded="md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Skeleton;
