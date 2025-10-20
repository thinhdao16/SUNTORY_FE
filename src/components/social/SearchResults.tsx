import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkCircle } from 'react-icons/io5';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import { SearchUser, SearchPost } from '@/services/social/search-service';
import { SocialFeedCard } from '@/pages/Social/Feed/components/SocialFeedCard';
import { SocialPost } from '@/types/social-feed';
import { useHistory } from 'react-router-dom';
import { useInfiniteSearch } from '@/hooks/useInfiniteSearch';
import InfiniteScrollContainer from '@/components/common/InfiniteScrollContainer';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { usePostRepost } from '@/pages/Social/Feed/hooks/usePostRepost';
import { usePostSignalR } from '@/hooks/usePostSignalR';
import { useIonToast } from '@ionic/react';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
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
    const [localActiveTab, setLocalActiveTab] = useState<'all' | 'latest' | 'people' | 'posts'>('all');

    const activeTab = propActiveTab || localActiveTab;

    // Use infinite search hook
    const {
        users,
        posts,
        isLoading,
        hasMore,
        loadMoreData
    } = useInfiniteSearch({
        searchQuery,
        activeTab,
        pageSize: 20
    });

    const queryClient = useQueryClient();
    const postLikeMutation = usePostLike();
    const postRepostMutation = usePostRepost();
    const deviceInfo = useDeviceInfo();
    const [presentToast] = useIonToast();
    
    const [showPrivacySheet, setShowPrivacySheet] = useState(false);
    const [repostPrivacy, setRepostPrivacy] = useState<PrivacyPostType>(PrivacyPostType.Public);
    const [pendingRepostCode, setPendingRepostCode] = useState<string | null>(null);
    const [localPosts, setLocalPosts] = useState<SocialPost[]>([]);

    const { joinPostUpdates, leavePostUpdates } = usePostSignalR(deviceInfo.deviceId ?? '', {
        autoConnect: true,
        enableDebugLogs: false,
        onPostCreated: (data) => {
            console.log('New post created via SignalR:', data);
            presentToast({
                message: t('New post added to feed'),
                duration: 2000,
                position: 'top',
                color: 'success'
            });
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
                    isUserReposted: false,
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

    // Update local posts when transformed posts change
    useEffect(() => {
        setLocalPosts(transformedPosts);
    }, [transformedPosts]);

    const handleLike = useCallback((postCode: string) => {
        const post = localPosts.find((p: SocialPost) => p.code === postCode);
        if (!post) return;

        const currentIsLiked = post.isLike || false;
        
        // Optimistic update - update UI immediately
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

    const handleRepost = useCallback((postCode: string) => {
        setPendingRepostCode(postCode);
        setShowPrivacySheet(true);
    }, []);

    const handlePrivacySelect = useCallback((privacy: PrivacyPostType) => {
        if (pendingRepostCode) {
            // Optimistic update for repost
            setLocalPosts(prevPosts => 
                prevPosts.map(p => 
                    p.code === pendingRepostCode 
                        ? { 
                            ...p, 
                            isUserReposted: true,
                            repostCount: (p.repostCount || 0) + 1
                        } 
                        : p
                )
            );

            postRepostMutation.mutate(
                {
                    postCode: pendingRepostCode,
                    caption: 'Repost',
                    privacy: Number(privacy)
                },
                {
                    onSuccess: () => {
                        presentToast({
                            message: t('Post reposted successfully'),
                            duration: 2000,
                            position: 'top',
                            color: 'success'
                        });
                    },
                    onError: () => {
                        // Rollback repost optimistic update
                        setLocalPosts(prevPosts => 
                            prevPosts.map(p => 
                                p.code === pendingRepostCode 
                                    ? { 
                                        ...p, 
                                        isUserReposted: false,
                                        repostCount: Math.max(0, (p.repostCount || 0) - 1)
                                    } 
                                    : p
                            )
                        );
                        presentToast({
                            message: t('Failed to repost'),
                            duration: 2000,
                            position: 'top',
                            color: 'danger'
                        });
                    }
                }
            );
        }
        setShowPrivacySheet(false);
        setPendingRepostCode(null);
        setRepostPrivacy(PrivacyPostType.Public);
    }, [pendingRepostCode, postRepostMutation, presentToast, t]);

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
                onPostClick={() => history.push(`/social-feed/f/${post.code}`)}
                onLike={() => handleLike(post.code)}
                onComment={() => handleComment(post.code)}
                onShare={() => handleShare(post.code)}
                onRepost={() => handleRepost(post.code)}
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
                                        onClick={() => onTabChange ? onTabChange('people') : setLocalActiveTab('people')}
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
                                        onClick={() => onTabChange ? onTabChange('posts') : setLocalActiveTab('posts')}
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
            <InfiniteScrollContainer
                onLoadMore={loadMoreData}
                hasMore={hasMore}
                isLoading={isLoading}
                className="pb-32"
            >
                {renderContent()}
            </InfiniteScrollContainer>
            <PrivacyBottomSheet
                isOpen={showPrivacySheet}
                closeModal={() => {
                    setShowPrivacySheet(false);
                    setPendingRepostCode(null);
                    setRepostPrivacy(PrivacyPostType.Public);
                }}
                selectedPrivacy={repostPrivacy}
                onSelectPrivacy={handlePrivacySelect}
            />
        </>
    );
};

export default SearchResults;
