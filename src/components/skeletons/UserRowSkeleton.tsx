import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

interface UserRowSkeletonProps {
  className?: string;
}

const UserRowSkeleton: React.FC<UserRowSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`py-3 flex items-center bg-white border-b border-neutral-100 ${className}`}>
      <div className="flex items-center min-w-0 w-full">
        {/* avatar */}
        <Skeleton className="w-[64px] h-[64px] rounded-3xl shrink-0 flex-none" />
        <div className="ml-3 min-w-0 w-full">
          {/* name */}
          <Skeleton className="h-4 w-[180px] rounded mb-2" />
          {/* subtitle */}
          <Skeleton className="h-3 w-[200px] rounded mb-2" />
          {/* action buttons row: primary + remove, both full width (flex-1) */}
          <div className="flex items-center gap-2 w-full">
            <Skeleton className="h-10 rounded-xl flex-1" />
            <Skeleton className="h-10 rounded-xl flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRowSkeleton;
