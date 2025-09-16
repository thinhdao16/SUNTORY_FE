import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useFeedDetail } from '@/pages/Social/Feed/hooks/useFeedDetail';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useKeyboardResize } from '@/hooks/useKeyboardResize';
import { Capacitor } from '@capacitor/core';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';
import { useAuthStore } from '@/store/zustand/auth-store';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { useCreateComment } from '@/pages/Social/Feed/hooks/useCreateComment';
import { useInfiniteComments } from '@/pages/Social/Feed/hooks/useInfiniteComments';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';

dayjs.extend(relativeTime);

const FeedDetail: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { feedId } = useParams<{ feedId?: string }>();
    const history = useHistory();

    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastCommentElementRef = useRef<HTMLDivElement>(null);
    const postId = feedId ? parseInt(feedId) : null;
    const isNative = Capacitor.isNativePlatform();

    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { user } = useAuthStore()
    const { currentPost, isLoadingPostDetail, postDetailError } = useSocialFeedStore();
    const createCommentMutation = useCreateComment();
    const postLikeMutation = usePostLike();

    const { post, isLoadingPost, postError, data: fetchedPost } = useFeedDetail(postId, true);
    const { 
        data: commentsData, 
        isLoading: isLoadingComments, 
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchComments 
    } = useInfiniteComments(postId);
    
    const allComments = commentsData?.pages?.flatMap(page => page?.data || []) || [];
    
    // Organize comments into nested structure (display max 2 levels, but allow deeper nesting)
    const organizeComments = (comments: any[]) => {
        const topLevelComments = comments.filter(comment => !comment.replyCommentId);
        const allReplies = comments.filter(comment => comment.replyCommentId);
        
        return topLevelComments.map(comment => {
            // Get all replies for this top-level comment (including nested replies)
            const getAllRepliesForComment = (parentId: number): any[] => {
                const directReplies = allReplies.filter(reply => reply.replyCommentId === parentId);
                const nestedReplies = directReplies.flatMap(reply => getAllRepliesForComment(reply.id));
                return [...directReplies, ...nestedReplies];
            };
            
            return {
                ...comment,
                replies: getAllRepliesForComment(comment.id)
            };
        });
    };
    
    const organizedComments = organizeComments(allComments);
    const displayPost = currentPost || post || fetchedPost;
    const isLoading = isLoadingPost;

    const formatTimeAgo = (dateString: string) => {
        const locale = i18n.language === 'vi' ? 'vi' : 'en';
        return dayjs(dateString).locale(locale).fromNow();
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || !postId) return;
        
        try {
            await createCommentMutation.mutateAsync({
                postId: postId,
                content: commentText.trim()
            });
            setCommentText('');
            refetchComments();
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };

    const handleSendReply = async (parentCommentId: number) => {
        if (!replyText.trim() || !postId) return;
        
        try {
            await createCommentMutation.mutateAsync({
                postId: postId,
                replyCommentId: parentCommentId,
                content: replyText.trim()
            });
            setReplyText('');
            setReplyingTo(null);
            refetchComments();
        } catch (error) {
            console.error('Failed to post reply:', error);
        }
    };

    const handleReplyClick = (commentId: number) => {
        setReplyingTo(commentId);
        setReplyText('');
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyText('');
    };

    const handleLikePost = () => {
        if (!displayPost || !postId) return;
        
        postLikeMutation.mutate({
            postId: postId,
            isLiked: displayPost.isLike || false
        });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const lastEntry = entries[0];
                if (lastEntry.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoadingComments) {
                    console.log('Fetching next page of comments...');
                    fetchNextPage();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        const currentRef = lastCommentElementRef.current;
        if (currentRef && allComments.length > 0) {
            console.log('Observing last comment element for infinite scroll');
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, isLoadingComments, fetchNextPage, allComments.length]);

    const handleHashtagClick = (hashtag: string) => {
        console.log('Hashtag clicked:', hashtag);
    };

    if (isLoading) {
        return (
            <div className="relative flex flex-col bg-white"
                style={{
                    paddingRight: 0,
                    paddingLeft: 0,
                    paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60,
                    height: "100dvh",
                }}>
                <div className="relative flex items-center justify-between px-6 h-[50px] border-b border-gray-100">
                    <div className="flex items-center gap-4 z-10">
                        <button onClick={() => history.goBack()}>
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold text-main">{t('Loading...')}</span>
                    </div>
                </div>

                {/* Loading Content */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (postDetailError || !post) {
        return (
            <div className="relative flex flex-col bg-white"
                style={{
                    paddingRight: 0,
                    paddingLeft: 0,
                    paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60,
                    height: "100dvh",
                }}>
                {/* Header */}
                <div className="relative flex items-center justify-between px-6 h-[50px] border-b border-gray-100">
                    <div className="flex items-center gap-4 z-10">
                        <button onClick={() => history.goBack()}>
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold text-main">{t('Error')}</span>
                    </div>
                </div>

                {/* Error Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-center mb-4">{postDetailError || t('Post not found')}</p>
                    <button
                        onClick={() => history.goBack()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {t('Go Back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col bg-white"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60,
                height: "100dvh",
            }}>

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 h-[50px] border-b border-gray-100">
                <div className="flex items-center gap-4 z-10">
                    <button onClick={() => history.goBack()}>
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                    <span className="font-semibold text-main">{post.user.fullName}'s Post</span>
                </div>

                <div className="flex items-center justify-end z-10">
                    <button>
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-x-hidden overflow-y-auto ${!isNative && !keyboardResizeScreen ? `pb-2 overflow-hidden` : ""}`}>
                {/* Post Content */}
                <div className="bg-white">
                    {/* Post header */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={post.user.avatarUrl || '/default-avatar.png'}
                                alt={post.user.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-sm">{post.user.fullName}</span>
                                </div>
                                <span className="text-gray-500 text-xs">{formatTimeAgo(post.createDate)}</span>
                            </div>
                        </div>
                        <button className="text-blue-500 text-sm font-medium">
                            {t('Add Friend')}
                        </button>
                    </div>

                    {/* Post text */}
                    <div className="px-4 pb-3">
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {parseHashtagsWithClick(post.content, handleHashtagClick)}
                        </div>
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                                {post.hashtags.map((hashtag) => (
                                    <span key={hashtag.id} className="text-blue-500 text-sm">{hashtag.tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Post media */}
                    {post.media && post.media.length > 0 && (
                        <div className={post.media.length === 1 ? "" : "grid grid-cols-2 gap-1"}>
                            {post.media.slice(0, 4).map((media, index) => (
                                <div key={media.id} className="relative">
                                    {media.type === 'image' ? (
                                        <img
                                            src={media.url}
                                            alt=""
                                            className={post.media.length === 1 ? "w-full max-h-96 object-cover rounded-lg" : "w-full aspect-square object-cover"}
                                        />
                                    ) : media.type === 'video' ? (
                                        <video
                                            src={media.url}
                                            controls
                                            className={post.media.length === 1 ? "w-full max-h-96 rounded-lg" : "w-full aspect-square object-cover"}
                                        />
                                    ) : (
                                        <div className="bg-gray-100 p-4 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114a4.369 4.369 0 00-1.045-.063 3.983 3.983 0 00-4 4c0 2.206 1.794 4 4 4s4-1.794 4-4V7.041l8-1.6v4.675a4.369 4.369 0 00-1.045-.063 3.983 3.983 0 00-4 4c0 2.206 1.794 4 4 4s4-1.794 4-4V3z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">{t('Audio file')}</span>
                                            </div>
                                            <audio src={media.url} controls className="w-full mt-2" />
                                        </div>
                                    )}
                                    {index === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-semibold">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Post actions */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-6">
                            <button 
                                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                                onClick={handleLikePost}
                                disabled={postLikeMutation.isLoading}
                            >
                                <svg 
                                    className={`w-5 h-5 transition-colors ${displayPost?.isLike ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                                    fill={displayPost?.isLike ? "currentColor" : "none"} 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className={`text-sm transition-colors ${displayPost?.isLike ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                                    {displayPost?.reactionCount?.toLocaleString() || 0}
                                </span>
                            </button>

                            <button className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm text-gray-600">{post.commentCount.toLocaleString()}</span>
                            </button>

                            <button className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span className="text-sm text-gray-600">{post.shareCount}</span>
                            </button>

                            <button className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-sm text-gray-600">{post.repostCount}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white">
                    {isLoadingComments ? (
                        <div className="p-4 text-center">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">{t('Loading comments...')}</p>
                        </div>
                    ) : organizedComments && organizedComments.length > 0 ? (
                        <>
                        {organizedComments.map((comment: any) => (
                            <div key={comment.id}>
                                {/* Main Comment */}
                                <div className="flex gap-3 p-4 border-b border-gray-50">
                                    <img
                                        src={comment.user.avatarUrl || avatarFallback}
                                        alt={comment.user.fullName}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = avatarFallback;
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">{comment.user.fullName}</span>
                                            <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createDate)}</span>
                                        </div>
                                        <div className="text-gray-800 text-sm leading-relaxed">
                                            {parseHashtagsWithClick(comment.content, handleHashtagClick)}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button className={`flex items-center gap-1 ${comment.isLike ? 'text-red-500' : 'text-gray-500'}`}>
                                                <svg className="w-4 h-4" fill={comment.isLike ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                <span className="text-xs">{comment.reactionCount}</span>
                                            </button>
                                            <button 
                                                className="text-xs text-gray-500 hover:text-blue-500"
                                                onClick={() => handleReplyClick(comment.id)}
                                            >
                                                {t('Reply')}
                                            </button>
                                            {comment.replies && comment.replies.length > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Reply Input */}
                                        {replyingTo === comment.id && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <img
                                                        src={user?.avatar || avatarFallback}
                                                        alt={user?.name}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = avatarFallback;
                                                        }}
                                                    />
                                                    <span className="text-xs text-gray-500">
                                                        {t(`Replying to ${comment.user.fullName}`)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder={t('Write a reply...')}
                                                        className="flex-1 px-3 py-2 bg-white rounded-lg text-sm outline-none border border-gray-200 focus:border-blue-500"
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSendReply(comment.id);
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSendReply(comment.id)}
                                                        disabled={!replyText.trim() || createCommentMutation.isLoading}
                                                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
                                                    >
                                                        {createCommentMutation.isLoading ? t('Posting...') : t('Reply')}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelReply}
                                                        className="text-gray-500 px-2 py-2 rounded-lg text-xs hover:bg-gray-200"
                                                    >
                                                        {t('Cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Replies */}
                                {comment.replies && comment.replies.map((reply: any) => (
                                    <div key={reply.id} className="flex gap-3 p-4 pl-12 border-b border-gray-50 bg-gray-25">
                                        <img
                                            src={reply.user.avatarUrl || avatarFallback}
                                            alt={reply.user.fullName}
                                            className="w-7 h-7 rounded-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = avatarFallback;
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">{reply.user.fullName}</span>
                                                <span className="text-gray-500 text-xs">{formatTimeAgo(reply.createDate)}</span>
                                                <span className="text-gray-400 text-xs">• {t('Reply')}</span>
                                            </div>
                                            <div className="text-gray-800 text-sm leading-relaxed">
                                                {parseHashtagsWithClick(reply.content, handleHashtagClick)}
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <button className={`flex items-center gap-1 ${reply.isLike ? 'text-red-500' : 'text-gray-500'}`}>
                                                    <svg className="w-4 h-4" fill={reply.isLike ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <span className="text-xs">{reply.reactionCount}</span>
                                                </button>
                                                <button 
                                                    className="text-xs text-gray-500 hover:text-blue-500"
                                                    onClick={() => handleReplyClick(reply.id)}
                                                >
                                                    {t('Reply')}
                                                </button>
                                            </div>

                                            {/* Reply Input for nested replies */}
                                            {replyingTo === reply.id && (
                                                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <img
                                                            src={user?.avatar || avatarFallback}
                                                            alt={user?.name}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = avatarFallback;
                                                            }}
                                                        />
                                                        <span className="text-xs text-gray-500">
                                                            {t(`Replying to ${reply.user.fullName}`)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder={t('Write a reply...')}
                                                            className="flex-1 px-3 py-2 bg-white rounded-lg text-sm outline-none border border-gray-200 focus:border-blue-500"
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSendReply(reply.id);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSendReply(reply.id)}
                                                            disabled={!replyText.trim() || createCommentMutation.isLoading}
                                                            className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
                                                        >
                                                            {createCommentMutation.isLoading ? t('Posting...') : t('Reply')}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelReply}
                                                            className="text-gray-500 px-2 py-2 rounded-lg text-xs hover:bg-gray-200"
                                                        >
                                                            {t('Cancel')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        
                        {/* Infinite scroll trigger - attach to last comment */}
                        {allComments.length > 0 && (
                            <div ref={lastCommentElementRef} className="h-1" />
                        )}
                        
                        {/* Loading indicator */}
                        {isFetchingNextPage && (
                            <div className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-500">{t('Loading more comments...')}</span>
                                </div>
                            </div>
                        )}
                        </>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">{t('No comments yet. Be the first to comment!')}</p>
                        </div>
                    )}
                </div>

                {/* Spacer for bottom input */}
                <div ref={messagesEndRef} className="h-px mt-auto shrink-0" />
            </div>

            {/* Fixed Bottom Input */}
            <div className={`bg-white w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : !isNative && "sticky"
                } ${isNative ? "bottom-0" : "bottom-[60px]"
                } ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                } ${keyboardResizeScreen && isNative ? "pb-0" : "pb-0"}`}>
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <img
                                src={user?.avatar || avatarFallback}
                                alt={user?.name}
                                className="absolute left-1 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-lg object-cover z-10"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = avatarFallback;
                                }}
                            />
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder={t(`Reply to ${displayPost?.user?.fullName}...`)}
                                className="w-full pl-10 pr-1 py-2 bg-netural-50 rounded-xl text-sm outline-none placeholder:text-netural-300"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendComment();
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={handleSendComment}
                            disabled={!commentText.trim() || createCommentMutation.isLoading}
                            className="bg-main text-white px-3 py-2 rounded-xl text-sm font-medium disabled:bg-netural-50 disabled:text-netural-300 disabled:cursor-not-allowed"
                        >
                            {createCommentMutation.isLoading ? t('Posting...') : t('Post')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedDetail;
