import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoEyeOffOutline, IoFlagOutline, IoLinkOutline, IoNotificationsOutline, IoPersonRemoveOutline, IoPersonAddOutline, IoPencilOutline, IoStarOutline, IoTrashOutline } from 'react-icons/io5';
import { TbPin, TbPinnedOff } from 'react-icons/tb';
import { handleCopyToClipboard } from '@/components/common/HandleCoppy';
import { useAuthStore } from '@/store/zustand/auth-store';

interface UsePostOptionsProps {
    post: any;
    onSendFriendRequest?: () => void;
    onUnfriend?: () => void;
    onCancelFriendRequest?: (friendRequestId: number, friendName: string) => void;
    onAcceptFriendRequest?: (friendRequestId: number) => void;
    onRejectFriendRequest?: (friendRequestId: number, friendName: string) => void;
    currentUser?: boolean;
    onEditPost?: () => void;
    onDeletePost?: () => void;
    onPinToProfile?: () => void;
}

export const usePostOptions = ({
    post,
    onSendFriendRequest,
    onUnfriend,
    onCancelFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    currentUser,
    onEditPost,
    onDeletePost,
    onPinToProfile
}: UsePostOptionsProps) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
console.log(post)
    const actionItems = useMemo(() => {
        const items = [];
        const authorId = post?.user?.id;
        const isOwnPost = currentUser || user?.id === authorId;

        items.push({
            key: 'copy-link',
            label: t('Copy link'),
            icon: <IoLinkOutline className="w-5 h-5" />,
            tone: 'default' as const,
            onClick: () => handleCopyToClipboard(`${window.location.origin}/social-feed/f/${post?.code}`),
        });

        if (isOwnPost) {
            if (!post?.isRepost) {
                items.push({
                    key: 'edit-post',
                    label: t('Edit post'),
                    icon: <IoPencilOutline className="w-5 h-5" />,
                    tone: 'default' as const,
                    onClick: () => onEditPost?.(),
                });
            }

            items.push({
                key: post?.isPin ? 'unpin-post' : 'pin-post',
                label: post?.isPin ? t('Unpin post') : t('Pin post'),
                icon: post?.isPin ? <TbPinnedOff className="w-5 h-5" /> : <TbPin className="w-5 h-5" />,
                tone: 'default' as const,
                onClick: () => onPinToProfile?.(),
            });
        } 
        // else {
        //     // Options for other users' posts
        //     items.push({
        //         key: 'notify',
        //         label: t('Notify me'),
        //         icon: <IoNotificationsOutline className="w-5 h-5" />,
        //         tone: 'default' as const,
        //         onClick: () => {
        //             console.log('Notify me clicked');
        //         },
        //     });

        //     items.push({
        //         key: 'not-interested',
        //         label: t('Not interested'),
        //         icon: <IoEyeOffOutline className="w-5 h-5" />,
        //         tone: 'default' as const,
        //         onClick: () => {
        //             console.log('Not interested clicked');
        //         },
        //     });
        // }

        if (!isOwnPost && authorId) {
            if (!post?.isFriend) {
                if (post?.friendRequest && post.friendRequest.fromUserId === user?.id) {
                    items.push({
                        key: 'cancel-friend-request',
                        label: t('Cancel Friend Request'),
                        icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                        tone: 'default' as const,
                        onClick: () => onCancelFriendRequest?.(post?.friendRequest?.id, post.user.fullName),
                    });
                } else if (!post?.friendRequest) {
                    items.push({
                        key: 'add-friend',
                        label: t('Add Friend'),
                        icon: <IoPersonAddOutline className="w-5 h-5" />,
                        tone: 'default' as const,
                        onClick: () => onSendFriendRequest?.(),
                    });
                } else {
                    items.push({
                        key: 'accept-friend-request',
                        label: t('Accept Friend Request'),
                        icon: <IoPersonAddOutline className="w-5 h-5" />,
                        tone: 'default' as const,
                        onClick: () => onAcceptFriendRequest?.(post?.friendRequest?.id),
                    });
                    items.push({
                        key: 'reject-friend-request',
                        label: t('Reject Friend Request'),
                        icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                        tone: 'danger' as const,
                        onClick: () => onRejectFriendRequest?.(post?.friendRequest?.id, post.user.fullName),
                    });
                }
            } else {
                items.push({
                    key: 'unfriend',
                    label: t('Unfriend'),
                    icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                    tone: 'danger' as const,
                    onClick: () => onUnfriend?.(),
                });
            }
        }

        if (isOwnPost) {
            // Delete option for own posts
            items.push({
                key: 'delete',
                label: t('Delete'),
                icon: <IoTrashOutline className="w-5 h-5" />,
                tone: 'danger' as const,
                onClick: () => onDeletePost?.(),
            });
        }
        //  else {
        //     // Report option for other users' posts
        //     items.push({
        //         key: 'report',
        //         label: t('Report'),
        //         icon: <IoFlagOutline className="w-5 h-5" />,
        //         tone: 'danger' as const,
        //         onClick: () => {
        //             console.log('Report clicked');
        //         },
        //     });
        // }

        return items;
    }, [post, user, t, onSendFriendRequest, onUnfriend, onCancelFriendRequest, onAcceptFriendRequest, onRejectFriendRequest]);

    const actionGroups = useMemo(() => {
        const standardActions = [];
        const friendActions = [];
        const dangerActions = [];
        const authorId = post?.user?.id;
        const isOwnPost = currentUser || user?.id === authorId;

        // Standard actions
        standardActions.push({
            key: 'copy-link',
            label: t('Copy link'),
            icon: <IoLinkOutline className="w-5 h-5" />,
            tone: 'default' as const,
            onClick: () => handleCopyToClipboard(`${window.location.origin}/social-feed/f/${post?.code}`),
        });

        if (isOwnPost) {
            // Only allow edit if it's not a repost (original post by user)
            if (!post?.isRepost) {
                standardActions.push({
                    key: 'edit-post',
                    label: t('Edit post'),
                    icon: <IoPencilOutline className="w-5 h-5" />,
                    tone: 'default' as const,
                    onClick: () => onEditPost?.(),
                });
            }

            standardActions.push({
                key: post?.isPin ? 'unpin-post' : 'pin-post',
                label: post?.isPin ? t('Unpin post') : t('Pin post'),
                icon: post?.isPin ? <TbPinnedOff className="w-5 h-5" /> : <TbPin className="w-5 h-5" />,
                tone: 'default' as const,
                onClick: () => onPinToProfile?.(),
            });
        } 
        // else {
        //     // Options for other users' posts
        //     standardActions.push(
        //         {
        //             key: 'notify',
        //             label: t('Notify me'),
        //             icon: <IoNotificationsOutline className="w-5 h-5" />,
        //             tone: 'default' as const,
        //             onClick: () => {
        //                 console.log('Notify me clicked');
        //             },
        //         },
        //         {
        //             key: 'not-interested',
        //             label: t('Not interested'),
        //             icon: <IoEyeOffOutline className="w-5 h-5" />,
        //             tone: 'default' as const,
        //             onClick: () => {
        //                 console.log('Not interested clicked');
        //             },
        //         }
        //     );
        // }

        // Friend actions
        if (!isOwnPost && authorId) {
            if (!post?.isFriend) {
                if (post?.friendRequest && post.friendRequest.fromUserId === user?.id) {
                    friendActions.push({
                        key: 'cancel-friend-request',
                        label: t('Cancel Friend Request'),
                        icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                        tone: 'default' as const,
                        onClick: () => onCancelFriendRequest?.(post?.friendRequest?.id, post.user.fullName),
                    });
                } else if (!post?.friendRequest) {
                    friendActions.push({
                        key: 'add-friend',
                        label: t('Add Friend'),
                        icon: <IoPersonAddOutline className="w-5 h-5" />,
                        tone: 'default' as const,
                        onClick: () => onSendFriendRequest?.(),
                    });
                } else {
                    friendActions.push(
                        {
                            key: 'accept-friend-request',
                            label: t('Accept Friend Request'),
                            icon: <IoPersonAddOutline className="w-5 h-5" />,
                            tone: 'default' as const,
                            onClick: () => onAcceptFriendRequest?.(post?.friendRequest?.id),
                        },
                        {
                            key: 'reject-friend-request',
                            label: t('Reject Friend Request'),
                            icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                            tone: 'danger' as const,
                            onClick: () => onRejectFriendRequest?.(post?.friendRequest?.id, post.user.fullName),
                        }
                    );
                }
            } else {
                dangerActions.push({
                    key: 'unfriend',
                    label: t('Unfriend'),
                    icon: <IoPersonRemoveOutline className="w-5 h-5" />,
                    tone: 'danger' as const,
                    onClick: () => onUnfriend?.(),
                });
            }
        }

        // Danger actions
        if (isOwnPost) {
            // Delete option for own posts
            dangerActions.push({
                key: 'delete',
                label: t('Delete'),
                icon: <IoTrashOutline className="w-5 h-5" />,
                tone: 'danger' as const,
                onClick: () => onDeletePost?.(),
            });
        } 
        // else {
        //     // Report option for other users' posts
        //     dangerActions.push({
        //         key: 'report',
        //         label: t('Report'),
        //         icon: <IoFlagOutline className="w-5 h-5" />,
        //         tone: 'danger' as const,
        //         onClick: () => {
        //             console.log('Report clicked');
        //         },
        //     });
        // }

        const groups = [];
        if (standardActions.length > 0) {
            groups.push({ items: standardActions });
        }
        if (friendActions.length > 0) {
            groups.push({ items: friendActions });
        }
        if (dangerActions.length > 0) {
            groups.push({ items: dangerActions });
        }

        return groups;
    }, [post, user, t, onSendFriendRequest, onUnfriend, onCancelFriendRequest, onAcceptFriendRequest, onRejectFriendRequest]);

    return { actionItems, actionGroups };
};
