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
import { IoEyeOffOutline, IoFlagOutline, IoLinkOutline, IoNotificationsOutline, IoPersonRemoveOutline, IoPersonAddOutline, IoTrash } from 'react-icons/io5';
import { handleCopyToClipboard } from '@/components/common/HandleCoppy';
import { useToastStore } from '@/store/zustand/toast-store';
import BackIcon from "@/icons/logo/back-default.svg?react";
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
import { PrivacyPostType } from '@/types/privacy';
import { usePostRepost } from '@/pages/Social/Feed/hooks/usePostRepost';
import { SocialFeedService } from '@/services/social/social-feed-service';
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
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import SharePostBottomSheet from '@/components/social/SharePostBottomSheet';
import { useQueryClient } from 'react-query';
import { useSearchResultsStore } from '@/store/zustand/search-results-store';
import { FiEdit } from 'react-icons/fi';

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
        type: "send" | "cancel" | "unfriend" | "reject" | "accept" | "unrepost" | "delete-comment" | null;
        friendRequestId?: number;
        friendName?: string;
        targetUserId?: number;
        targetUserName?: string;
        commentCode?: string;
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
    const queryClient = useQueryClient();
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
        enableDebugLogs: true});
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
    const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
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

    // Refresh detail from server and update store/cache
    const refreshDetail = async () => {
        try {
            const code = postToDisplay?.code || displayPost?.code;
            if (!code) return;
            const fresh = await SocialFeedService.getPostByCode(code);
            setCurrentPost(fresh as any);
            queryClient.setQueryData(['feedDetail', code], fresh);
            queryClient.invalidateQueries(['feedDetail', code]);
        } catch {}
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || !postCode) return;

        try {
            if (editingComment) {
                await updateCommentMutation.mutateAsync({
                    commentCode: editingComment.code,
                    content: commentText.trim(),
                    postCode: postCode
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
        // Optimistic toggle to 'reposted'
        const prevCount = displayPost?.repostCount ?? 0;
        const patched = {
            ...displayPost,
            isRepostedByCurrentUser: true as any,
            repostCount: prevCount + 1,
        };
        if (displayPost) setCurrentPost(patched as any);
        postRepostMutation.mutate(
            { postCode, caption: 'Repost', privacy: Number(privacy) },
            {
                onError: () => {
                    // rollback
                    if (displayPost) setCurrentPost({
                        ...displayPost,
                        isRepostedByCurrentUser: Boolean(displayPost?.isRepostedByCurrentUser) || false,
                        repostCount: prevCount,
                    } as any);
                },
            }
        );
    };

    const openConfirmModal = (
        type: "send" | "cancel" | "unfriend" | "reject" | "accept",
        friendRequestId?: number,
        friendName?: string,
        targetUserId?: number,
        targetUserName?: string,
    ) => {
        setConfirmState({ open: false, type: null });
        requestAnimationFrame(() => {
            setConfirmState({ open: true, type, friendRequestId, friendName, targetUserId, targetUserName });
        });
    };

    const handleSendFriendRequestClick = async (userId?: number, userName?: string) => {
        closePostOptions();
        const targetId = userId ?? authorId;
        const targetName = userName ?? displayPost?.user?.fullName;
        if (!targetId) return;
        if (sendFriendRequestMutation.isLoading) return;

        // Open confirm with target user info
        setConfirmState({ open: true, type: "send", targetUserId: targetId, targetUserName: targetName });
    };

    const handleUserProfileClick = (userId: number) => {
        if (user?.id === userId) {
            history.push('/my-profile');
        } else {
            history.push(`/profile/${userId}`);
        }
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
        if (!selectedComment || !postCode) return;
        // Close only the sheet and open confirm. Keep the selected comment via confirmState
        setIsCommentOptionsOpen(false);
        setConfirmState({ open: true, type: "delete-comment", commentCode: selectedComment.code });
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
                icon: <FiEdit className="w-5 h-5" />,
                tone: 'default' as const,
                onClick: () => handleEditComment(selectedComment),
            });
            items.push({
                key: 'delete-comment',
                label: t('Delete comment'),
                icon: <IoTrash className="w-5 h-5" />,
                tone: 'danger' as any,
                onClick: handleDeleteComment,
            });
        } else {
            // Build friend actions using relationship data on the selected comment
            const cUser = selectedComment.user;
            const cIsFriend = Boolean(selectedComment?.isFriend);
            const cFR = selectedComment?.friendRequest;
            if (!isOwnComment && cUser?.id) {
                if (!cIsFriend) {
                    if (cFR) {
                        if (cFR.fromUserId === user?.id) {
                            // You sent request -> Cancel
                            items.push({
                                key: 'cancel-friend-request',
                                label: t('Cancel Friend Request'),
                                icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                                tone: 'default' as const,
                                onClick: () => openConfirmModal('cancel', cFR.id, cUser.fullName, cUser.id, cUser.fullName),
                            });
                        } else if (cFR.toUserId === user?.id) {
                            // Incoming request -> Accept / Reject
                            items.push(
                                {
                                    key: 'accept-friend-request',
                                    label: t('Accept Friend Request'),
                                    icon: <IoPersonAddOutline className="w-5 h-5" />,
                                    tone: 'default' as const,
                                    onClick: () => openConfirmModal('accept', cFR.id, cUser.fullName, cUser.id, cUser.fullName),
                                },
                                {
                                    key: 'reject-friend-request',
                                    label: t('Reject Friend Request'),
                                    icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                                    tone: 'danger' as any,
                                    onClick: () => openConfirmModal('reject', cFR.id, cUser.fullName, cUser.id, cUser.fullName),
                                }
                            );
                        }
                    } else {
                        // No request yet -> Add friend
                        items.push({
                            key: 'add-friend-comment',
                            label: t('Add friend'),
                            icon: <IoPersonAddOutline className="w-5 h-5" />,
                            tone: 'default' as const,
                            onClick: () => {
                                closeCommentOptions();
                                handleSendFriendRequestClick(cUser.id, cUser.fullName);
                            },
                        });
                    }
                } else {
                    // Already friends -> Unfriend
                    items.push({
                        key: 'unfriend',
                        label: t('Unfriend'),
                        icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                        tone: 'danger' as any,
                        onClick: () => openConfirmModal('unfriend', undefined, cUser.fullName, cUser.id, cUser.fullName),
                    });
                }
            }
            if (isPostOwner) {
                items.push({
                    key: 'delete-comment-owner',
                    label: t('Delete comment'),
                    icon: <IoTrash className="w-5 h-5" />,
                    tone: 'danger' as any,
                    onClick: handleDeleteComment,
                });
            }
        }
        // Always include report action
        // items.push({
        //     key: 'report-comment',
        //     label: t('Report'),
        //     icon: <IoFlagOutline className="w-5 h-5" />,
        //     tone: 'danger' as any,
        //     onClick: handleReportComment,
        // });

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

    const handleSendFriendRequest = async (userId: number) => {
        try {
            await sendFriendRequestMutation.mutateAsync(userId);
            void refreshDetail();
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    };

    const handleUnfriend = async (userId: number) => {
        try {
            await unfriendMutation.mutateAsync({ friendUserId: userId });
            void refreshDetail();
        } catch (error) {
            console.error('Failed to unfriend:', error);
        }
    };

    const handleCancelFriendRequestAction = async (requestId: number) => {
        try {
            await cancelFriendRequestMutation.mutateAsync(requestId);
            void refreshDetail();
        } catch (error) {
            console.error('Failed to cancel friend request:', error);
        }
    };

    const handleAcceptFriendRequestAction = async (requestId: number) => {
        try {
            await acceptFriendRequestMutation.mutateAsync(requestId);
            void refreshDetail();
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        }
    };

    const handleRejectFriendRequestAction = async (requestId: number) => {
        try {
            await rejectFriendRequestMutation.mutateAsync(requestId);
            void refreshDetail();
        } catch (error) {
            console.error('Failed to reject friend request:', error);
        }
    };
    useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: "",
        refetchRoomData: () => { void refetchPost() },
        autoConnect: true,
        enableDebugLogs: false,
    });
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
                onUserProfileClick={handleUserProfileClick}
            />

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
                    onUserProfileClick={handleUserProfileClick}
                />

                <PostActions
                    displayPost={displayPost}
                    onLike={handleLikePost}
                    onComment={() => inputRef.current?.focus()}
                    onRepost={() => {
                        const isMyRepost = !!displayPost?.isRepost && (displayPost?.user?.id === user?.id);
                        const isRepostedByMe = Boolean(displayPost?.isRepostedByCurrentUser) || isMyRepost;
                        if (isRepostedByMe) {
                            setConfirmState({ open: true, type: "unrepost" });
                        } else {
                            setIsRepostSheetOpen(true);
                        }
                    }}
                    onShare={() => setIsShareSheetOpen(true)}
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
                    onUserProfileClick={handleUserProfileClick}
                />

                <div ref={messagesEndRef} className="h-px mt-auto shrink-0" />
            </div>

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
                onSendFriendRequest={(userId: number) => {
                    // Open confirm instead of executing immediately
                    if (confirmState.open) return;
                    closePostOptions();
                    openConfirmModal('send', undefined, displayPost?.user?.fullName, userId, displayPost?.user?.fullName);
                }}
                onUnfriend={(userId: number) => {
                    if (confirmState.open) return;
                    closePostOptions();
                    openConfirmModal('unfriend', undefined, displayPost?.user?.fullName, userId, displayPost?.user?.fullName);
                }}
                onCancelFriendRequest={(requestId: number) => {
                    if (confirmState.open) return;
                    closePostOptions();
                    openConfirmModal('cancel', requestId, displayPost?.user?.fullName, displayPost?.user?.id, displayPost?.user?.fullName);
                }}
                onAcceptFriendRequest={(requestId: number) => {
                    if (confirmState.open) return;
                    closePostOptions();
                    openConfirmModal('accept', requestId, displayPost?.user?.fullName, displayPost?.user?.id, displayPost?.user?.fullName);
                }}
                onRejectFriendRequest={(requestId: number) => {
                    if (confirmState.open) return;
                    closePostOptions();
                    openConfirmModal('reject', requestId, displayPost?.user?.fullName, displayPost?.user?.id, displayPost?.user?.fullName);
                }}
                onSuccess={() => {
                    void refreshDetail();
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

            {/* Share Bottom Sheet */}
            <SharePostBottomSheet
                isOpen={isShareSheetOpen}
                onClose={() => setIsShareSheetOpen(false)}
                postCode={displayPost.code}
            />

            <PostOptionsBottomSheet
                isOpen={isCommentOptionsOpen}
                onClose={closeCommentOptions}
                actionItems={commentActionItems}
            />

            <ConfirmModal
                key={`${confirmState.type || 'none'}-${confirmState.friendRequestId || confirmState.targetUserId || ''}`}
                isOpen={confirmState.open}
                title={confirmState.type === "delete-comment" ? t("Delete this comment?") : t("Are you sure?")}
                message={
                    confirmState.type === "send" ? t('Send friend request to {{name}}?', { name: confirmState.targetUserName ?? displayPost?.user?.fullName }) :
                        confirmState.type === "cancel" ? t("You can always send another request later!") :
                            confirmState.type === "accept" ? t('Accept friend request from {{name}}?', { name: confirmState.friendName }) :
                            confirmState.type === "unfriend" ? t("You will no longer see their updates or share yours with them") :
                                confirmState.type === "reject" ? t('Reject friend request from {{name}}?', { name: confirmState.friendName }) :
                                    confirmState.type === "unrepost" ? t('Remove your repost of this post?') :
                                    confirmState.type === "delete-comment" ? t("This action is permanent and can't be undone. Are you sure?") :
                                        t('Are you sure?')
                }
                confirmButtonClassName={(confirmState.type === 'send' || confirmState.type === 'accept') ? '!bg-main' : ''}
                confirmText={
                    confirmState.type === "send" ? t("Yes, send") :
                        confirmState.type === "cancel" ? t("Yes, cancel") :
                            confirmState.type === "accept" ? t("Yes, accept") :
                            confirmState.type === "unfriend" ? t("Yes, unfriend") :
                                confirmState.type === "reject" ? t("Yes, reject") :
                                    confirmState.type === "unrepost" ? t("Yes, remove") :
                                    confirmState.type === "delete-comment" ? t("Delete comment") :
                                        t("Yes")
                }
                cancelText={t("Cancel")}
                onClose={() => setConfirmState({ open: false, type: null })}
                onConfirm={async () => {
                    if (confirmState.type === "send") {
                        try {
                            const targetId = confirmState.targetUserId ?? authorId;
                            if (targetId) {
                                await sendFriendRequestMutation.mutateAsync(targetId);
                                void refreshDetail();
                                void refetchComments();
                            }
                        } catch (error) {
                            console.error('Failed to send friend request:', error);
                        }
                    }
                    if (confirmState.type === "cancel" && confirmState.friendRequestId) {
                        try {
                            await cancelFriendRequestMutation.mutateAsync(confirmState.friendRequestId);
                            void refreshDetail();
                            void refetchComments();
                        } catch (error) {
                            console.error('Failed to cancel friend request:', error);
                        }
                    }
                    if (confirmState.type === "accept" && confirmState.friendRequestId) {
                        try {
                            await acceptFriendRequestMutation.mutateAsync(confirmState.friendRequestId);
                            void refreshDetail();
                            void refetchComments();
                        } catch (error) {
                            console.error('Failed to accept friend request:', error);
                        }
                    }
                    if (confirmState.type === "unfriend") {
                        try {
                            const unfriendId = confirmState.targetUserId ?? authorId;
                            if (unfriendId) {
                                await unfriendMutation.mutateAsync({ friendUserId: unfriendId });
                                void refreshDetail();
                                void refetchComments();
                            }
                        } catch (error) {
                            console.error('Failed to unfriend:', error);
                        }
                    }
                    if (confirmState.type === "reject" && confirmState.friendRequestId) {
                        try {
                            await rejectFriendRequestMutation.mutateAsync(confirmState.friendRequestId);
                            void refreshDetail();
                            void refetchComments();
                        } catch (error) {
                            console.error('Failed to reject friend request:', error);
                        }
                    }
                    if (confirmState.type === "delete-comment") {
                        try {
                            if (confirmState.commentCode && postCode) {
                                await deleteCommentMutation.mutateAsync({
                                    commentCode: confirmState.commentCode,
                                    postCode: postCode
                                });
                                void refetchComments();
                                void refetchPost();
                            }
                        } catch (error) {
                            console.error('Failed to delete comment:', error);
                        }
                    }
                    if (confirmState.type === "unrepost") {
                        try {
                            const originalCode = postToDisplay?.code || displayPost?.code;
                            if (originalCode) {
                                await postRepostMutation.mutateAsync({ postCode: originalCode, caption: 'Repost', privacy: Number(repostPrivacy) });
                                const store = useSocialFeedStore.getState();
                                const isMyRepost = !!displayPost?.isRepost && (displayPost?.user?.id === user?.id);
                                if (isMyRepost && displayPost?.code) {
                                    store.removePostFromFeeds(displayPost.code);
                                }
                                const feeds = store.cachedFeeds || {} as any;
                                let currentCount: number | undefined;
                                for (const key of Object.keys(feeds)) {
                                    const found = feeds[key]?.posts?.find((p: any) => p?.code === originalCode);
                                    if (found) { currentCount = found.repostCount; break; }
                                }
                                store.applyRealtimePatch(originalCode, {
                                    isRepostedByCurrentUser: false,
                                    repostCount: Math.max(0, (currentCount ?? 1) - 1)
                                } as any);
                                // Update local detail state optimistically
                                if (displayPost) {
                                    setCurrentPost({
                                        ...displayPost,
                                        isRepostedByCurrentUser: false as any,
                                        repostCount: Math.max(0, (displayPost?.repostCount ?? 1) - 1),
                                    } as any);
                                }
                                const searchStore = useSearchResultsStore.getState();
                                const cached = searchStore.cached || {} as Record<string, any>;
                                for (const key of Object.keys(cached)) {
                                    const tabState = cached[key];
                                    if (!tabState) continue;
                                    let posts = Array.isArray(tabState.posts) ? tabState.posts : [];
                                    if (isMyRepost && displayPost?.code) {
                                        posts = posts.filter((p: any) => p?.code !== displayPost.code);
                                    }
                                    posts = posts.map((p: any) => p?.code === originalCode
                                        ? { ...p, isRepostedByCurrentUser: false, repostCount: Math.max(0, (p?.repostCount ?? 1) - 1) }
                                        : p);
                                    searchStore.setResults(key, { posts });
                                }
                            }
                        } catch (error) {
                            console.error('Failed to unrepost:', error);
                        }
                    }
                }}
            />

        </div>
    );
};
export default FeedDetail;