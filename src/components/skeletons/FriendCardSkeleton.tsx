import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

interface FriendCardSkeletonProps {
  className?: string;
}

const FriendCardSkeleton: React.FC<FriendCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`relative min-w-[180px] max-w-[180px] bg-white border border-neutral-100 rounded-xl px-2 pb-2 pt-8 ${className}`}>
      {/* header X placeholder */}
      <Skeleton className="absolute right-2 top-2 w-4 h-4" rounded="full" />
      <div className="flex flex-col items-center text-center">
        {/* avatar */}
        <Skeleton className="w-34 h-34 mb-2" rounded="4xl" />
        {/* name */}
        <Skeleton className="h-4 w-28 mb-1" rounded="md" />
        {/* subtitle */}
        <Skeleton className="h-3 w-24" rounded="md" />

        {/* action button */}
        <div className="mt-3 w-full">
          <Skeleton className="h-10 w-full" rounded="2xl" />
        </div>
      </div>
    </div>
  );
};

export default FriendCardSkeleton;
