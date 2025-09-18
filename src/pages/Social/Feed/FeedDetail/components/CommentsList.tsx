import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import ReactHeartIcon from "@/icons/logo/social-feed/react-heart.svg?react";
import ReactHeartRedIcon from "@/icons/logo/social-feed/react-heart-red.svg?react";
import CommentsIcon from "@/icons/logo/social-feed/comments.svg?react";
import { MdMoreHoriz } from 'react-icons/md';
import { GoDotFill } from 'react-icons/go';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';
import { formatTimeFromNow } from '@/utils/formatTime';
import AnimatedActionButton from '@/components/common/AnimatedActionButton';
import { useAuthStore } from '@/store/zustand/auth-store';

interface CommentsListProps {
    organizedComments: any[];
    replyingTo: number | null;
    editingComment: any;
    onLikeComment: (commentCode: string, isLiked: boolean) => void;
    onReplyClick: (commentId: number, userName: string) => void;
    onCommentOptions: (comment: any) => void;
    commentLikeMutation: any;
    isLoadingComments: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({
    organizedComments,
    replyingTo,
    editingComment,
    onLikeComment,
    onReplyClick,
    onCommentOptions,
    commentLikeMutation,
    isLoadingComments
}) => {
    const { t } = useTranslation();
    const history = useHistory();
    const { user: currentUser } = useAuthStore();

    const handleUserProfileClick = (e: React.MouseEvent, userId: number) => {
        e.stopPropagation();
        if (currentUser?.id === userId) {
            history.push('/my-profile');
        } else {
            history.push(`/profile/${userId}`);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        return formatTimeFromNow(dateString, t);
    };
    const findOriginalCommentAuthor = (replyCommentId: number) => {
        const mainComment = organizedComments.find(comment => comment.id === replyCommentId);
        if (mainComment) {
            return mainComment.user.fullName;
        }
        for (const comment of organizedComments) {
            if (comment.replies && comment.replies.length > 0) {
                const foundReply = comment.replies.find((reply: any) => reply.id === replyCommentId);
                if (foundReply) {
                    return foundReply.user.fullName;
                }
            }
        }
        return null;
    };

    if (isLoadingComments) {
        return (
            <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">{t('Loading comments...')}</p>
            </div>
        );
    }

    if (!organizedComments || organizedComments.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">{t('No comments yet')}</p>
                <p className="text-gray-400 text-xs mt-1">{t('Be the first to comment!')}</p>
            </div>
        );
    }
    console.log(organizedComments)
    return (
        <div className="bg-white">
            {organizedComments.map((comment: any) => (
                <div key={comment.id}>
                    <div className={`flex gap-3 p-4 border-b border-gray-50 transition-colors ${replyingTo === comment.id ? 'bg-blue-50 border-l-4 border-l-blue-500' :
                        editingComment?.id === comment.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                        }`}>
                        <img
                            src={comment.user.avatarUrl || avatarFallback}
                            alt={comment.user.fullName}
                            className="w-9 h-9 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = avatarFallback;
                            }}
                            onClick={(e) => handleUserProfileClick(e, comment.user.id)}
                        />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 mb-1">
                                    <span 
                                        className="font-semibold text-sm cursor-pointer hover:underline"
                                        onClick={(e) => handleUserProfileClick(e, comment.user.id)}
                                    >
                                        {comment.user.fullName}
                                    </span>
                                    <GoDotFill className="w-2 h-2 text-netural-100 " />
                                    <span className="text-netural-100 text-sm">{formatTimeAgo(comment.createDate)}</span>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-gray-600 "
                                    onClick={() => onCommentOptions(comment)}
                                    aria-label="Comment options"
                                >
                                    <MdMoreHoriz className='text-xl' />
                                </button>
                            </div>

                            <div className="text-gray-800 text-sm leading-relaxed">
                                {parseHashtagsWithClick(comment.content)}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-4">
                                    <AnimatedActionButton
                                        icon={<ReactHeartIcon />}
                                        activeIcon={<ReactHeartRedIcon />}
                                        count={comment.reactionCount || 0}
                                        isActive={comment.isLike || false}
                                        onClick={() => onLikeComment(comment.code, comment.isLike || false)}
                                        disabled={commentLikeMutation.isLoading}
                                        activeColor="text-red-500"
                                        inactiveColor="text-gray-600"
                                        activeNumberColor="text-black"
                                        inactiveNumberColor="text-black"
                                        size="none"
                                    />
                                    <button
                                        className=""
                                        onClick={() => onReplyClick(comment.id, comment.user.fullName)}
                                    >
                                        <CommentsIcon className="w-6 h-6" />
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className=" ">
                            {comment.replies
                                .sort((a: any, b: any) => new Date(a.createDate).getTime() - new Date(b.createDate).getTime())
                                .map((reply: any) => (
                                    <div key={reply.id} className={`flex gap-3 p-4 pl-12 border-b border-gray-50 bg-gray-25 transition-colors ${replyingTo === reply.id ? 'bg-blue-50 border-l-4 border-l-blue-500' :
                                        editingComment?.id === reply.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                                        }`}>
                                        <img
                                            src={reply.user.avatarUrl || avatarFallback}
                                            alt={reply.user.fullName}
                                            className="w-7 h-7 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = avatarFallback;
                                            }}
                                            onClick={(e) => handleUserProfileClick(e, reply.user.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span 
                                                        className="font-semibold text-sm cursor-pointer hover:underline"
                                                        onClick={(e) => handleUserProfileClick(e, reply.user.id)}
                                                    >
                                                        {reply.user.fullName}
                                                    </span>
                                                    <GoDotFill className="w-2 h-2 text-netural-100 " />
                                                    <span className="text-netural-100 text-sm">{formatTimeAgo(reply.createDate)}</span>
                                                </div>
                                                <button
                                                    className="text-gray-400 hover:text-gray-600 "
                                                    onClick={() => onCommentOptions(reply)}
                                                    aria-label="Reply options"
                                                >
                                                    <MdMoreHoriz className='text-xl' />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className='font-semibold text-main text-sm'>
                                                    {reply.replyCommentId ? findOriginalCommentAuthor(reply.replyCommentId) || reply.user.fullName : reply.user.fullName}
                                                </span>
                                                <div className="text-gray-800 text-sm leading-relaxed">
                                                    {parseHashtagsWithClick(reply.content)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-4">
                                                    <AnimatedActionButton
                                                        icon={<ReactHeartIcon />}
                                                        activeIcon={<ReactHeartRedIcon />}
                                                        count={reply.reactionCount || 0}
                                                        isActive={reply.isLike || false}
                                                        onClick={() => onLikeComment(reply.code, reply.isLike || false)}
                                                        disabled={commentLikeMutation.isLoading}
                                                        activeColor="text-red-500"
                                                        inactiveColor="text-gray-600"
                                                        activeNumberColor="text-black"
                                                        inactiveNumberColor="text-black"
                                                        size="none"
                                                    />
                                                    <button
                                                        className=""
                                                        onClick={() => onReplyClick(reply.id, reply.user.fullName)}
                                                    >
                                                        <CommentsIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                                <button
                                                    className="text-gray-400 hover:text-gray-600 "
                                                    onClick={() => onCommentOptions(reply)}
                                                    aria-label="Reply options"
                                                >
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CommentsList;
