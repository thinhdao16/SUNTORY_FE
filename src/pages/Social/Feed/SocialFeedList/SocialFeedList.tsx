import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { PrivacyPostType } from '@/types/privacy';
import { SocialFeedService, HashtagInterest } from '@/services/social/social-feed-service';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { useAuthStore } from '@/store/zustand/auth-store';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { usePostRepost } from '../hooks/usePostRepost';
import { TabNavigation, HashtagInput, PostsList, LoadingStates } from './components';
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
import { useIonToast } from '@ionic/react';

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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'everyone');
  const [currentPrivacy, setCurrentPrivacy] = useState<PrivacyPostType | undefined>(privacy);
  const [selectedHashtag, setSelectedHashtag] = useState<string>(specificHashtag || '');
  const [recentHashtags, setRecentHashtags] = useState<string[]>([]);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);
  const [repostingPostCode, setRepostingPostCode] = useState<string | null>(null);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyPostType>(PrivacyPostType.Public);

  const getTabsConfig = () => {
    const staticTabs = [
      { key: 'everyone', label: 'Everyone', type: 'static' as const },
      { key: 'your-friends', label: 'Your friends', type: 'static' as const },
      // { key: 'for-you', label: 'For you', type: 'static' as const },
    ];

    const hashtagTabs = recentHashtags.map(hashtag => ({
      key: `#${hashtag}`,
      label: `#${hashtag}`,
      type: 'hashtag' as const
    }));

    return [...staticTabs, ...hashtagTabs];
  };
  useEffect(() => {
    const fetchRecentHashtags = async () => {
      setIsLoadingHashtags(true);
      try {
        const response = await SocialFeedService.getHashtagInterests();
        if (response.success && response.data) {
          const hashtagNames = response.data.map((hashtag: HashtagInterest) => hashtag.name);
          setRecentHashtags(hashtagNames.slice(0, 5));
        } else {
          setRecentHashtags(['sức khỏe', 'thói quen', 'yêu thương', 'thói quen', 'sức khỏe']);
        }
      } catch (error) {
        console.error('Failed to fetch recent hashtags:', error);
        setRecentHashtags(['sức khỏe', 'thói quen', 'yêu thương', 'thói quen', 'sức khỏe']);
      } finally {
        setIsLoadingHashtags(false);
      }
    };

    fetchRecentHashtags();
  }, []);

  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  const { setCurrentPost, getFeedPosts } = useSocialFeedStore();
  const { user } = useAuthStore();
  const [present] = useIonToast();
  const postLikeMutation = usePostLike();
  const postRepostMutation = usePostRepost();

  // Scroll restoration hook
  const { setScrollContainer } = useScrollRestoration({
    feedType: currentPrivacy ? Number(currentPrivacy) : undefined,
    hashtagNormalized: (activeTab === 'Hashtags' && selectedHashtag) ? selectedHashtag.replace('#', '') : 
                      (activeTab.startsWith('#')) ? activeTab.substring(1) : undefined,
    enabled: true
  });

  const {
    posts,
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
    enabled: true
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
    history.push(`/social-feed/f/${postCode}`);
  }, [posts, setCurrentPost, history]);

  const handleShare = useCallback((postCode: string) => {
  }, []);

  const handleRepost = useCallback((postCode: string) => {
      // Find the post to check ownership
    const post = posts.find((p: any) => p.code === postCode);
    if (!post || !user) return;

    // Check if this is user's own post (either original post or repost)
    const isOwnPost = post.user.id === user.id;
    const isOwnOriginalPost = post.isRepost && post.originalPost && post.originalPost.user.id === user.id;

    if (isOwnPost || isOwnOriginalPost) {
      present({
        message: t('You cannot repost your own post'),
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      return;
    }

    setRepostingPostCode(postCode);
    setShowPrivacySheet(true);
  }, [posts, user, present, t]);

  const handleSelectPrivacy = useCallback((privacy: PrivacyPostType) => {
    if (repostingPostCode) {
      postRepostMutation.mutate({
        postCode: repostingPostCode,
        caption: "Repost", 
        privacy: Number(privacy)
      });
      setRepostingPostCode(null);
    }
    setSelectedPrivacy(privacy);
    setShowPrivacySheet(false);
  }, [repostingPostCode, postRepostMutation]);

  const handleCloseModal = useCallback(() => {
    setRepostingPostCode(null);
    setShowPrivacySheet(false);
  }, []);

  useEffect(() => {
    let newPrivacy: PrivacyPostType | undefined;
    if (activeTab.startsWith('#')) {
      newPrivacy = PrivacyPostType.Hashtag;
    } else {
      switch (activeTab) {
        case 'everyone':
          newPrivacy = PrivacyPostType.Public;
          break;
        case 'your-friends':
          newPrivacy = PrivacyPostType.Friend;
          break;
        case 'for-you':
          newPrivacy = PrivacyPostType.Private;
          break;
        case 'Hashtags':
          newPrivacy = PrivacyPostType.Hashtag;
          break;
        default:
          newPrivacy = undefined;
      }
    }
    setCurrentPrivacy(newPrivacy);
  }, [activeTab]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab.startsWith('#')) {
      const hashtag = tab.substring(1);
      const encodedTab = `Hashtags=${hashtag}`;
      history.push(`/social-feed/recent/${encodedTab}`);
    } else {
      history.push(`/social-feed/recent/${tab}`);
    }
  }, [history]);

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
    <div 
      className={`${className}`}
      ref={setScrollContainer}
      style={{ height: '100vh'}}
    >
      <TabNavigation
        tabs={getTabsConfig()}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isLoadingHashtags={isLoadingHashtags}
      />

      {activeTab === 'Hashtags' && (
        <HashtagInput
          selectedHashtag={selectedHashtag}
          onHashtagChange={setSelectedHashtag}
          onSearch={refetch}
        />
      )}

      <PostsList
        posts={posts}
        hasNextPage={hasNextPage || false}
        isFetchingNextPage={isFetchingNextPage || false}
        loading={loading}
        onFetchNextPage={fetchNextPage}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onRepost={handleRepost}
        onPostClick={handlePostClick}
      />

      <LoadingStates
        loading={loading}
        isFetchingNextPage={isFetchingNextPage || false}
        isRefetching={isRefetching}
        refreshing={refreshing}
        hasNextPage={hasNextPage || false}
        posts={posts}
        error={error}
        onRefresh={handleRefresh}
        onFetchNextPage={fetchNextPage}
      />

      <PrivacyBottomSheet
        isOpen={showPrivacySheet}
        closeModal={handleCloseModal}
        selectedPrivacy={selectedPrivacy}
        onSelectPrivacy={handleSelectPrivacy}
      />
    </div>
  );
};
