import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useSocialFeedQuery } from '@/pages/Social/Feed/hooks/useSocialFeed';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';
import { PrivacyPostType } from '@/types/privacy';
import { IonPage } from '@ionic/react';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';

interface SocialFeedListProps {
  privacy?: PrivacyPostType;
  className?: string;
}

export const SocialFeedList: React.FC<SocialFeedListProps> = ({
  privacy,
  className = ''
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [refreshing, setRefreshing] = useState(false);
  const lastPostElementRef = useRef<HTMLDivElement>(null);
  const { setCurrentPost, feedPosts, setFeedPosts } = useSocialFeedStore();
  const postLikeMutation = usePostLike();

  const {
    posts,
    isLoading: loading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isFetchingNextPage
  } = useSocialFeedQuery({
    pageSize: 20,
    privacy: privacy ? Number(privacy) : undefined,
    enabled: true
  });

console.log(feedPosts)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && hasNextPage && !isFetchingNextPage && !loading) {
          fetchNextPage();
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
  }, [hasNextPage, isFetchingNextPage, loading, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLike = useCallback((postId: number) => {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    
    postLikeMutation.mutate({
      postId: postId,
      isLiked: post.isLike || false
    });
  }, [feedPosts, postLikeMutation]);

  const handleComment = useCallback((postId: number) => {
    console.log('Comment on post:', postId);
  }, []);

  const handlePostClick = useCallback((postId: number) => {
    const selectedPost = feedPosts.find(post => post.id === postId);
    if (selectedPost) {
      setCurrentPost(selectedPost);
    }
    history.push(`/social-feed/f/${postId}`);
  }, [feedPosts, setCurrentPost, history]);

  const handleShare = useCallback((postId: number) => {
    console.log('Share post:', postId);
  }, []);

  const handleRepost = useCallback((postId: number) => {
    console.log('Repost:', postId);
  }, []);

  if (error && posts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('Error loading posts')}</h3>
          <p className="text-gray-500 mb-4">{typeof error === 'string' ? error :  'An error occurred'}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('Try again')}
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className={`${className}`}>
      {(isRefetching || refreshing) && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('Refreshing...')}</span>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {feedPosts.map((post, index) => {
          const isLastPost = index === feedPosts.length - 1;
          
          return (
            <div
              key={post.id}
              ref={isLastPost ? lastPostElementRef : undefined}
            >
              <SocialFeedCard
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onRepost={handleRepost}
                onPostClick={handlePostClick}
              />
            </div>
          );
        })}
      </div>

      {loading && feedPosts.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('Loading more posts...')}</span>
          </div>
        </div>
      )}

      {/* Load more button (fallback for intersection observer) */}
      {hasNextPage && !loading && feedPosts.length > 0 && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => fetchNextPage()}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('Load more posts')}
          </button>
        </div>
      )}

      {/* No more posts indicator */}
      {!hasNextPage && feedPosts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">{t('No more posts to load')}</p>
        </div>
      )}

      {/* Empty state */}
      {feedPosts.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('No posts yet')}</h3>
            <p className="text-gray-500 mb-4">{t('Be the first to share something!')}</p>
          </div>
        </div>
      )}

      {/* Initial loading state */}
      {feedPosts.length === 0 && loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white border-b border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded mt-3"></div>
              <div className="flex items-center gap-6 mt-4">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
};
