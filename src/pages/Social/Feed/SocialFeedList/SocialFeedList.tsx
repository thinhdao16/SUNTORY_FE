import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { PrivacyPostType } from '@/types/privacy';
import { SocialFeedService, HashtagInterest } from '@/services/social/social-feed-service';
import { useSocialFeedStore, generateFeedKey } from '@/store/zustand/social-feed-store';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { useAuthStore } from '@/store/zustand/auth-store';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { usePostRepost } from '../hooks/usePostRepost';
import { TabNavigation, HashtagInput, PostsList, LoadingStates, FriendSuggestions } from './components';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useIonToast, IonContent } from '@ionic/react';
import { useRefreshCallback } from '@/contexts/RefreshContext';
import { usePostSignalR } from '@/hooks/usePostSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';

interface SocialFeedListProps {
  privacy?: PrivacyPostType;
  className?: string;
  activeTab?: string;
  specificHashtag?: string;
}

export const SocialFeedList: React.FC<SocialFeedListProps> = ({
  privacy,
  className = '',
  activeTab: initialActiveTab,
  specificHashtag
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const postsListRef = useRef<HTMLDivElement>(null);
  const lastRefreshTime = useRef<number>(Date.now());
  const scrollPosition = useRef<number>(0);
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'everyone');
  const currentPrivacy = useMemo<PrivacyPostType | undefined>(() => {
    if (activeTab.startsWith('#')) return PrivacyPostType.Hashtag;
    switch (activeTab) {
      case 'everyone':
        return PrivacyPostType.Public;
      case 'your-friends':
        return PrivacyPostType.Friend;
      case 'for-you':
        return PrivacyPostType.Private;
      case 'Hashtags':
        return PrivacyPostType.Hashtag;
      default:
        return privacy;
    }
  }, [activeTab, privacy]);
  const [selectedHashtag, setSelectedHashtag] = useState<string>(specificHashtag || '');
  const [recentHashtags, setRecentHashtags] = useState<string[]>([]);
  const [showFriendSuggestions, setShowFriendSuggestions] = useState(true);
  // Repost privacy handled inside SocialFeedCard via embedded PrivacyBottomSheet

  const getTabsConfig = React.useCallback(() => {
    const staticTabs = [
      { key: 'everyone', label: 'Everyone', type: 'static' as const },
      { key: 'your-friends', label: 'Your friends', type: 'static' as const },
      { key: 'for-you', label: 'For you', type: 'static' as const },
    ];

    const hashtagTabs = recentHashtags.map(hashtag => ({
      key: `#${hashtag}`,
      label: `#${hashtag}`,
      type: 'hashtag' as const
    }));

    return [...staticTabs, ...hashtagTabs];
  }, [recentHashtags]);
  const { data: hashtagInterestsData, isLoading: isLoadingHashtags } = useQuery(
    ['hashtagInterests'],
    () => SocialFeedService.getHashtagInterests(),
    {
      select: (data: any) => {
        if (data?.data?.data) {
          return data.data.data.map((hashtag: HashtagInterest) => hashtag.hashtagNormalized).slice(0, 5);
        }
      },
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );

  const deleteHashtagMutation = useMutation(
    (hashtag: string) => SocialFeedService.deleteHashtagInterest(hashtag),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hashtagInterests']);
      },
      onError: (error) => {
        console.error('Failed to delete hashtag:', error);
      }
    }
  );

  useEffect(() => {
    if (hashtagInterestsData) {
      setRecentHashtags(hashtagInterestsData);
    }
  }, [hashtagInterestsData]);

  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  const { setCurrentPost, getFeedPosts, cachedFeeds, setActiveFeedKey, applyRealtimePatch } = useSocialFeedStore();
  const { user } = useAuthStore();
  const [presentToast] = useIonToast();
  const postLikeMutation = usePostLike();
  const postRepostMutation = usePostRepost();
  const deviceInfo = useDeviceInfo();
  
  const { joinPostUpdates, leavePostUpdates } = usePostSignalR(deviceInfo.deviceId ?? '', {
    autoConnect: true,
    enableDebugLogs: false,
    onPostCreated: (data) => {
      console.log('New post created via SignalR:', data);
      // presentToast({
      //   message: t('New post added to feed'),
      //   duration: 2000,
      //   position: 'top',
      //   color: 'success'
      // });
    },
    onPostUpdated: (data) => {
      console.log('Post updated via SignalR:', data);
    },
    onCommentAdded: (data) => {
      console.log('Comment added via SignalR:', data);
    },
    onPostLiked: (data) => {
      console.log('Post liked via SignalR:', data);
    },
    onPostUnliked: (data) => {
      console.log('Post unliked via SignalR:', data);
    }
  });

  const MAX_REALTIME_POSTS = 10;
  const JOIN_DELAY_MS = 2000;
  const LEAVE_DELAY_MS = 1200;
  const [visiblePostCodes, setVisiblePostCodes] = useState<string[]>([]);
  const joinTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const leaveTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const joinedPostsRef = useRef<Set<string>>(new Set());
  const visiblePostCodesRef = useRef<string[]>([]);

  const handleVisiblePostsChange = useCallback((codes: string[]) => {
    const next = codes.slice(0, MAX_REALTIME_POSTS);
    setVisiblePostCodes((prev) => {
      if (prev.length === next.length && prev.every((code, index) => code === next[index])) {
        return prev;
      }
      return next;
    });
  }, []);

  const { setScrollContainer } = useScrollRestoration({
    feedType: currentPrivacy ? Number(currentPrivacy) : undefined,
    hashtagNormalized: (activeTab === 'Hashtags' && selectedHashtag) ? selectedHashtag.replace('#', '') : 
                      (activeTab.startsWith('#')) ? activeTab.substring(1) : undefined,
    enabled: true
  });
  const currentFeedKey = generateFeedKey(
    currentPrivacy ? Number(currentPrivacy) : undefined,
    (activeTab === 'Hashtags' && selectedHashtag) ? selectedHashtag.replace('#', '') : 
    (activeTab.startsWith('#')) ? activeTab.substring(1) : undefined
  );

  const posts = getFeedPosts(currentFeedKey);
  const {
    isLoading: loading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isFetchingNextPage
  } = useSocialFeed({
    pageSize: 20,
    feedType: currentPrivacy ? Number(currentPrivacy) : undefined,
    hashtagNormalized: (activeTab === 'Hashtags' && selectedHashtag) ? selectedHashtag.replace('#', '') : 
                      (activeTab.startsWith('#')) ? activeTab.substring(1) : undefined,
    enabled: true,
    staleTime: 5 * 60 * 1000, 
    cacheTime: 30 * 60 * 1000, 
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    if (contentRef.current) {
      contentRef.current.scrollToTop(300);
    }
    
    lastRefreshTime.current = Date.now();
    
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useRefreshCallback('/social-feed', handleRefresh);

  useEffect(() => {
    const saveScrollPosition = () => {
      if (contentRef.current) {
        contentRef.current.getScrollElement().then((scrollElement) => {
          if (scrollElement) {
            scrollPosition.current = scrollElement.scrollTop;
          }
        });
      }
    };

    const handleBeforeUnload = () => saveScrollPosition();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (posts.length > 0 && scrollPosition.current > 0) {
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollToPoint(0, scrollPosition.current, 0);
        }
      }, 100);
    }
  }, [posts.length]);

  useEffect(() => {
    const checkAndRefresh = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastRefresh > fiveMinutes && !document.hidden) {
        refetch();
        lastRefreshTime.current = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    checkAndRefresh();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  useEffect(() => {
    visiblePostCodesRef.current = visiblePostCodes;
    const targetSet = new Set(visiblePostCodes);

    const scheduleJoin = (code: string, delay = JOIN_DELAY_MS) => {
      if (joinedPostsRef.current.has(code) || joinTimeoutsRef.current.has(code)) {
        return;
      }
      const timer = setTimeout(async () => {
        const joined = await joinPostUpdates(code);
        joinTimeoutsRef.current.delete(code);
        if (joined !== false) {
          joinedPostsRef.current.add(code);
        } else if (visiblePostCodesRef.current.includes(code)) {
          scheduleJoin(code, Math.min(delay + 500, 5000));
        }
      }, delay);
      joinTimeoutsRef.current.set(code, timer);
    };

    visiblePostCodes.forEach((code) => {
      const leaveTimer = leaveTimeoutsRef.current.get(code);
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimeoutsRef.current.delete(code);
      }
    });

    visiblePostCodes.forEach((code) => {
      scheduleJoin(code);
    });

    joinTimeoutsRef.current.forEach((timer, code) => {
      if (!targetSet.has(code)) {
        clearTimeout(timer);
        joinTimeoutsRef.current.delete(code);
      }
    });

    joinedPostsRef.current.forEach((code) => {
      if (targetSet.has(code) || leaveTimeoutsRef.current.has(code)) {
        return;
      }
      const timer = setTimeout(async () => {
        try {
          await leavePostUpdates(code);
        } catch (error) {
          console.warn(`Failed to leave post updates for ${code}:`, error);
        } finally {
          leaveTimeoutsRef.current.delete(code);
          joinedPostsRef.current.delete(code);
        }
      }, LEAVE_DELAY_MS);
      leaveTimeoutsRef.current.set(code, timer);
    });
  }, [visiblePostCodes, joinPostUpdates, leavePostUpdates]);

  useEffect(() => {
    return () => {
      joinTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      leaveTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      joinTimeoutsRef.current.clear();
      leaveTimeoutsRef.current.clear();
      joinedPostsRef.current.forEach((code) => {
        leavePostUpdates(code).catch(error => {
          console.warn(`Cleanup: Failed to leave post updates for ${code}:`, error);
        });
      });
      joinedPostsRef.current.clear();
    };
  }, [leavePostUpdates]);

  const handleLike = useCallback((postCode: string) => {
    const post = posts.find((p: any) => p.code === postCode);
    if (!post) return;

    postLikeMutation.mutate({
      postCode,
      isLiked: post.isLike || false
    });
  }, [posts, postLikeMutation]);

  const handleComment = useCallback((postCode: string) => {
    const selectedPost = posts.find((post: any) => post.code === postCode);

    if (selectedPost) {
      setCurrentPost(selectedPost);
    }
    history.push(`/social-feed/f/${postCode}`);
  }, [posts, setCurrentPost, history]);

  const handlePostClick = useCallback((postCode: string) => {
    const selectedPost = posts.find((post: any) => post.code === postCode);
    if (selectedPost) {
      setCurrentPost(selectedPost);
    }
    console.log(selectedPost)
    history.push(`/social-feed/f/${postCode}`);
  }, [posts, setCurrentPost, history]);

  const handleShare = useCallback((postCode: string) => {
  }, []);

  const handleRepostConfirm = useCallback((postCode: string, privacy: PrivacyPostType) => {
    let savedScrollTop = 0;
    const captureScroll = async () => {
      try {
        if (contentRef.current) {
          const el = await contentRef.current.getScrollElement();
          savedScrollTop = el?.scrollTop || 0;
        }
      } catch {}
    };

    void captureScroll();

    const target = posts.find((p: any) => p.code === postCode) as any | undefined;
    const prevCount = target?.repostCount ?? 0;
    const wasReposted = Boolean(target?.isRepostedByCurrentUser);

    // optimistic toggle
    if (wasReposted) {
      applyRealtimePatch(postCode, {
        isRepostedByCurrentUser: false,
        repostCount: Math.max(0, prevCount - 1),
      } as any);
    } else {
      applyRealtimePatch(postCode, {
        isRepostedByCurrentUser: true,
        repostCount: prevCount + 1,
      } as any);
    }

    postRepostMutation.mutate(
      {
        postCode,
        caption: 'Repost',
        privacy: Number(privacy)
      },
      {
        onError: () => {
          // rollback
          if (wasReposted) {
            applyRealtimePatch(postCode, {
              isRepostedByCurrentUser: true,
              repostCount: prevCount,
            } as any);
          } else {
            applyRealtimePatch(postCode, {
              isRepostedByCurrentUser: false,
              repostCount: prevCount,
            } as any);
          }
        },
        onSettled: () => {
          // preserve scroll position
          try {
            if (contentRef.current && savedScrollTop > 0) {
              contentRef.current.scrollToPoint(0, savedScrollTop, 0);
            }
          } catch {}
        }
      }
    );
  }, [postRepostMutation, posts, applyRealtimePatch]);

  // currentPrivacy is derived via useMemo above to avoid extra initial fetch

  const handleTabChange = useCallback((tab: string) => {
    if (tab.startsWith('#')) {
      const hashtag = tab.substring(1);
      const encodedTab = `Hashtags=${hashtag}`;
      history.push(`/social-feed/recent/${encodedTab}`);
    } else {
      
      history.push(`/social-feed/recent/${tab}`);
    }
  }, [history]);

  const handleHashtagDelete = useCallback((hashtag: string) => {
    deleteHashtagMutation.mutate(hashtag);
  }, [deleteHashtagMutation]);

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
    <IonContent 
      className={`${className} no-scrollbar`}
      style={{ 
        height: 'calc(100vh - 110px)'
      }}
      scrollY={true}
      ref={contentRef}
    >
      <div className="pb-28 relative">
        {refreshing && (
          <div className="absolute top-20 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm text-gray-600">{t('Refreshing...')}</span>
              </div>
            </div>
          </div>
        )}
        
        <TabNavigation
          tabs={getTabsConfig()}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onHashtagDelete={handleHashtagDelete}
          isLoadingHashtags={isLoadingHashtags}
        />

        {activeTab === 'Hashtags' && (
          <HashtagInput
            selectedHashtag={selectedHashtag}
            onHashtagChange={setSelectedHashtag}
            onSearch={refetch}
          />
        )}

        <PullToRefresh onRefresh={handleRefresh}>
          <PostsList
            ref={postsListRef}
            posts={posts}
            hasNextPage={hasNextPage || false}
            isFetchingNextPage={isFetchingNextPage || false}
            loading={loading || refreshing}
            onFetchNextPage={fetchNextPage}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onRepostConfirm={handleRepostConfirm}
            onPostClick={handlePostClick}
            onVisiblePostsChange={handleVisiblePostsChange}
            interstitial={showFriendSuggestions && posts.length > 5 ? (
              <FriendSuggestions
                title={t('Suggested for you')}
                pageSize={8}
                onDismiss={() => setShowFriendSuggestions(false)}
              />
            ) : undefined}
            interstitialAfter={4}
          />
        </PullToRefresh>

        <LoadingStates
          loading={loading || refreshing}
          isFetchingNextPage={isFetchingNextPage || false}
          isRefetching={isRefetching}
          refreshing={refreshing}
          hasNextPage={hasNextPage || false}
          posts={posts}
          error={error}
          onRefresh={handleRefresh}
          onFetchNextPage={fetchNextPage}
        />
      </div>

      {/* PrivacyBottomSheet is embedded inside SocialFeedCard now */}
    </IonContent>
  );
};
