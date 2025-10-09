import React from 'react';
import { useTranslation } from 'react-i18next';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";
interface CommentInputProps {
    user: any;
    commentText: string;
    setCommentText: (text: string) => void;
    replyingTo: number | null;
    replyingToUser: string;
    editingComment: any;
    displayPost: any;
    handleSendComment: () => void;
    handleCancelReply: () => void;
    createCommentMutation: any;
    updateCommentMutation: any;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

const CommentInput: React.FC<CommentInputProps> = ({
    user,
    commentText,
    setCommentText,
    replyingTo,
    replyingToUser,
    editingComment,
    displayPost,
    handleSendComment,
    handleCancelReply,
    createCommentMutation,
    updateCommentMutation,
    inputRef
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <img
                    src={user?.avatarLink || avatarFallback}
                    alt={user?.name}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-lg object-cover z-10"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = avatarFallback;
                    }}
                />
                {(replyingTo || editingComment) && (
                    <div className="absolute -top-8 left-0 right-0 bg-blue-50 px-3 py-1 rounded-t-xl border border-blue-200 border-b-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600 flex items-center gap-1">
                                {editingComment ? (
                                    <>
                                        {t('Edit comment')} <span className="font-bold inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{editingComment.user.fullName}</span>
                                    </>
                                ) : (
                                    <>
                                        {t('Reply to')} <span className="font-bold inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{replyingToUser}</span>
                                    </>
                                )}
                            </span>
                            <button
                                onClick={handleCancelReply}
                                className="text-blue-400 hover:text-blue-600"
                            >
                                <CloseIcon className="w-3 h-3 " />
                            </button>
                        </div>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                        editingComment
                            ? t('Edit your comment...')
                            : replyingTo
                                ? `${t('Reply to')} ${replyingToUser}...`
                                : t(`Reply to ${displayPost?.user?.fullName}...`)
                    }
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
                disabled={!commentText.trim() || createCommentMutation.isLoading || updateCommentMutation.isLoading}
                className="bg-main text-white px-3 py-2 rounded-xl text-sm font-medium disabled:bg-netural-50 disabled:text-netural-300 disabled:cursor-not-allowed"
            >
                {editingComment
                    ? (updateCommentMutation.isLoading ? t('Updating...') : t('Update'))
                    : (createCommentMutation.isLoading ? t('Posting...') : t('Post'))
                }
            </button>
        </div>
    );
};

export default CommentInput;
