import React, { useRef, useEffect } from 'react';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';

interface PostsListProps {
  posts: SocialPost[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loading: boolean;
  onFetchNextPage: () => void;
  onLike: (postCode: string) => void;
  onComment: (postCode: string) => void;
  onShare: (postCode: string) => void;
  onRepost: (postCode: string) => void;
  onPostClick: (postCode: string) => void;
}

export const PostsList: React.FC<PostsListProps> = ({
  posts,
  hasNextPage,
  isFetchingNextPage,
  loading,
  onFetchNextPage,
  onLike,
  onComment,
  onShare,
  onRepost,
  onPostClick
}) => {
  const lastPostElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && hasNextPage && !isFetchingNextPage && !loading) {
          onFetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentRef = lastPostElementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loading, onFetchNextPage]);

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin min-h-0 max-h-screen">
      {posts.map((post, index) => {
        const isLastPost = index === posts.length - 1;
        
        return (
          <div
            key={post.id}
            ref={isLastPost ? lastPostElementRef : undefined}
          >
            <SocialFeedCard
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onRepost={onRepost}
              onPostClick={onPostClick}
            />
          </div>
        );
      })}
    </div>
  );
};
