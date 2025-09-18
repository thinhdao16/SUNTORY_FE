import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useFeedDetail } from '@/pages/Social/Feed/hooks/useFeedDetail';
import { useKeyboardResize } from '@/hooks/useKeyboardResize';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/store/zustand/auth-store';
import { useCreateComment } from '@/pages/Social/Feed/hooks/useCreateComment';
import { useInfiniteComments } from '@/pages/Social/Feed/hooks/useInfiniteComments';
import { usePostLike } from '@/pages/Social/Feed/hooks/usePostLike';
import { useCommentLike } from '@/pages/Social/Feed/hooks/useCommentLike';
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react";
import { usePostSignalR } from '@/hooks/usePostSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { IoEyeOffOutline, IoFlagOutline, IoLinkOutline, IoNotificationsOutline, IoPersonRemoveOutline, IoPersonAddOutline } from 'react-icons/io5';
import { handleCopyToClipboard } from '@/components/common/HandleCoppy';
import { useToastStore } from '@/store/zustand/toast-store';
import BackIcon from "@/icons/logo/back-default.svg?react";
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
import { PrivacyPostType } from '@/types/privacy';
import { usePostRepost } from '@/pages/Social/Feed/hooks/usePostRepost';
import { useSendFriendRequest, useUnfriend, useCancelFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useDeleteComment } from '../hooks/useDeleteComment';
import { useUpdateComment } from '../hooks/useUpdateComment';
import { useDeletePost } from '../hooks/useDeletePost';
import PostActionsProvider from '@/components/social/PostActionsProvider';
import ConfirmModal from '@/components/common/modals/ConfirmModal';
import CommentInput from './components/CommentInput';
import PostHeader from './components/PostHeader';
import PostContent from './components/PostContent';
import PostActions from './components/PostActions';
import CommentsList from './components/CommentsList';
import PostOptionsBottomSheet from '@/components/social/PostOptionsBottomSheet';
import { usePostOptions } from '@/hooks/usePostOptions';

