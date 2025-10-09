import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkCircle } from 'react-icons/io5';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import { SearchUser, SearchPost } from '@/services/social/search-service';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';
import { SocialPost } from '@/types/social-feed';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useHistory, useLocation } from 'react-router-dom';
import { useInfiniteSearch } from '@/hooks/useInfiniteSearch';
import InfiniteScrollContainer from '@/components/common/InfiniteScrollContainer';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { usePostRepost } from '@/pages/Social/Feed/hooks/usePostRepost';
import { usePostSignalR } from '@/hooks/usePostSignalR';
import { useIonToast } from '@ionic/react';
import { useAuthStore } from '@/store/zustand/auth-store';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { PrivacyPostType } from '@/types/privacy';
import { handleCopyToClipboard } from '@/components/common/HandleCoppy';
import { useQueryClient } from 'react-query';
import { useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest, useUnfriend } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useToastStore } from '@/store/zustand/toast-store';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';

interface SearchResultsProps {
    searchQuery: string;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onUserClick: (user: SearchUser) => void;
    onPostClick: (post: any) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
    searchQuery,
    activeTab: propActiveTab,
    onTabChange,
    onUserClick,
    onPostClick
}) => {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const [localActiveTab, setLocalActiveTab] = useState<'all' | 'latest' | 'people' | 'posts'>('all');

    const activeTab = propActiveTab || localActiveTab;

    const urlQuery = (new URLSearchParams(location.search).get('q') || '').trim();
    const effectiveQuery = urlQuery.length > 0 ? urlQuery : (searchQuery || '').trim();

    const {
        users,
        posts,
        isLoading,
        hasMore,
        loadMoreData,
        resetData
    } = useInfiniteSearch({
        searchQuery: effectiveQuery,
        activeTab,
        pageSize: 20
    });

    const queryClient = useQueryClient();
    const postLikeMutation = usePostLike();
    const postRepostMutation = usePostRepost();
    const deviceInfo = useDeviceInfo();
    const [presentToast] = useIonToast();
    const showToast = useToastStore((s) => s.showToast);
    
    // Friend request mutations
    const sendFriendRequestMutation = useSendFriendRequest(showToast, () => {});
    const acceptFriendRequestMutation = useAcceptFriendRequest(showToast, () => {});
    const rejectFriendRequestMutation = useRejectFriendRequest(showToast, () => {});
    const cancelFriendRequestMutation = useCancelFriendRequest(showToast, () => {});
    const unfriendMutation = useUnfriend(showToast, () => {});
    
    const [localPosts, setLocalPosts] = useState<SocialPost[]>([]);

    // Fingerprint the posts to detect in-place data changes from the data source
    // This helps re-compute transforms even when the array reference stays the same.
    const postsFingerprint = useMemo(() => {
        const arr: any[] = Array.isArray(posts) ? posts : [];
        try {
            return arr
                .map((p: any) => [
                    p?.code ?? "",
                    p?.reactionCount ?? "",
                    p?.commentCount ?? "",
                    p?.repostCount ?? "",
                    p?.shareCount ?? "",
                    p?.isLike ?? "",
                    (p?.isRepostedByCurrentUser ?? p?.isUserReposted ?? p?.isRepostByMe ?? ""),
                    p?.isFriend ?? "",
                    p?.updateDate ?? "",
                ].join(":"))
                .join("|");
        } catch {
            return String(arr.length);
        }
    }, [posts]);

    const tabs = useMemo(() => ([
        { key: 'all', label: t('All') },
        { key: 'latest', label: t('Latest') },
        { key: 'people', label: t('People') },
        { key: 'posts', label: t('Posts') }
    ] as const), [t]);

    const handleTabChange = useCallback((newTab: 'all' | 'latest' | 'people' | 'posts') => {
        const q = effectiveQuery;
        if (!propActiveTab) setLocalActiveTab(newTab);
        const path = `/social-feed/search-result/${newTab}?q=${encodeURIComponent(q)}`;
        history.replace(path);
        if (onTabChange) onTabChange(newTab);
    }, [effectiveQuery, history, onTabChange, propActiveTab]);

    const { joinPostUpdates, leavePostUpdates } = usePostSignalR(deviceInfo.deviceId ?? '', {
        autoConnect: true,
        enableDebugLogs: false,
        onPostCreated: (data) => {
            console.log('New post created via SignalR:', data);
        },
        onPostUpdated: (data) => {
            console.log('Post updated via SignalR:', data);
            // Update local posts if this update affects any posts in search results
            const postCode = data.postCode || data.originalPostCode || data?.post?.code;
            if (postCode) {
                setLocalPosts(prev => {
                    const updated = prev.map(post => {
                        if (post.code === postCode) {
                            return {
                                ...post,
                                isFriend: data.isFriend !== undefined ? data.isFriend : post.isFriend,
                                friendRequest: data.friendRequest !== undefined ? data.friendRequest : post.friendRequest,
                                reactionCount: data.reactionCount !== undefined ? data.reactionCount : post.reactionCount,
                                commentCount: data.commentCount !== undefined ? data.commentCount : post.commentCount,
                                repostCount: data.repostCount !== undefined ? data.repostCount : post.repostCount,
                                shareCount: data.shareCount !== undefined ? data.shareCount : post.shareCount,
                                isLike: data.isLike !== undefined ? data.isLike : post.isLike,
                            } as SocialPost;
                        }
                        return post;
                    });
                    return updated;
                });
                try {
                    useSearchResultsStore.getState().applyPostPatch(postCode, {
                        isFriend: data.isFriend,
                        friendRequest: data.friendRequest,
                        reactionCount: data.reactionCount,
                        commentCount: data.commentCount,
                        repostCount: data.repostCount,
                        shareCount: data.shareCount,
                        isLike: data.isLike,
                        isRepostedByCurrentUser: data.isRepostedByCurrentUser,
                    });
                } catch {}
            }
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
    const JOIN_DELAY_MS = 1200;
    const LEAVE_DELAY_MS = 800;
    const [visiblePostCodes, setVisiblePostCodes] = useState<string[]>([]);
    const joinTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const leaveTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const joinedPostsRef = useRef<Set<string>>(new Set());
    const containerElRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const itemObserverRef = useRef<IntersectionObserver | null>(null);
    const visibilityMapRef = useRef<Map<string, boolean>>(new Map());

    const setItemRef = useCallback((code: string, node: HTMLDivElement | null) => {
        const obs = itemObserverRef.current;
        const prev = itemRefs.current.get(code);
        if (prev && obs) obs.unobserve(prev);
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
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
            const prev = visibilityMapRef.current.get(code) || false;
            if (prev !== isVisible) {
                visibilityMapRef.current.set(code, isVisible);
                changed = true;
            }
        });
        if (changed) {
            const codes: string[] = [];
            localPosts.forEach((p: SocialPost) => {
                if (visibilityMapRef.current.get(p.code)) {
                    codes.push(p.code);
                    const original = (p as any)?.originalPost?.code as string | undefined;
                    if (original) codes.push(original);
                }
            });
            const next = Array.from(new Set(codes)).slice(0, MAX_REALTIME_POSTS);
            setVisiblePostCodes((prev) => {
                if (prev.length === next.length && prev.every((c, i) => c === next[i])) return prev;
                return next;
            });
        }
    }, [localPosts]);

    useEffect(() => {
        if (!containerElRef.current) return;
        const observer = new IntersectionObserver(handleVisibilityEntries, {
            threshold: [0.1, 0.25, 0.5, 0.75, 0.9],
            root: containerElRef.current,
            rootMargin: '50px'
        });
        itemObserverRef.current = observer;
        itemRefs.current.forEach((node) => { if (node) observer.observe(node); });
        return () => observer.disconnect();
    }, [handleVisibilityEntries]);

    useEffect(() => {
        const targetSet = new Set(visiblePostCodes);
        // cancel pending joins for codes no longer visible
        joinTimeoutsRef.current.forEach((timer, code) => {
            if (!targetSet.has(code)) {
                clearTimeout(timer);
                joinTimeoutsRef.current.delete(code);
            }
        });
        // schedule joins for visible codes
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
        // schedule leaves for non-visible codes
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
        return () => { /* no-op */ };
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

    const transformedPosts: SocialPost[] = useMemo(() => {
        return (posts || []).map((post: any, index: number) => {
            const isFeedPost = post.hasOwnProperty('reactionCount');
            const repostedFlag = Boolean(post?.isRepostedByCurrentUser ?? post?.isUserReposted ?? post?.isRepostByMe ?? false);
            if (isFeedPost) {
                return {
                    ...post,
                    reactions: post.reactions || [],
                    comments: post.comments || [],
                    reposts: post.reposts || [],
                    totalReactions: post.reactionCount || 0,
                    totalComments: post.commentCount || 0,
                    totalReposts: post.repostCount || 0,
                    userReaction: null,
                    isRepostedByCurrentUser: repostedFlag,
                    viewCount: post.viewCount || 0,
                    isBookmarked: post.isBookmarked || false,
                    bookmarkCount: post.bookmarkCount || 0,
                    shareCount: post.shareCount || 0,
                    isFriend: post.isFriend || false,
                    friendRequest: post.friendRequest || null
                } as any;
            } else {
                return {
                    id: Date.now() + index,
                    code: post.code,
                    userId: post.user.id,
                    content: post.content,
                    isRepost: false,
                    originalPostId: null,
                    captionRepost: null,
                    privacy: 10,
                    isPin: false,
                    status: 1,
                    createDate: post.createDate,
                    user: {
                        id: post.user.id,
                        firstName: post.user.fullName.split(' ')[0] || '',
                        lastName: post.user.fullName.split(' ').slice(1).join(' ') || '',
                        fullName: post.user.fullName,
                        email: '',
                        avatarUrl: post.user.avatar || null,
                        userName: post.user.username || null
                    },
                    media: post.media || [],
                    hashtags: post.hashtags || [],
                    reactions: [],
                    comments: [],
                    reposts: [],
                    totalReactions: 0,
                    totalComments: 0,
                    totalReposts: 0,
                    userReaction: null,
                    isRepostedByCurrentUser: repostedFlag,
                    reactionCount: 0,
                    commentCount: 0,
                    repostCount: 0,
                    shareCount: 0,
                    viewCount: 0,
                    isBookmarked: false,
                    bookmarkCount: 0,
                    isLike: false,
                    originalPost: null,
                    isFriend: post.isFriend || false,
                    friendRequest: post.friendRequest || null
                } as any;
            }
        });
    }, [posts, postsFingerprint]);

    useEffect(() => {
        // Reconcile server-transformed posts into local state on every change.
        // Server values always override local for overlapping fields.
        setLocalPosts(prev => {
            const prevMap = new Map(prev.map(p => [p.code, p]));
            const merged: SocialPost[] = transformedPosts.map(next => {
                const old = prevMap.get(next.code);
                return old ? ({ ...old, ...next } as SocialPost) : next;
            });
            return merged;
        });
    }, [transformedPosts]);

    // Listen to feed store changes to sync friend status updates from main feed
    useEffect(() => {
        const store = useSocialFeedStore.getState();
        const unsubscribe = useSocialFeedStore.subscribe((state) => {
            // Check if any posts in search results need to be updated based on feed store changes
            setLocalPosts(prev => {
                let hasChanges = false;
                const updated = prev.map(post => {
                    // Find this post in any cached feed to get latest friend status
                    let latestFriendStatus = null;
                    let latestFriendRequest = null;
                    
                    Object.values(state.cachedFeeds || {}).forEach(feed => {
                        const foundPost = feed?.posts?.find((p: any) => p?.code === post.code);
                        if (foundPost) {
                            latestFriendStatus = foundPost.isFriend;
                            latestFriendRequest = foundPost.friendRequest;
                        }
                    });
                    
                    // Also check current post detail
                    if (state.currentPost?.code === post.code) {
                        latestFriendStatus = state.currentPost.isFriend;
                        latestFriendRequest = state.currentPost.friendRequest;
                    }
                    
                    // Update if we found newer friend status
                    if (latestFriendStatus !== null && 
                        (latestFriendStatus !== post.isFriend || 
                         JSON.stringify(latestFriendRequest) !== JSON.stringify(post.friendRequest))) {
                        hasChanges = true;
                        return {
                            ...post,
                            isFriend: latestFriendStatus,
                            friendRequest: latestFriendRequest
                        } as SocialPost;
                    }
                    
                    return post;
                });
                
                return hasChanges ? updated : prev;
            });
        });
        
        return unsubscribe;
    }, []);

    // Also listen to query cache changes for feed details to sync friend status
    useEffect(() => {
        const interval = setInterval(() => {
            // Check if any posts in search have been updated in query cache
            setLocalPosts(prev => {
                let hasChanges = false;
                const updated = prev.map(post => {
                    const cachedDetail: any = queryClient.getQueryData(['feedDetail', post.code]);
                    if (cachedDetail && 
                        (cachedDetail.isFriend !== post.isFriend || 
                         JSON.stringify(cachedDetail.friendRequest) !== JSON.stringify(post.friendRequest))) {
                        hasChanges = true;
                        return {
                            ...post,
                            isFriend: cachedDetail.isFriend,
                            friendRequest: cachedDetail.friendRequest
                        } as SocialPost;
                    }
                    return post;
                });
                
                return hasChanges ? updated : prev;
            });
        }, 1000); // Check every second
        
        return () => clearInterval(interval);
    }, [queryClient]);

    // Determine if there is any result for the current tab to avoid showing
    // both the empty-state and the container's "No more results" indicator
    const hasAnyResults = useMemo(() => {
        switch (activeTab) {
            case 'people':
                return users.length > 0;
            case 'posts':
            case 'latest':
                return localPosts.length > 0;
            case 'all':
            default:
                return users.length > 0 || localPosts.length > 0;
        }
    }, [activeTab, users.length, localPosts.length]);

    const handleLike = useCallback((postCode: string) => {
        const post = localPosts.find((p: SocialPost) => p.code === postCode);
        if (!post) return;

        const currentIsLiked = post.isLike || false;
        
        setLocalPosts(prevPosts => 
            prevPosts.map(p => 
                p.code === postCode 
                    ? { 
                        ...p, 
                        isLike: !currentIsLiked,
                        reactionCount: currentIsLiked 
                            ? Math.max(0, (p.reactionCount || 0) - 1)
                            : (p.reactionCount || 0) + 1
                    } 
                    : p
            )
        );
        
        postLikeMutation.mutate(
            { postCode, isLiked: currentIsLiked },
            {
                onError: () => {
                    setLocalPosts(prevPosts => 
                        prevPosts.map(p => 
                            p.code === postCode 
                                ? { 
                                    ...p, 
                                    isLike: currentIsLiked,
                                    reactionCount: post.reactionCount
                                } 
                                : p
                        )
                    );
                    presentToast({
                        message: t('Failed to like post'),
                        duration: 2000,
                        position: 'top',
                        color: 'danger'
                    });
                }
            }
        );
    }, [localPosts, postLikeMutation, presentToast, t]);

    const handleComment = useCallback((postCode: string) => {
        history.push(`/social-feed/f/${postCode}?focus=comment`);
    }, [history]);

    const handleShare = useCallback((postCode: string) => {
        const shareUrl = `${window.location.origin}/social-feed/f/${postCode}`;
        handleCopyToClipboard(shareUrl);
        presentToast({
            message: t('Link copied to clipboard'),
            duration: 2000,
            position: 'top',
            color: 'success'
        });
    }, [presentToast, t]);

    const handleRepostConfirm = useCallback((postCode: string, privacy: PrivacyPostType) => {
        const { user } = useAuthStore.getState();
        const prevSnapshot = localPosts;

        const isUnrepostCase = localPosts.some(p => !!p.isRepost && p.user?.id === user?.id && p.originalPost?.code === postCode);

        setLocalPosts(prev => {
            let next = prev.map(p => {
                if (p.code === postCode) {
                    return {
                        ...p,
                        isRepostedByCurrentUser: isUnrepostCase ? false : true,
                        repostCount: Math.max(0, (p.repostCount || 0) + (isUnrepostCase ? -1 : 1))
                    };
                }
                return p;
            });
            if (isUnrepostCase) {
                next = next.filter(p => !(p.isRepost && p.user?.id === user?.id && p.originalPost?.code === postCode));
            }
            return next;
        });

        postRepostMutation.mutate(
            {
                postCode,
                caption: 'Repost',
                privacy: Number(privacy)
            },
            {
                onSuccess: async () => {
                    try {
                        const fresh = await SocialFeedService.getPostByCode(postCode);
                        setLocalPosts(prev => prev.map(p => p.code === postCode ? {
                            ...p,
                            isRepostedByCurrentUser: (fresh as any)?.isRepostedByCurrentUser as any,
                            repostCount: fresh?.repostCount,
                            reactionCount: fresh?.reactionCount,
                            commentCount: fresh?.commentCount,
                            shareCount: fresh?.shareCount,
                        } : p));
                    } catch {}
                },
                onError: () => {
                    setLocalPosts(prevSnapshot);
                    presentToast({
                        message: t('Failed to update repost'),
                        duration: 2000,
                        position: 'top',
                        color: 'danger'
                    });
                }
            }
        );
    }, [localPosts, postRepostMutation, presentToast, t]);

    // Function to refresh post details after friend actions
    const refreshPostDetail = useCallback(async (postCode: string) => {
        try {
            const fresh = await SocialFeedService.getPostByCode(postCode);
            const store = useSocialFeedStore.getState();
            store.applyRealtimePatch(postCode, {
                isFriend: (fresh as any)?.isFriend,
                friendRequest: (fresh as any)?.friendRequest,
            } as any);
            queryClient.setQueryData(['feedDetail', postCode], fresh);
            
            // Update local posts state
            setLocalPosts(prev => prev.map(p => 
                p.code === postCode 
                    ? { ...p, isFriend: (fresh as any)?.isFriend, friendRequest: (fresh as any)?.friendRequest }
                    : p
            ));
        } catch (error) {
            console.error('Failed to refresh post detail:', error);
        }
    }, [queryClient]);

    // Friend request handlers
    const handleSendFriendRequest = useCallback(async (userId: number, postCode?: string) => {
        try {
            await sendFriendRequestMutation.mutateAsync(userId);
            if (postCode) await refreshPostDetail(postCode);
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    }, [sendFriendRequestMutation, refreshPostDetail]);

    const handleAcceptFriendRequest = useCallback(async (requestId: number, postCode?: string) => {
        try {
            await acceptFriendRequestMutation.mutateAsync(requestId);
            if (postCode) await refreshPostDetail(postCode);
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        }
    }, [acceptFriendRequestMutation, refreshPostDetail]);

    const handleRejectFriendRequest = useCallback(async (requestId: number, postCode?: string) => {
        try {
            await rejectFriendRequestMutation.mutateAsync(requestId);
            if (postCode) await refreshPostDetail(postCode);
        } catch (error) {
            console.error('Failed to reject friend request:', error);
        }
    }, [rejectFriendRequestMutation, refreshPostDetail]);

    const handleCancelFriendRequest = useCallback(async (requestId: number, postCode?: string) => {
        try {
            await cancelFriendRequestMutation.mutateAsync(requestId);
            if (postCode) await refreshPostDetail(postCode);
        } catch (error) {
            console.error('Failed to cancel friend request:', error);
        }
    }, [cancelFriendRequestMutation, refreshPostDetail]);

    const handleUnfriend = useCallback(async (userId: number, postCode?: string) => {
        try {
            await unfriendMutation.mutateAsync({ friendUserId: userId });
            if (postCode) await refreshPostDetail(postCode);
        } catch (error) {
            console.error('Failed to unfriend:', error);
        }
    }, [unfriendMutation, refreshPostDetail]);

    useEffect(() => {
        if (effectiveQuery && activeTab) {
            handleTabSearch(activeTab, effectiveQuery);
        }
    }, [activeTab, effectiveQuery]);

    const handleTabSearch = async (tab: string, query: string) => {
        // Force refresh cached data for this key to avoid stale values
        resetData();
        await Promise.resolve();
        await loadMoreData();
    };

    const renderUserItem = (user: SearchUser) => (
        <button
            key={user.id}
            onClick={() => onUserClick(user)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
        >
            <img
                src={user.avatar || avatarFallback}
                alt={user.fullName}
                className="w-[56px] h-[56px] rounded-2xl object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = avatarFallback;
                }}
                loading="lazy"
                decoding="async"
            />
            <div className="flex-1 text-left">
                <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-900">{user.fullName}</span>
                    {user.isVerified && (
                        <IoCheckmarkCircle className="w-4 h-4 text-blue-500" />
                    )}
                </div>
                <div className="text-sm text-gray-500">
                    {user.username}
                    {user.postCount !== undefined && (
                        <span className="ml-1">• {user.postCount} {t("new posts")}</span>
                    )}
                </div>
            </div>
        </button>
    );

    const renderPostCard = (post: SocialPost) => (
        <div key={post.code} className="border-b border-gray-100" data-post-code={post.code} ref={(node) => setItemRef(post.code, node)}>
            <SocialFeedCard
                post={post}
                onPostClick={() => onPostClick(post)}
                onLike={() => handleLike(post.code)}
                onComment={() => handleComment(post.code)}
                onShare={() => handleShare(post.code)}
                onRepostConfirm={(code, privacy) => handleRepostConfirm(code, privacy)}
                onSendFriendRequest={(userId) => handleSendFriendRequest(userId, post.code)}
                onAcceptFriendRequest={(requestId) => handleAcceptFriendRequest(requestId, post.code)}
                onRejectFriendRequest={(requestId) => handleRejectFriendRequest(requestId, post.code)}
                onCancelFriendRequest={(requestId) => handleCancelFriendRequest(requestId, post.code)}
                onUnfriend={(userId) => handleUnfriend(userId, post.code)}
                onPostUpdate={(updatedPost) => {
                    // Merge partial patches from child (e.g., unrepost sends only code/repostCount)
                    setLocalPosts(prev => prev.map(p => {
                        if (p.code === (updatedPost as any)?.code || p.code === post.code) {
                            return { ...p, ...updatedPost } as any;
                        }
                        return p;
                    }));
                }}
            />
        </div>
    );


    const renderContent = () => {
        switch (activeTab) {
            case 'people':
                return (
                    <div>
                        {users.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {users.map(renderUserItem)}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {t('No users found')}
                            </div>
                        )}
                    </div>
                );

            case 'posts':
                return (
                    <div>
                        {localPosts.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {localPosts.map(renderPostCard)}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {t('No posts found')}
                            </div>
                        )}
                    </div>
                );

            case 'latest':
                return (
                    <div>
                        {localPosts.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {[...localPosts]
                                    .sort((a: SocialPost, b: SocialPost) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
                                    .map(renderPostCard)}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {t('No posts found')}
                            </div>
                        )}
                    </div>
                );

            case 'all':
            default:
                return (
                    <div>
                        {users.length > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center justify-between px-4 py-2 ">
                                    <h3 className="font-semibold text-gray-900">{t("People")}</h3>
                                    <button
                                        onClick={() => handleTabChange('people')}
                                        className="text-main text-sm"
                                    >
                                        {t("See all")}</button>
                                </div>
                                <div className="">
                                    {users.slice(0, 3).map(renderUserItem)}
                                </div>
                            </div>
                        )}
                        {localPosts.length > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="font-semibold text-gray-900">{t("Posts")}</span>
                                    <button
                                        onClick={() => handleTabChange('posts')}
                                        className="text-main text-sm"
                                    >
                                        {t("See All")}</button>
                                </div>
                                <div>
                                    {localPosts.slice(0, 3).map(renderPostCard)}
                                </div>
                            </div>
                        )}

                        {users.length === 0 && localPosts.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                {t('No results found for')} "{searchQuery}"
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <>
            <div className="flex border-b border-gray-100 flex-shrink-0 sticky top-16 z-10 bg-white pt-2">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.key}
                        onClick={() => handleTabChange(tabItem.key)}
                        className={`flex-1 py-3 px-4 text-sm transition-colors font-semibold flex justify-center ${activeTab === tabItem.key
                            ? 'text-black'
                            : 'text-netural-300'
                            }`}
                    >
                        <span className="relative">
                            {tabItem.label}
                            {activeTab === tabItem.key && (
                                <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                            )}
                        </span>
                    </button>
                ))}
            </div>
            <InfiniteScrollContainer
                onLoadMore={loadMoreData}
                hasMore={hasMore}
                isLoading={isLoading}
                className="pb-32"
                showEndIndicator={hasAnyResults}
                containerRefCallback={(el) => { containerElRef.current = el; }}
            >
                {renderContent()}
            </InfiniteScrollContainer>
            {/* PrivacyBottomSheet is embedded inside SocialFeedCard now */}
        </>
    );
};

export default SearchResults;
