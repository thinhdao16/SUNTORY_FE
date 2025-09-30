import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactHeartIcon from "@/icons/logo/social-feed/react-heart.svg?react";
import CommentsIcon from "@/icons/logo/social-feed/comments.svg?react";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import SendIcon from "@/icons/logo/social-feed/send.svg?react";
import ReactHeartRedIcon from "@/icons/logo/social-feed/react-heart-red.svg?react";
import AnimatedActionButton from '@/components/common/AnimatedActionButton';

interface PostActionsProps {
    displayPost: any;
    onLike: () => void;
    onComment: () => void;
    onRepost: () => void;
    onShare: () => void;
    postLikeMutation: any;
}

const PostActions: React.FC<PostActionsProps> = ({
    displayPost,
    onLike,
    onComment,
    onRepost,
    onShare,
    postLikeMutation
}) => {
    const { t } = useTranslation();
    
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-6">
                <AnimatedActionButton
                    icon={<ReactHeartIcon />}
                    activeIcon={<ReactHeartRedIcon />}
                    count={displayPost?.reactionCount || 0}
                    isActive={displayPost?.isLike || false}
                    onClick={onLike}
                    disabled={postLikeMutation.isLoading}
                    activeColor="text-red-500"
                    inactiveColor="text-gray-600"
                    activeNumberColor="text-black"
                    inactiveNumberColor="text-black"
                />
                
                <AnimatedActionButton
                    icon={<CommentsIcon />}
                    count={displayPost?.commentCount || 0}
                    isActive={false}
                    onClick={onComment}
                    inactiveColor="text-gray-600"
                />
                
                <AnimatedActionButton
                    icon={<RetryIcon />}
                    count={displayPost?.repostCount || 0}
                    isActive={false}
                    onClick={onRepost}
                    inactiveColor="text-gray-600"
                />
                
                <AnimatedActionButton
                    icon={<SendIcon />}
                    count={displayPost?.shareCount || 0}
                    isActive={false}
                    onClick={onShare}
                    inactiveColor="text-gray-600"
                />
            </div>
        </div>
    );
};

export default PostActions;
