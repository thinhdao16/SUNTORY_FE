import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';
import { PrivacyPostType } from '@/types/privacy';

interface PostsListProps {
  posts: SocialPost[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loading: boolean;
  onFetchNextPage: () => void;
  onLike: (postCode: string) => void;
  onComment: (postCode: string) => void;
  onShare: (postCode: string) => void;
  onRepostConfirm?: (postCode: string, privacy: PrivacyPostType) => void;
  onPostClick: (postCode: string) => void;
  onVisiblePostsChange?: (postCodes: string[]) => void;
}

export const PostsList = forwardRef<HTMLDivElement, PostsListProps>(({
  posts,
  hasNextPage,
  isFetchingNextPage,
  loading,
  onFetchNextPage,
  onLike,
  onComment,
  onShare,
  onRepostConfirm,
  onPostClick,
  onVisiblePostsChange
}, ref) => {
  const lastPostElementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const visibilityMapRef = useRef<Map<string, boolean>>(new Map());

  const handleVisibilityChange = useCallback((entries: IntersectionObserverEntry[]) => {
    let hasChange = false;
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement;
      const postCode = target.dataset.postCode;
      if (!postCode) return;
      const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
      const prevVisible = visibilityMapRef.current.get(postCode) || false;
      if (prevVisible !== isVisible) {
        visibilityMapRef.current.set(postCode, isVisible);
        hasChange = true;
      }
    });

    if (hasChange && onVisiblePostsChange) {
      const visibleCodes = posts
        .filter((post) => visibilityMapRef.current.get(post.code))
        .map((post) => post.code);
      onVisiblePostsChange(visibleCodes);
    }
  }, [onVisiblePostsChange, posts]);

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

  useEffect(() => {
    const observer = new IntersectionObserver(handleVisibilityChange, {
      threshold: [0.1, 0.25, 0.5, 0.75, 0.9],
      rootMargin: '50px'
    });
    observerRef.current = observer;

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [handleVisibilityChange]);

  const setItemRef = useCallback((code: string, node: HTMLDivElement | null) => {
    const observer = observerRef.current;
    const prevNode = itemRefs.current.get(code);
    if (prevNode && observer) {
      observer.unobserve(prevNode);
    }

    if (node) {
      node.dataset.postCode = code;
      itemRefs.current.set(code, node);
      if (observer) {
        observer.observe(node);
      }
    } else {
      itemRefs.current.delete(code);
      visibilityMapRef.current.delete(code);
    }
  }, []);
  return (
    <div 
      ref={ref}
      // className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin min-h-0 max-h-[calc(100vh-150px)] pb-32"
      className="min-h-0 pb-32"

    >
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
              onRepostConfirm={onRepostConfirm}
              onPostClick={onPostClick}
              containerRefCallback={(node) => setItemRef(post.code, node)}
            />
          </div>
        );
      })}
    </div>
  );
});

PostsList.displayName = 'PostsList';
