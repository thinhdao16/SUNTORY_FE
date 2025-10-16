import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPosts, ProfileTabType } from '../hooks/useUserPosts';
import { useUserPostLike } from '../hooks/useUserPostLike';
import { useUserPostUpdate } from '../hooks/useUserPostUpdate';
import { useHistory } from 'react-router-dom';
import HeartIcon from "@/icons/logo/social-chat/heart.svg?react";

interface UserMediaGridProps {
  tabType: ProfileTabType;
  targetUserId?: number;
}

const UserMediaGrid: React.FC<UserMediaGridProps> = ({ tabType, targetUserId }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const lastMediaElementRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUserPosts(ProfileTabType.Media, targetUserId, 20, { enabled: targetUserId === undefined || !!targetUserId }) as any;

  const postLikeMutation = useUserPostLike({ tabType: ProfileTabType.Media, targetUserId });
  const postUpdateMutation = useUserPostUpdate({ tabType: ProfileTabType.Media, targetUserId });

  const allPosts = data?.pages?.flatMap((page: any) => page?.data?.data || []) || [];

  const mediaItems = allPosts
    .filter((post: any) => post.media && post.media.length > 0)
    .flatMap((post: any) =>
      post.media
        .filter((mediaItem: any) => {
          if (mediaItem.fileType) {
            return !mediaItem.fileType.startsWith('audio');
          }
          return true;
        })
        .map((mediaItem: any) => {
          let mediaType = mediaItem.mediaType;
          if (!mediaType && mediaItem.fileType) {
            mediaType = mediaItem.fileType.startsWith('image') ? 'image' :
              mediaItem.fileType.startsWith('video') ? 'video' : 'image';
          }

          return {
            ...mediaItem,
            mediaType,
            postCode: post.code,
            postLikes: post.reactionCount,
            postComments: post.commentCount,
            isLike: post.isLike,
            post: post
          };
        })
    );

  const fetchingRef = useRef(false);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const lastFetchAtRef = useRef(0);
  const initialAutoLoadsRemainingRef = useRef(2);

  useEffect(() => {
    if (!sentinelRef.current) return;

    if (ioRef.current) ioRef.current.disconnect();

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (!hasNextPage || isFetchingNextPage || isLoading || fetchingRef.current) return;

        const now = Date.now();
        if (now - lastFetchAtRef.current < 400) return;

        const userHasScrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 0;
        const allowAutoLoad = initialAutoLoadsRemainingRef.current > 0;
        if (!allowAutoLoad && !userHasScrolled) return;

        fetchingRef.current = true;
        lastFetchAtRef.current = now;
        try {
          await fetchNextPage();
        } finally {
          fetchingRef.current = false;
          if (initialAutoLoadsRemainingRef.current > 0) initialAutoLoadsRemainingRef.current -= 1;
        }
      },
      {
        threshold: 0.01,
        rootMargin: '100px'
      }
    );

    observer.observe(sentinelRef.current);
    ioRef.current = observer;
    
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, mediaItems.length]);

  const handleMediaClick = (postCode: string) => {
    history.push(`/social-feed/f/${postCode}`);
  };

  const handleLike = (postCode: string) => {
    const post = allPosts.find((p: any) => p.code === postCode);
    if (!post) return;

    postLikeMutation.mutate({
      postCode,
      isLiked: post.isLike || false
    });
  };

  if (isLoading && (!data || !data.pages || data.pages.length === 0)) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{t('Failed to load media')}</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {t('Try Again')}
        </button>
      </div>
    );
  }

  if (data && data.pages && data.pages.length > 0 && !mediaItems.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🖼️</div>
        <div className="text-gray-500 text-center">
          {t('No media posts yet')}
        </div>
      </div>
    );
  }

  if (!data || !data.pages || data.pages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white">
      <div className="grid grid-cols-2 gap-2 p-4">
        {mediaItems.map((item: any, index: number) => (
          <div
            key={`${item.postCode}-${item.id || index}`}
            className="relative group cursor-pointer"
            onClick={() => handleMediaClick(item.postCode)}
          >
            {(item.mediaType === 'image' || item.fileType?.startsWith('image') || item.linkImage || (item.urlFile && !item.fileType?.startsWith('video'))) ? (
              <img
                src={item.urlFile || item.linkImage || item.url}
                alt="Media"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  console.log('Image failed to load:', item);
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.backgroundColor = '#f3f4f6';
                  target.style.display = 'flex';
                  target.style.alignItems = 'center';
                  target.style.justifyContent = 'center';
                  target.innerHTML = '<span style="color: #6b7280;">{t("Failed to load")}</span>';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', item.urlFile || item.linkImage || item.url);
                }}
              />
            ) : (item.mediaType === 'video' || item.fileType?.startsWith('video') || item.linkVideo) ? (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center relative">
                <video
                  src={item.urlFile || item.linkVideo || item.url}
                  className="w-full h-full object-cover rounded-lg"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12  bg-opacity-50 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">{t('Media')}</span>
              </div>
            )}

            {/* <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                <button
                  className="flex items-center space-x-1 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.postCode);
                  }}
                >
                  <HeartIcon className="w-4 h-4" />
                  <span className="text-sm">{item.postLikes || 0}</span>
                </button>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{item.postComments || 0}</span>
                </div>
              </div>
            </div> */}
          </div>
        ))}
      </div>

      {/* Loading indicator for pagination */}
      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasNextPage && mediaItems.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {t('No more media to load')}
        </div>
      )}
    </div>
  );
};

export default UserMediaGrid;
