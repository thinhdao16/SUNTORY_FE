import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDeletePost } from '@/pages/Social/Feed/hooks/useDeletePost';
import { usePostOptions } from '@/hooks/usePostOptions';
import EditFeedModal from '@/components/social/EditFeedModal';
import { SocialPost } from '@/types/social-feed';
import { useAuthStore } from '@/store/zustand/auth-store';

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
    const history = useHistory();
    const deletePostMutation = useDeletePost();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { actionItems } = usePostOptions({
        post,
        onSendFriendRequest: onSendFriendRequest ? () => onSendFriendRequest(post?.user?.id) : undefined,
        onUnfriend: onUnfriend ? () => onUnfriend(post?.user?.id) : undefined,
        onCancelFriendRequest,
        onAcceptFriendRequest,
        onRejectFriendRequest,
        currentUser: user?.id === post?.user?.id,
        onEditPost: () => {
            setIsEditModalOpen(true);
        },
        onDeletePost: () => {
            deletePostMutation.mutate(post?.code, {
                onSuccess: () => {
                    if (navigateBackOnDelete) {
                        // Use setTimeout to ensure UI updates complete before navigation
                        setTimeout(() => {
                            history.goBack();
                        }, 100);
                    }
                }
            });
        },
        onPinToProfile: () => {
            console.log('Pin to profile:', post?.code);
        }
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
        </>
    );
};

export default PostActionsProvider;
