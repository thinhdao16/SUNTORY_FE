import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDeletePost } from '@/pages/Social/Feed/hooks/useDeletePost';
import { usePinPost } from '@/pages/Social/Feed/hooks/usePinPost';
import { usePostOptions } from '@/hooks/usePostOptions';
import EditFeedModal from '@/components/social/EditFeedModal';
import { SocialPost } from '@/types/social-feed';
import { useAuthStore } from '@/store/zustand/auth-store';
import ConfirmModal from '@/components/common/modals/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';

interface PostActionsProviderProps {
    post: SocialPost;
    onSendFriendRequest?: (userId: number) => void;
    onUnfriend?: (userId: number) => void;
    onCancelFriendRequest?: (requestId: number) => void;
    onAcceptFriendRequest?: (requestId: number) => void;
    onRejectFriendRequest?: (requestId: number) => void;
    onSuccess?: () => void;
    navigateBackOnDelete?: boolean;
    children: (props: {
        actionItems: any[];
        isEditModalOpen: boolean;
        setIsEditModalOpen: (open: boolean) => void;
        EditModalComponent: React.ReactNode;
    }) => React.ReactNode;
}

export const PostActionsProvider: React.FC<PostActionsProviderProps> = ({
    post,
    onSendFriendRequest,
    onUnfriend,
    onCancelFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onSuccess,
    navigateBackOnDelete = false,
    children
}) => {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const history = useHistory();
    const queryClient = useQueryClient();
    const deletePostMutation = useDeletePost();
    const pinPostMutation = usePinPost();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showPinConfirm, setShowPinConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Check if there's already a pinned post
    const checkForPinnedPost = (): boolean => {
        const userPostsQueries = queryClient.getQueriesData(['userPosts']) as Array<[any, any]>;
        for (const [, data] of userPostsQueries) {
            if (!data?.pages) continue;
            for (const page of data.pages) {
                const posts = Array.isArray(page?.data?.data) ? page.data.data : [];
                const hasPinnedPost = posts.some((p: any) => p?.isPin && p?.code !== post?.code);
                if (hasPinnedPost) return true;
            }
        }
        return false;
    };

    const handlePinPost = () => {
        // If already pinned, just unpin
        if (post?.isPin) {
            pinPostMutation.mutate(post?.code);
            return;
        }

        // Check if there's another pinned post
        const hasExistingPin = checkForPinnedPost();
        if (hasExistingPin) {
            setShowPinConfirm(true);
        } else {
            pinPostMutation.mutate(post?.code);
        }
    };

    const { actionItems } = usePostOptions({
        post,
        onSendFriendRequest: onSendFriendRequest ? () => onSendFriendRequest(post?.user?.id) : undefined,
        onUnfriend: onUnfriend ? () => onUnfriend(post?.user?.id) : undefined,
        onCancelFriendRequest: onCancelFriendRequest ? (requestId, friendName) => onCancelFriendRequest(requestId) : undefined,
        onAcceptFriendRequest: onAcceptFriendRequest ? (requestId) => onAcceptFriendRequest(requestId) : undefined,
        onRejectFriendRequest: onRejectFriendRequest ? (requestId, friendName) => onRejectFriendRequest(requestId) : undefined,
        currentUser: user?.id === post?.user?.id,
        onEditPost: () => {
            setIsEditModalOpen(true);
        },
        onDeletePost: () => {
            setShowDeleteConfirm(true);
        },
        onPinToProfile: handlePinPost
    });

    const EditModalComponent = (
        <EditFeedModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            postCode={post?.code}
            onSuccess={() => {
                onSuccess?.();
                setIsEditModalOpen(false);
            }}
        />
    );

    return (
        <>
            {children({
                actionItems,
                isEditModalOpen,
                setIsEditModalOpen,
                EditModalComponent
            })}

            <ConfirmModal
                isOpen={showPinConfirm}
                onClose={() => setShowPinConfirm(false)}
                title={t('Pin new post?')}
                message={t('You can only pin 1 post. Pinning this will replace the current pinned post.')}
                confirmText={t('Pin new')}
                cancelText={t('Cancel')}
                onConfirm={() => {
                    pinPostMutation.mutate(post?.code);
                    setShowPinConfirm(false);
                }}
            />

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title={t('Delete post?')}
                message={t('This action cannot be undone.')}
                confirmText={t('Delete')}
                cancelText={t('Cancel')}
                onConfirm={() => {
                    deletePostMutation.mutate(post?.code, {
                        onSuccess: () => {
                            setShowDeleteConfirm(false);
                            if (navigateBackOnDelete) {
                                setTimeout(() => { history.goBack(); }, 100);
                            }
                        },
                        onError: () => {
                            setShowDeleteConfirm(false);
                        }
                    });
                }}
            />
        </>
    );
};

export default PostActionsProvider;
