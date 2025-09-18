import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';
import { useUserPosts, ProfileTabType } from '../hooks/useUserPosts';
import { useAuthStore } from '@/store/zustand/auth-store';
import { useUserPostLike } from '../hooks/useUserPostLike';
import { useUserPostRepost } from '../hooks/useUserPostRepost';
import { useUserPostUpdate } from '../hooks/useUserPostUpdate';
import { handleCopyToClipboard } from '@/components/common/HandleCoppy';
import { useToastStore } from '@/store/zustand/toast-store';
import { useHistory } from 'react-router-dom';

interface UserPostsListProps {
    tabType: ProfileTabType;
    targetUserId?: number;
}

const UserPostsList: React.FC<UserPostsListProps> = ({ tabType, targetUserId }) => {
    const { t } = useTranslation();
    const history = useHistory();
    const { user } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useUserPosts(tabType, targetUserId) as any;

    const postLikeMutation = useUserPostLike({ tabType, targetUserId });
    const postRepostMutation = useUserPostRepost({ tabType, targetUserId });
    const postUpdateMutation = useUserPostUpdate({ tabType, targetUserId });
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const fetchingRef = useRef(false);

    useEffect(() => {
        if (!scrollRef.current || !sentinelRef.current) return;
        const root = scrollRef.current;

        const io = new IntersectionObserver(
            async (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage &&
                    !fetchingRef.current
                ) {
                    fetchingRef.current = true;
                    await fetchNextPage();
                    fetchingRef.current = false;
                }
            },
            { root, rootMargin: '200px', threshold: 0 }
        );

        io.observe(sentinelRef.current);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


    const allPosts = data?.pages?.flatMap((page: any) => page?.data || []) || [];
    const handleLike = (postCode: string) => {
        const post = allPosts.find((p: any) => p.code === postCode);
        if (!post) return;

        postLikeMutation.mutate({
            postCode,
            isLiked: post.isLike || false
        });
    };

    const handleComment = (postCode: string) => {
        history.push(`/social-feed/f/${postCode}`);
    };

    const handleShare = (postCode: string) => {
        const shareUrl = `${window.location.origin}/social-feed/f/${postCode}`;
        handleCopyToClipboard(shareUrl);
        showToast(t('Link copied to clipboard'), 2000, 'success');
    };

    const handleRepost = (postCode: string) => {
        postRepostMutation.mutate({
            postCode,
            caption: '',
            privacy: 1
        });
    };


    const handlePostClick = (postCode: string) => {
        history.push(`/social-feed/f/${postCode}`);
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
                <div className="text-red-500 mb-4">{t('Failed to load posts')}</div>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    {t('Try Again')}
                </button>
            </div>
        );
    }

    if (data && data.pages && data.pages.length > 0 && !allPosts.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <div className="text-gray-500 text-center">
                    {tabType === ProfileTabType.Posts && t('No posts yet')}
                    {tabType === ProfileTabType.Media && t('No media posts yet')}
                    {tabType === ProfileTabType.Likes && t('No liked posts yet')}
                    {tabType === ProfileTabType.Reposts && t('No reposts yet')}
                </div>
            </div>
        );
    }

    if (!data || !data.pages || data.pages.length === 0) {
        return null;
    }

    return (
        <div className="bg-white" ref={scrollRef} style={{ height: '100%', overflowY: 'auto' }}>
            {allPosts.map((post: any, index: number) => (
                <div key={post.id || post.code}>
                    <SocialFeedCard
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={handleShare}
                        onRepost={handleRepost}
                        onPostClick={handlePostClick}
                        onPostUpdate={(updatedPost) => {
                            postUpdateMutation.mutate(updatedPost);
                        }}
                    />
                </div>
            ))}

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
                <div className="flex justify-center items-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {!hasNextPage && allPosts.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                    {t('No more posts to load')}
                </div>
            )}
        </div>
    );
};

export default UserPostsList;
