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
        loadMoreData
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
    
    const [localPosts, setLocalPosts] = useState<SocialPost[]>([]);

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
            // presentToast({
            //     message: t('New post added to feed'),
            //     duration: 2000,
            //     position: 'top',
            //     color: 'success'
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

    const handleVisiblePostsChange = useCallback((codes: string[]) => {
        const next = codes.slice(0, MAX_REALTIME_POSTS);
        setVisiblePostCodes((prev) => {
            if (prev.length === next.length && prev.every((code, index) => code === next[index])) {
                return prev;
            }
            return next;
        });
    }, []);

    const transformedPosts: SocialPost[] = useMemo(() => {
        return (posts || []).map((post: any, index: number) => {
            const isFeedPost = post.hasOwnProperty('reactionCount');
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
                    isRepostedByCurrentUser: false,
                    viewCount: post.viewCount || 0,
                    isBookmarked: post.isBookmarked || false,
                    bookmarkCount: post.bookmarkCount || 0
                };
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
                    isUserReposted: false,
                    reactionCount: 0,
                    commentCount: 0,
                    repostCount: 0,
                    shareCount: 0,
                    viewCount: 0,
                    isBookmarked: false,
                    bookmarkCount: 0,
                    isLike: false,
                    originalPost: null,
                    isFriend: false
                };
            }
        });
    }, [posts]);

    useEffect(() => {
        setLocalPosts(transformedPosts);
    }, [transformedPosts]);

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

    useEffect(() => {
        if (searchQuery && activeTab) {
            handleTabSearch(activeTab, searchQuery);
        }
    }, [activeTab, searchQuery]);

    const handleTabSearch = async (tab: string, query: string) => {
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
                        <span className="ml-1">• {user.postCount} new posts</span>
                    )}
                </div>
            </div>
        </button>
    );

    const renderPostCard = (post: SocialPost) => (
        <div key={post.code} className="border-b border-gray-100" data-post-code={post.code}>
            <SocialFeedCard
                post={post}
                onPostClick={() => onPostClick(post)}
                onLike={() => handleLike(post.code)}
                onComment={() => handleComment(post.code)}
                onShare={() => handleShare(post.code)}
                onRepostConfirm={(code, privacy) => handleRepostConfirm(code, privacy)}
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
                                {localPosts
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
                                    <h3 className="font-semibold text-gray-900">People</h3>
                                    <button
                                        onClick={() => handleTabChange('people')}
                                        className="text-main text-sm"
                                    >
                                        See all
                                    </button>
                                </div>
                                <div className="">
                                    {users.slice(0, 3).map(renderUserItem)}
                                </div>
                            </div>
                        )}
                        {localPosts.length > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="font-semibold text-gray-900">Posts</span>
                                    <button
                                        onClick={() => handleTabChange('posts')}
                                        className="text-main text-sm"
                                    >
                                        See All 
                                    </button>
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
            >
                {renderContent()}
            </InfiniteScrollContainer>
            {/* PrivacyBottomSheet is embedded inside SocialFeedCard now */}
        </>
    );
};

export default SearchResults;
