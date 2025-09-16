import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useFeedDetail } from '@/pages/Social/Feed/hooks/useFeedDetail';
import { useKeyboardResize } from '@/hooks/useKeyboardResize';
import { Capacitor } from '@capacitor/core';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';
import { useAuthStore } from '@/store/zustand/auth-store';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import { useCreateComment } from '@/pages/Social/Feed/hooks/useCreateComment';
import { useInfiniteComments } from '@/pages/Social/Feed/hooks/useInfiniteComments';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { useCommentLike } from '@/pages/Social/Feed/hooks/useCommentLike';
import { MediaDisplay } from '@/components/social/MediaDisplay';
import { formatTimeFromNow } from '@/utils/formatTime';
import { PrivacyPostType } from '@/types/privacy';
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react";
import FriendIcon from "@/icons/logo/social-feed/friend-default.svg?react";
import LockIcon from "@/icons/logo/social-feed/lock-default.svg?react";
import { GoDotFill } from 'react-icons/go';
import ReactHeartIcon from "@/icons/logo/social-feed/react-heart.svg?react";
import CommentsIcon from "@/icons/logo/social-feed/comments.svg?react";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import SendIcon from "@/icons/logo/social-feed/send.svg?react";

const FeedDetail: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { feedId } = useParams<{ feedId?: string }>();
    const history = useHistory();

    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyingToUser, setReplyingToUser] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastCommentElementRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const postCode = feedId; 
    const isNative = Capacitor.isNativePlatform();

    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { user } = useAuthStore()
    const { currentPost, isLoadingPostDetail, postDetailError, setCurrentPost } = useSocialFeedStore();
    const createCommentMutation = useCreateComment();
    const postLikeMutation = usePostLike();
    const commentLikeMutation = useCommentLike();

    const { post, isLoadingPost, postError, data: fetchedPost } = useFeedDetail(postCode, true);
    const { 
        data: commentsData, 
        isLoading: isLoadingComments, 
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchComments 
    } = useInfiniteComments(postCode);
    
    const allComments = commentsData?.pages?.flatMap(page => page?.data || []) || [];
    
    const organizeComments = (comments: any[]) => {
        const topLevelComments = comments.filter(comment => !comment.replyCommentId);
        const allReplies = comments.filter(comment => comment.replyCommentId);
        
        return topLevelComments.map(comment => {
            const getAllRepliesForComment = (parentId: number): any[] => {
                const directReplies = allReplies.filter(reply => reply.replyCommentId === parentId);
                const sortedDirectReplies = directReplies.sort((a, b) => 
                    new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
                );
                const nestedReplies = sortedDirectReplies.flatMap(reply => getAllRepliesForComment(reply.id));
                return [...sortedDirectReplies, ...nestedReplies];
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
        return formatTimeFromNow(dateString, t);
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || !postCode) return;
        
        try {
            if (replyingTo) {
                await createCommentMutation.mutateAsync({
                    postCode: postCode,
                    replyCommentId: replyingTo,
                    content: commentText.trim()
                });
            } else {
                await createCommentMutation.mutateAsync({
                    postCode: postCode,
                    content: commentText.trim()
                });
            }
            setCommentText('');
            setReplyingTo(null);
            setReplyingToUser('');
            refetchComments();
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };


    const handleReplyClick = (commentId: number, userName: string) => {
        setReplyingTo(commentId);
        setReplyingToUser(userName);
        setCommentText('');
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyingToUser('');
        setCommentText('');
    };

    const handleLikePost = () => {
        if (!displayPost) return;
        
        postLikeMutation.mutate({
            postCode: displayPost.code,
            isLiked: displayPost.isLike || false
        });
    };

    const handleLikeComment = (commentCode: string, isLiked: boolean) => {
        if (!postCode) return;
        
        commentLikeMutation.mutate({
            commentCode,
            isLiked,
            postCode
        });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const lastEntry = entries[0];
                if (lastEntry.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoadingComments) {
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
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, isLoadingComments, fetchNextPage, allComments.length]);

    const handleHashtagClick = (hashtag: string) => {
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
                            <RetryIcon className="w-6 h-6 text-gray-600 rotate-180" />
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
                            <RetryIcon className="w-6 h-6 text-gray-600 rotate-180" />
                        </button>
                    </div>
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold text-main">{t('Error')}</span>
                    </div>
                </div>

                {/* Error Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <GlobalIcon className="w-12 h-12 text-gray-400 mb-4" />
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
                        <RetryIcon className="w-6 h-6 text-gray-600 rotate-180" />
                    </button>
                </div>

                <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                    <span className="font-semibold text-main">{post.user.fullName}'s Post</span>
                </div>

                <div className="flex items-center justify-end z-10">
                    <button>
                        <svg className="w-5 h-5 fill-current text-gray-600" viewBox="0 0 20 20">
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
                        <MediaDisplay mediaFiles={post.media} />
                    )}

                    {/* Post actions */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-6">
                            <button 
                                className={`flex items-center gap-2 transition-colors ${displayPost?.isLike ? 'text-red-500' : 'text-netural-900'}`}
                                onClick={handleLikePost}
                                disabled={postLikeMutation.isLoading}
                            >
                                <ReactHeartIcon />
                                <span className="">
                                    {displayPost?.reactionCount?.toLocaleString() || 0}
                                </span>
                            </button>

                            <button className="flex items-center gap-2 text-netural-900 hover:text-blue-500 transition-colors">
                                <CommentsIcon />
                                <span className="">{post.commentCount.toLocaleString()}</span>
                            </button>

                            <button className="flex items-center gap-2 text-netural-900 hover:text-purple-500 transition-colors">
                                <RetryIcon />
                                <span className="">{post.repostCount}</span>
                            </button>

                            <button className="flex items-center gap-2 text-netural-900 hover:text-green-500 transition-colors">
                                <SendIcon />
                                <span className="">{post.shareCount}</span>
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
                                <div className={`flex gap-3 p-4 border-b border-gray-50 transition-colors ${
                                    replyingTo === comment.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}>
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
                                            <button 
                                                className={`flex items-center gap-1 ${comment.isLike ? 'text-red-500' : 'text-gray-500'}`}
                                                onClick={() => handleLikeComment(comment.code, comment.isLike || false)}
                                                disabled={commentLikeMutation.isLoading}
                                            >
                                                <ReactHeartIcon className="w-4 h-4" />
                                                <span className="text-xs">{comment.reactionCount}</span>
                                            </button>
                                            <button 
                                                className="text-xs text-gray-500 hover:text-blue-500"
                                                onClick={() => handleReplyClick(comment.id, comment.user.fullName)}
                                            >
                                                {t('Reply')}
                                            </button>
                                            {comment.replies && comment.replies.length > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                {/* Replies */}
                                {comment.replies && comment.replies.map((reply: any) => (
                                    <div key={reply.id} className={`flex gap-3 p-4 pl-12 border-b border-gray-50 bg-gray-25 transition-colors ${
                                        replyingTo === reply.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}>
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
                                            <div className="flex items-center gap-2">
                                              <span className='font-semibold text-main text-sm'>{reply.user.fullName}</span>
                                                <div className="text-gray-800 text-sm leading-relaxed">
                                                    {parseHashtagsWithClick(reply.content, handleHashtagClick)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <button 
                                                    className={`flex items-center gap-1 ${reply.isLike ? 'text-red-500' : 'text-gray-500'}`}
                                                    onClick={() => handleLikeComment(reply.code, reply.isLike || false)}
                                                    disabled={commentLikeMutation.isLoading}
                                                >
                                                    <ReactHeartIcon className="w-4 h-4" />
                                                    <span className="text-xs">{reply.reactionCount}</span>
                                                </button>
                                                <button 
                                                    className="text-xs text-gray-500 hover:text-blue-500"
                                                    onClick={() => handleReplyClick(reply.id, reply.user.fullName)}
                                                >
                                                    {t('Reply')}
                                                </button>
                                            </div>

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
                            {replyingTo && (
                                <div className="absolute -top-8 left-0 right-0 bg-blue-50 px-3 py-1 rounded-t-xl border border-blue-200 border-b-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-blue-600">
                                            {t('Reply to')} <span className="font-bold">{replyingToUser}</span>
                                        </span>
                                        <button 
                                            onClick={handleCancelReply}
                                            className="text-blue-400 hover:text-blue-600"
                                        >
                                            <RetryIcon className="w-4 h-4 rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder={replyingTo ? `${t('Reply to')} ${replyingToUser}...` : t(`Reply to ${displayPost?.user?.fullName}...`)}
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