const FeedDetail: React.FC = () => {
    const { t } = useTranslation();
    const { feedId } = useParams<{ feedId?: string }>();
    const history = useHistory();

    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyingToUser, setReplyingToUser] = useState<string>('');
    const [editingComment, setEditingComment] = useState<any>(null);
    const [shouldFocusCommentInput, setShouldFocusCommentInput] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastCommentElementRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const postCode = feedId;
    const isNative = Capacitor.isNativePlatform();

    const [confirmState, setConfirmState] = useState<{ 
        open: boolean; 
        type: "send" | "cancel" | "unfriend" | "reject" | null;
        friendRequestId?: number;
        friendName?: string;
    }>({
        open: false,
        type: null,
    });

    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();
    const { user } = useAuthStore()
    const { currentPost, isLoadingPostDetail, postDetailError, setCurrentPost } = useSocialFeedStore();
    const createCommentMutation = useCreateComment();
    const postLikeMutation = usePostLike();
    const commentLikeMutation = useCommentLike();
    const deviceInfo = useDeviceInfo();
    const { post, isLoadingPost, data: fetchedPost, refetch: refetchPost } = useFeedDetail(postCode, true);
    const {
        data: commentsData,
        isLoading: isLoadingComments,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchComments
    } = useInfiniteComments(postCode);

    const postSignalR = usePostSignalR(deviceInfo.deviceId ?? '', {
        postId: postCode || '',
        autoConnect: true,
        enableDebugLogs: true,
        onPostUpdated: () => {
            void refetchPost();
        },
        onCommentAdded: () => {
            void refetchComments();
        },
        onCommentUpdated: () => {
            void refetchComments();
        },
        onCommentDeleted: () => {
            void refetchComments();
        },
        onPostLiked: () => {
            void refetchPost();
        },
        onPostUnliked: () => {
            void refetchPost();
        },
        onCommentLiked: () => {
            void refetchComments();
        },
        onCommentUnliked: () => {
            void refetchComments();
        },
    });
    const { joinPostUpdates } = postSignalR;

    useEffect(() => {
        if (!postCode) return;
        void joinPostUpdates(postCode);
    }, [joinPostUpdates, postCode]);

    useEffect(() => {
        if (!shouldFocusCommentInput) return;
        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus();
            setShouldFocusCommentInput(false);
        }, 100);
        return () => window.clearTimeout(focusTimer);
    }, [shouldFocusCommentInput]);

    const allComments = commentsData?.pages?.flatMap(page => page?.data || []) || [];
    const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);
    const [isRepostSheetOpen, setIsRepostSheetOpen] = useState(false);
    const [repostPrivacy, setRepostPrivacy] = useState<PrivacyPostType>(PrivacyPostType.Public);
    const [isCommentOptionsOpen, setIsCommentOptionsOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState<any>(null);
    const showToast = useToastStore((state) => state.showToast);
    const openPostOptions = () => setIsPostOptionsOpen(true);
    const closePostOptions = () => setIsPostOptionsOpen(false);
    const openCommentOptions = (comment: any) => {
        setSelectedComment(comment);
        setIsCommentOptionsOpen(true);
    };
    const closeCommentOptions = () => {
        setIsCommentOptionsOpen(false);
        setSelectedComment(null);
    };
    const postRepostMutation = usePostRepost();
    const sendFriendRequestMutation = useSendFriendRequest(showToast);
    const unfriendMutation = useUnfriend(showToast);
    const cancelFriendRequestMutation = useCancelFriendRequest(showToast);
    const acceptFriendRequestMutation = useAcceptFriendRequest(showToast);
    const rejectFriendRequestMutation = useRejectFriendRequest(showToast);
    const deleteCommentMutation = useDeleteComment();
    const updateCommentMutation = useUpdateComment();
    const deletePostMutation = useDeletePost();

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
    const authorId = displayPost?.user?.id;
    const isOwnPost = user?.id === authorId;
    const isRepost = displayPost?.isRepost;
    const originalPost = displayPost?.originalPost;
    const repostCaption = displayPost?.captionRepost;
    const postToDisplay = isRepost ? originalPost : displayPost;

    const handleSendComment = async () => {
        if (!commentText.trim() || !postCode) return;

        try {
            if (editingComment) {
                await updateCommentMutation.mutateAsync({
                    commentCode: editingComment.code,
                    content: commentText.trim()
                });
                setEditingComment(null);
            } else if (replyingTo) {
                await createCommentMutation.mutateAsync({
                    postCode: postCode,
                    replyCommentId: replyingTo,
                    content: commentText.trim()
                });
                setReplyingTo(null);
                setReplyingToUser('');
            } else {
                await createCommentMutation.mutateAsync({
                    postCode: postCode,
                    content: commentText.trim()
                });
            }
            setCommentText('');
            refetchComments();
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };

    const handleCommentButtonClick = () => {
        setShouldFocusCommentInput(true);
    };

    const handleOpenRepostSheet = () => {
        closePostOptions();
        setIsRepostSheetOpen(true);
    };

    const handleSelectRepostPrivacy = (privacy: PrivacyPostType) => {
        if (!postCode) return;
        setRepostPrivacy(privacy);
        setIsRepostSheetOpen(false);
        postRepostMutation.mutate({ postCode, caption: 'Repost', privacy: Number(privacy) });
        void refetchPost();
    };

    const openConfirmModal = (type: "send" | "cancel" | "unfriend" | "reject", friendRequestId?: number, friendName?: string) => {
        setConfirmState({ open: false, type: null });
        requestAnimationFrame(() => {
            setConfirmState({ open: true, type, friendRequestId, friendName });
        });
    };

    const handleSendFriendRequestClick = async () => {
        closePostOptions();
        if (!authorId) return;
        if (sendFriendRequestMutation.isLoading) return;
        
        openConfirmModal("send");
    };

    const handleUnfriendClick = async () => {
        closePostOptions();
        if (!authorId) return;
        if (unfriendMutation.isLoading) return;
        
        openConfirmModal("unfriend");
    };

    const handleCancelFriendRequest = async (friendRequestId: number, friendName: string) => {
        closePostOptions();
        if (!friendRequestId) return;
        if (cancelFriendRequestMutation.isLoading) return;
        
        openConfirmModal("cancel", friendRequestId, friendName);
    };

    const handleAcceptFriendRequest = async (friendRequestId: number) => {
        closePostOptions();
        if (!friendRequestId) return;
        if (acceptFriendRequestMutation.isLoading) return;
        try {
            await acceptFriendRequestMutation.mutateAsync(friendRequestId);
            void refetchPost();
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        }
    };

    const handleRejectFriendRequest = async (friendRequestId: number, friendName: string) => {
        closePostOptions();
        if (!friendRequestId) return;
        if (rejectFriendRequestMutation.isLoading) return;
        
        openConfirmModal("reject", friendRequestId, friendName);
    };

    const handleReplyClick = (commentId: number, userName: string) => {
        setEditingComment(null);
        setReplyingTo(commentId);
        setReplyingToUser(userName);
        setShouldFocusCommentInput(true);
    };

    const handleEditComment = (comment: any) => {
        closeCommentOptions();
        setReplyingTo(null);
        setReplyingToUser('');
        setEditingComment(comment);
        setCommentText(comment.content);
        setShouldFocusCommentInput(true);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyingToUser('');
        setEditingComment(null);
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

    const handleCopyLink = () => {
        if (!displayPost?.code) {
            showToast(t('Unable to copy link'), 1500, 'warning');
            return;
        }

        const shareUrl = `${window.location.origin}/social-feed/f/${displayPost.code}`;
        handleCopyToClipboard(shareUrl);
        closePostOptions();
    };

    const handleNotifyMe = () => {
        showToast(t('Notifications are coming soon'), 2000, 'info');
        closePostOptions();
    };

    const handleNotInterested = () => {
        showToast(t('Thanks for the feedback'), 2000, 'info');
        closePostOptions();
    };

    const handleReport = () => {
        showToast(t('Report feature coming soon'), 2000, 'warning');
        closePostOptions();
    };

    const handleDeleteComment = async () => {
        if (!selectedComment) return;
        closeCommentOptions();

        try {
            await deleteCommentMutation.mutateAsync(selectedComment.code);
            void refetchComments();
            void refetchPost();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleReportComment = () => {
        closeCommentOptions();
        showToast(t('Report comment feature coming soon'), 2000, 'warning');
    };

    const handleCopyCommentLink = () => {
        if (!selectedComment) return;
        const commentUrl = `${window.location.origin}/social-feed/f/${postCode}#comment-${selectedComment.id}`;
        handleCopyToClipboard(commentUrl);
        closeCommentOptions();
    };
    const commentActionItems = React.useMemo(() => {
        if (!selectedComment) return [];
        const isOwnComment = user?.id === selectedComment.user.id;
        const isPostOwner = user?.id === authorId;
        const items = [
            {
                key: 'copy-comment',
                label: t('Copy link'),
                icon: <IoLinkOutline className="w-5 h-5" />,
                tone: 'default' as const,
                onClick: handleCopyCommentLink,
            },
        ];
        if (isOwnComment) {
            items.push({
                key: 'edit-comment',
                label: t('Edit comment'),
                icon: <IoPersonAddOutline className="w-5 h-5" />,
                tone: 'default' as const,
                onClick: () => handleEditComment(selectedComment),
            });
            items.push({
                key: 'delete-comment',
                label: t('Delete comment'),
                icon: <IoFlagOutline className="w-5 h-5" />,
                tone: 'danger' as any,
                onClick: handleDeleteComment,
            });
        } else {
            if (!isOwnComment && selectedComment.user.id) {
                items.push({
                    key: 'add-friend-comment',
                    label: t('Add friend'),
                    icon: <IoPersonAddOutline className="w-5 h-5" />,
                    tone: 'default' as const,
                    onClick: () => {
                        closeCommentOptions();
                        handleSendFriendRequestClick();
                    },
                });
            }
            if (isPostOwner) {
                items.push({
                    key: 'delete-comment-owner',
                    label: t('Delete comment'),
                    icon: <IoFlagOutline className="w-5 h-5" />,
                    tone: 'danger' as any,
                    onClick: handleDeleteComment,
                });
            }

            items.push({
                key: 'report-comment',
                label: t('Report'),
                icon: <IoFlagOutline className="w-5 h-5" />,
                tone: 'danger' as any,
                onClick: handleReportComment,
            });
        }

        return items;
    }, [
        selectedComment,
        user?.id,
        authorId,
        t,
        handleCopyCommentLink,
        handleDeleteComment,
        handleReportComment,
        handleSendFriendRequestClick,
    ]);

    const handleSendFriendRequest = (userId: number) => {
        sendFriendRequestMutation.mutate(userId);
    };

    const handleUnfriend = (userId: number) => {
        unfriendMutation.mutate({ friendUserId: userId });
    };

    const handleCancelFriendRequestAction = (requestId: number) => {
        cancelFriendRequestMutation.mutate(requestId);
    };

    const handleAcceptFriendRequestAction = (requestId: number) => {
        acceptFriendRequestMutation.mutate(requestId);
    };

    const handleRejectFriendRequestAction = (requestId: number) => {
        rejectFriendRequestMutation.mutate(requestId);
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
                            <BackIcon />
                        </button>
                    </div>
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold ">{t('Loading...')}</span>
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
                            <BackIcon />
                        </button>
                    </div>
                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                        <span className="font-semibold ">{t('Error')}</span>
                    </div>
                </div>
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

    if (!displayPost) {
        return null;
    }
    return (
        <div className="relative flex flex-col bg-white"
            style={{
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: keyboardHeight > 0 ? (keyboardResizeScreen ? 60 : keyboardHeight) : 60,
                height: "100dvh",
            }}>

            <PostHeader
                displayPost={displayPost}
                isOwnPost={isOwnPost}
                onBack={() => history.goBack()}
                onPostOptions={openPostOptions}
            />

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-x-hidden overflow-y-auto ${!isNative && !keyboardResizeScreen ? `pb-2 overflow-hidden` : ""}`}>
                <PostContent
                    displayPost={displayPost}
                    isRepost={isRepost || false}
                    originalPost={originalPost}
                    repostCaption={repostCaption}
                    postToDisplay={postToDisplay}
                    isOwnPost={isOwnPost}
                    onSendFriendRequest={handleSendFriendRequestClick}
                    sendFriendRequestMutation={sendFriendRequestMutation}
                />

                <PostActions
                    displayPost={displayPost}
                    onLike={handleLikePost}
                    onComment={() => inputRef.current?.focus()}
                    onRepost={() => setIsRepostSheetOpen(true)}
                    onShare={handleCopyLink}
                    postLikeMutation={postLikeMutation}
                />

                <CommentsList
                    organizedComments={organizedComments}
                    replyingTo={replyingTo}
                    editingComment={editingComment}
                    onLikeComment={handleLikeComment}
                    onReplyClick={handleReplyClick}
                    onCommentOptions={openCommentOptions}
                    commentLikeMutation={commentLikeMutation}
                    isLoadingComments={isLoadingComments}
                />

                {/* Spacer for bottom input */}
                <div ref={messagesEndRef} className="h-px mt-auto shrink-0" />
            </div>

            {/* Fixed Bottom Input */}
            <div className={`bg-white w-full shadow-[0px_-3px_10px_0px_#0000000D] ${keyboardResizeScreen ? "fixed" : !isNative && "sticky"
                } ${isNative ? "bottom-0" : "bottom-[60px]"
                } ${keyboardResizeScreen && !isNative ? "!bottom-0" : ""
                } ${keyboardResizeScreen && isNative ? "pb-0" : "pb-0"}`}>
                <div className="p-4 bg-white border-t border-gray-100">
                    <CommentInput
                        user={user}
                        commentText={commentText}
                        setCommentText={setCommentText}
                        replyingTo={replyingTo}
                        replyingToUser={replyingToUser}
                        editingComment={editingComment}
                        displayPost={displayPost}
                        handleSendComment={handleSendComment}
                        handleCancelReply={handleCancelReply}
                        createCommentMutation={createCommentMutation}
                        updateCommentMutation={updateCommentMutation}
                        inputRef={inputRef}
                    />
                </div>
            </div>

            <PostActionsProvider
                post={displayPost}
                onSendFriendRequest={handleSendFriendRequest}
                onUnfriend={handleUnfriend}
                onCancelFriendRequest={handleCancelFriendRequestAction}
                onAcceptFriendRequest={handleAcceptFriendRequestAction}
                onRejectFriendRequest={handleRejectFriendRequestAction}
                onSuccess={() => {
                    void refetchPost();
                }}
                navigateBackOnDelete={true}
            >
                {({ actionItems, EditModalComponent }) => (
                    <>
                        <PostOptionsBottomSheet
                            isOpen={isPostOptionsOpen}
                            onClose={closePostOptions}
                            actionItems={actionItems}
                            variant="detailed"
                        />
                        {EditModalComponent}
                    </>
                )}
            </PostActionsProvider>

            <PrivacyBottomSheet
                isOpen={isRepostSheetOpen}
                closeModal={() => setIsRepostSheetOpen(false)}
                selectedPrivacy={repostPrivacy}
                onSelectPrivacy={handleSelectRepostPrivacy}
            />

            <PostOptionsBottomSheet
                isOpen={isCommentOptionsOpen}
                onClose={closeCommentOptions}
                actionItems={commentActionItems}
            />

            <ConfirmModal
                isOpen={confirmState.open}
                title={t("Are you sure?")}
                message={
                    confirmState.type === "send" ? t('Send friend request to {{name}}?', { name: displayPost?.user?.fullName }) :
                    confirmState.type === "cancel" ? t("You can always send another request later!") :
                    confirmState.type === "unfriend" ? t("You will no longer see their updates or share yours with them") :
                    confirmState.type === "reject" ? t('Reject friend request from {{name}}?', { name: confirmState.friendName }) :
                    ""
                }
                confirmText={
                    confirmState.type === "send" ? t("Yes, send") :
                    confirmState.type === "cancel" ? t("Yes, cancel") :
                    confirmState.type === "unfriend" ? t("Yes, unfriend") :
                    confirmState.type === "reject" ? t("Yes, reject") :
                    t("Yes")
                }
                cancelText={t("Cancel")}
                onConfirm={async () => {
                    if (confirmState.type === "send" && authorId) {
                        try {
                            await sendFriendRequestMutation.mutateAsync(authorId);
                            void refetchPost();
                        } catch (error) {
                            console.error('Failed to send friend request:', error);
                        }
                    }
                    if (confirmState.type === "cancel" && confirmState.friendRequestId) {
                        try {
                            await cancelFriendRequestMutation.mutateAsync(confirmState.friendRequestId);
                            void refetchPost();
                        } catch (error) {
                            console.error('Failed to cancel friend request:', error);
                        }
                    }
                    if (confirmState.type === "unfriend" && authorId) {
                        try {
                            await unfriendMutation.mutateAsync({ friendUserId: authorId });
                            void refetchPost();
                        } catch (error) {
                            console.error('Failed to unfriend:', error);
                        }
                    }
                    if (confirmState.type === "reject" && confirmState.friendRequestId) {
                        try {
                            await rejectFriendRequestMutation.mutateAsync(confirmState.friendRequestId);
                            void refetchPost();
                        } catch (error) {
                            console.error('Failed to reject friend request:', error);
                        }
                    }
                    setConfirmState({ open: false, type: null });
                }}
                onClose={() => setConfirmState({ open: false, type: null })}
            />
        </div>
    );
};

export default FeedDetail;
