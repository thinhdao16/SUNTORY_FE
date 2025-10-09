import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import { PrivacyPostType } from '@/types/privacy';
import { usePostSignalR } from '@/hooks/usePostSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';

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
    } = useUserPosts(tabType, targetUserId, 20, { enabled: targetUserId === undefined || !!targetUserId }) as any;

    // Flatten pages early so effects can depend on it safely
    const allPosts = data?.pages?.flatMap((page: any) => page?.data?.data || []) || [];

    const postLikeMutation = useUserPostLike({ tabType, targetUserId });
    const postRepostMutation = useUserPostRepost({ tabType, targetUserId });
    const postUpdateMutation = useUserPostUpdate({ tabType, targetUserId });
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const fetchingRef = useRef(false);
    const ioRef = useRef<IntersectionObserver | null>(null);
    const lastFetchAtRef = useRef(0);
    const initialAutoLoadsRemainingRef = useRef(2);
    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const itemObserverRef = useRef<IntersectionObserver | null>(null);
    const visibilityMapRef = useRef<Map<string, boolean>>(new Map());
    const [visiblePostCodes, setVisiblePostCodes] = useState<string[]>([]);

    // Single SignalR connection for Profile list
    const deviceInfo = useDeviceInfo();
    const { joinPostUpdates, leavePostUpdates } = usePostSignalR(deviceInfo.deviceId ?? '', {
        autoConnect: true,
        enableDebugLogs: false,
    });
    const MAX_REALTIME_POSTS = 8;
    const JOIN_DELAY_MS = 1200;
    const LEAVE_DELAY_MS = 800;
    const joinTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const leaveTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const joinedPostsRef = useRef<Set<string>>(new Set());

    // Reset auto load budget when tab/user changes
    useEffect(() => {
        initialAutoLoadsRemainingRef.current = 2;
        lastFetchAtRef.current = 0;
    }, [tabType, targetUserId]);

    useEffect(() => {
        if (!scrollRef.current || !sentinelRef.current) return;
        const root = scrollRef.current;

        // Disconnect previous observer if any
        if (ioRef.current) ioRef.current.disconnect();

        const io = new IntersectionObserver(
            async (entries) => {
                const entry = entries[0];
                if (!entry.isIntersecting) return;
                if (!hasNextPage || isFetchingNextPage || fetchingRef.current) return;

                // Throttle to prevent cascaded rapid fetches
                const now = Date.now();
                if (now - lastFetchAtRef.current < 400) return;

                // Limit auto-loads on first render to avoid spamming many pages
                const allowAutoLoad = initialAutoLoadsRemainingRef.current > 0;
                const userHasScrolled = root.scrollTop > 0; // allow unlimited after user scrolls
                if (!allowAutoLoad && !userHasScrolled) return;

                fetchingRef.current = true;
                lastFetchAtRef.current = now;
                try {
                    await fetchNextPage();
                } finally {
                    fetchingRef.current = false;
                    if (initialAutoLoadsRemainingRef.current > 0) {
                        initialAutoLoadsRemainingRef.current -= 1;
                    }
                }
            },
            { root, rootMargin: '100px', threshold: 0.01 }
        );

        io.observe(sentinelRef.current);
        ioRef.current = io;
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, allPosts.length]);

    // Observe each card to compute visible posts and manage SignalR joins
    const setItemRef = useCallback((code: string, node: HTMLDivElement | null) => {
        const obs = itemObserverRef.current;
        const prev = itemRefs.current.get(code);
        if (prev && obs) {
            obs.unobserve(prev);
        }
        if (node) {
            itemRefs.current.set(code, node);
            if (obs) obs.observe(node);
        } else {
            itemRefs.current.delete(code);
            visibilityMapRef.current.delete(code);
        }
    }, []);

    const handleVisibilityEntries = useCallback((entries: IntersectionObserverEntry[]) => {
        let changed = false;
        entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            const code = el.dataset.postCode;
            if (!code) return;
            const visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
            const prev = visibilityMapRef.current.get(code) || false;
            if (prev !== visible) {
                visibilityMapRef.current.set(code, visible);
                changed = true;
            }
        });
        if (changed) {
            const visibleCodes: string[] = [];
            allPosts.forEach((p: any) => {
                if (visibilityMapRef.current.get(p.code)) {
                    visibleCodes.push(p.code);
                    const original = p?.originalPost?.code as string | undefined;
                    if (original) visibleCodes.push(original);
                }
            });
            setVisiblePostCodes(Array.from(new Set(visibleCodes)).slice(0, MAX_REALTIME_POSTS));
        }
    }, [allPosts]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleVisibilityEntries, {
            threshold: [0.1, 0.25, 0.5, 0.75, 0.9],
            root: scrollRef.current || null,
            rootMargin: '50px'
        });
        itemObserverRef.current = observer;
        // attach current nodes
        itemRefs.current.forEach((node) => { if (node) observer.observe(node); });
        return () => observer.disconnect();
    }, [handleVisibilityEntries]);

    useEffect(() => {
        const targetSet = new Set(visiblePostCodes);
        // cancel pending joins for posts no longer visible
        joinTimeoutsRef.current.forEach((timer, code) => {
            if (!targetSet.has(code)) {
                clearTimeout(timer);
                joinTimeoutsRef.current.delete(code);
            }
        });
        // schedule joins
        visiblePostCodes.forEach((code) => {
            if (joinedPostsRef.current.has(code) || joinTimeoutsRef.current.has(code)) return;
            const t = setTimeout(async () => {
                try {
                    const ok = await joinPostUpdates(code);
                    if (ok !== false) joinedPostsRef.current.add(code);
                } finally {
                    joinTimeoutsRef.current.delete(code);
                }
            }, JOIN_DELAY_MS);
            joinTimeoutsRef.current.set(code, t);
        });
        // schedule leaves for posts no longer visible
        joinedPostsRef.current.forEach((code) => {
            if (targetSet.has(code) || leaveTimeoutsRef.current.has(code)) return;
            const t = setTimeout(async () => {
                try { await leavePostUpdates(code); } catch {}
                finally {
                    leaveTimeoutsRef.current.delete(code);
                    joinedPostsRef.current.delete(code);
                }
            }, LEAVE_DELAY_MS);
            leaveTimeoutsRef.current.set(code, t);
        });
        return () => {
            // no-op
        };
    }, [visiblePostCodes, joinPostUpdates, leavePostUpdates]);

    useEffect(() => {
        return () => {
            joinTimeoutsRef.current.forEach((t) => clearTimeout(t));
            leaveTimeoutsRef.current.forEach((t) => clearTimeout(t));
            joinTimeoutsRef.current.clear();
            leaveTimeoutsRef.current.clear();
            joinedPostsRef.current.forEach((code) => { void leavePostUpdates(code); });
            joinedPostsRef.current.clear();
        };
    }, [leavePostUpdates]);

    const handleLike = (postCode: string) => {
        const post = allPosts.find((p: any) => p.code === postCode);
        if (!post) return;

        const currentIsLiked = post.isLike || false;
        
        postLikeMutation.mutate({
            postCode,
            isLiked: currentIsLiked
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

    const handleRepostConfirm = (postCode: string, privacy: PrivacyPostType) => {
        postRepostMutation.mutate({
            postCode,
            caption: 'Repost',
            privacy: Number(privacy)
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
        <div className="bg-white" ref={scrollRef} style={{ height: '100%' }}>
            {allPosts.map((post: any, index: number) => (
                <div key={post.id || post.code} data-post-code={post.code} ref={(node) => setItemRef(post.code, node)}>
                    <SocialFeedCard
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={handleShare}
                        onRepostConfirm={handleRepostConfirm}
                        onPostClick={handlePostClick}
                        onPostUpdate={(updatedPost) => {
                            postUpdateMutation.mutate(updatedPost);
                        }}
                        containerRefCallback={(node) => setItemRef(post.code, node)}
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

            {/* PrivacyBottomSheet is embedded inside SocialFeedCard now */}
        </div>
    );
};

export default UserPostsList;
