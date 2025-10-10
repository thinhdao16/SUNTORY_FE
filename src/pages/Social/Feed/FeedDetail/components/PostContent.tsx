import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import MediaDisplay from '@/components/social/MediaDisplay';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';
import { formatTimeFromNow } from '@/utils/formatTime';
import { useCreateTranslationChat } from '@/pages/Translate/hooks/useTranslationLanguages';
import useLanguageStore from '@/store/zustand/language-store';
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react";
import FriendIcon from "@/icons/logo/social-feed/friend-default.svg?react";
import LockIcon from "@/icons/logo/social-feed/lock-default.svg?react";
import ActionButton from '@/components/loading/ActionButton';
import LogoIcon from "@/icons/logo/logo-rounded-full.svg?react";
import AddFriendIcon from "@/icons/logo/social-feed/add-friend.svg?react";
import { GoDotFill } from 'react-icons/go';
import { useAuthStore } from '@/store/zustand/auth-store';
import { PrivacyPostType } from '@/types/privacy';
import ExpandableText from '@/components/common/ExpandableText';

interface PostContentProps {
    displayPost: any;
    isRepost: boolean;
    originalPost?: any;
    repostCaption?: string | null;
    postToDisplay: any;
    isOwnPost: boolean;
    onSendFriendRequest: () => void;
    sendFriendRequestMutation: any;
    onUserProfileClick?: (userId: number) => void;
}

const PostContent: React.FC<PostContentProps> = ({
    displayPost,
    isRepost,
    originalPost,
    repostCaption,
    postToDisplay,
    isOwnPost,
    onSendFriendRequest,
    sendFriendRequestMutation,
    onUserProfileClick
}) => {
    const { user } = useAuthStore()
    const { t } = useTranslation();
    const history = useHistory();
    const createTranslationMutation = useCreateTranslationChat();
    const { selectedLanguageSocialChat, selectedLanguageTo } = useLanguageStore.getState();
    const toLanguageId = user?.language?.id || 2
    // useMemo(() => selectedLanguageSocialChat?.id || selectedLanguageTo?.id || 2, [selectedLanguageSocialChat, selectedLanguageTo]);

    

    const isRepostWithDeletedOriginal = isRepost && (!originalPost || originalPost?.status === 190);
    const [translatedText, setTranslatedText] = React.useState<string | null>(null);
    const [showOriginal, setShowOriginal] = React.useState<boolean>(true);

    const formatTimeAgo = (dateString: string) => {
        return formatTimeFromNow(dateString, t);
    };

    const handleOriginalPostClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (originalPost?.code) {
            history.push(`/social-feed/f/${originalPost.code}`);
        }
    };

    const getPrivacyIcon = (privacy: number) => {
        switch (privacy) {
            case PrivacyPostType.Public:
                return <GlobalIcon className="w-4 h-4 text-gray-500" />;
            case PrivacyPostType.Friend:
                return <FriendIcon className="w-4 h-4 text-gray-500" />;
            case PrivacyPostType.Private:
                return <LockIcon className="w-4 h-4 text-gray-500" />;
            case PrivacyPostType.Hashtag:
                return <GlobalIcon className="w-4 h-4 text-gray-500" />;
            default:
                return <GlobalIcon className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="bg-white">
            {isRepost && (
                <div className="rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <div className="flex items-center gap-3">
                            <img
                                src={displayPost?.user?.avatarUrl || avatarFallback}
                                alt={displayPost?.user?.fullName}
                                className="w-9 h-9 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => onUserProfileClick?.(displayPost?.user?.id)}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = avatarFallback;
                                }}
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="font-semibold text-sm max-w-[150px] truncate cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => onUserProfileClick?.(displayPost?.user?.id)}
                                    >
                                        {displayPost?.user?.fullName}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <RetryIcon className='w-4 h-4 text-gray-400' />
                                        <span className="text-sm text-gray-500">{t('reposted')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center text-netural-100 gap-1">
                                    <span className="text-sm text-gray-500">{formatTimeFromNow(displayPost?.createDate || '', t)}</span>
                                    <GoDotFill className="w-2 h-2" />
                                    <span className='opacity-20'>
                                        {getPrivacyIcon(displayPost?.privacy)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!isOwnPost && displayPost?.isFriend === false && (
                            displayPost?.friendRequest !== null ? (
                                <button className="flex items-center gap-1 text-sm font-semibold text-netural-300" disabled>
                                    {t('Sent')}
                                </button>
                            ) : (
                                <button
                                    className="flex items-center gap-1 text-sm font-semibold text-netural-500"
                                    onClick={() => {
                                        onSendFriendRequest();
                                    }}
                                    disabled={sendFriendRequestMutation.isLoading}
                                >
                                    <AddFriendIcon />
                                    {t('Add Friend')}
                                </button>
                            )
                        )}
                    </div>

                    <div
                        className="mx-4 mb-4 border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={handleOriginalPostClick}
                    >
                        {isRepostWithDeletedOriginal ? (
                            <div className="flex items-center gap-3 px-4 py-6">
                                <div className="h-8 aspect-square rounded-full bg-gray-200 flex items-center justify-center">
                                    <LockIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-600 mb-1">{t('Content not available')}</div>
                                    <div className="text-sm text-gray-500">
                                        {t('This content may have been removed by the owner or is no longer available.')}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-100">
                                    <img
                                        src={postToDisplay?.user?.avatarUrl || avatarFallback}
                                        alt={postToDisplay?.user?.fullName}
                                        className="w-8 h-8 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUserProfileClick?.(postToDisplay?.user?.id);
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = avatarFallback;
                                        }}
                                    />
                                    <div className="grid gap-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="font-semibold text-sm cursor-pointer hover:underline max-w-[200px] truncate"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUserProfileClick?.(postToDisplay?.user?.id);
                                                }}
                                            >
                                                {postToDisplay?.user?.fullName}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-netural-100 gap-1">
                                            <span className="text-sm text-gray-500">{formatTimeFromNow(postToDisplay?.createDate || '', t)}</span>
                                            <GoDotFill className="w-2 h-2" />
                                            <span className='opacity-20'>
                                                {getPrivacyIcon(postToDisplay?.privacy)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {!isRepostWithDeletedOriginal && (
                            <div className="px-4 py-3">
                                <ExpandableText
                                    contentClassName="text-gray-800 text-sm leading-relaxed"
                                    clampClassName="line-clamp-2"
                                    resetKey={postToDisplay?.content || ''}
                                >
                                    {parseHashtagsWithClick(postToDisplay?.content || '')}
                                </ExpandableText>
                                <div className="mt-2">
                                    {postToDisplay?.content && showOriginal ? (
                                        <ActionButton
                                            spinnerPosition="right"
                                            variant="ghost"
                                            size="none"
                                            className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                                            loading={createTranslationMutation.isLoading}
                                            onClick={async () => {
                                                try {
                                                    const res = await createTranslationMutation.mutateAsync({ toLanguageId: user?.language?.id || 2, originalText: postToDisplay?.content || '' });
                                                    const text = res?.data?.translated_text || res?.data?.translatedText || '';
                                                    setTranslatedText(text);
                                                    setShowOriginal(false);
                                                } catch (e) { }
                                            }}
                                            disabled={!postToDisplay?.content}
                                        >
                                            <div className="flex items-center gap-1">
                                                <LogoIcon className="w-5 h-5" /> {t('Translate')}
                                            </div>
                                        </ActionButton>
                                    ) : postToDisplay?.content && !showOriginal ? (
                                        <ActionButton
                                            variant="ghost"
                                            size="none"
                                            className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                                            onClick={() => setShowOriginal(true)}
                                        >
                                            <div className="flex items-center gap-1">
                                                <LogoIcon className="w-5 h-5" /> {t('See original')}
                                            </div>
                                        </ActionButton>
                                    ) : null}
                                    {!showOriginal && translatedText && (
                                        <div className="mt-2 border-l-4 border-gray-200 pl-3 text-sm text-gray-700 whitespace-pre-wrap">
                                            {translatedText}
                                        </div>
                                    )}
                                </div>
                                {/* {postToDisplay?.hashtags && postToDisplay.hashtags.length > 0 && (
                                    <div className="flex gap-1 mt-2">
                                        {postToDisplay.hashtags.map((hashtag: any) => (
                                            <span key={hashtag.id}>
                                                {parseHashtagsWithClick(hashtag.tag)}
                                            </span>
                                        ))}
                                    </div>
                                )} */}
                            </div>
                        )}
                        {!isRepostWithDeletedOriginal && postToDisplay?.media && postToDisplay.media.length > 0 && (
                            <div data-media-display className='pb-4'>
                                <MediaDisplay
                                    mediaFiles={postToDisplay.media}
                                    className="mt-3"
                                    lightboxUserName={postToDisplay.user.fullName}
                                    lightboxUserAvatar={postToDisplay.user?.avatarUrl}
                                    classNameAudio='px-4 '

                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Regular post header (non-repost) */}
            {!isRepost && (
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={displayPost?.user?.avatarUrl || avatarFallback}
                            alt={displayPost?.user?.fullName}
                            className="w-9 h-9 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onUserProfileClick?.(displayPost.user.id)}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = avatarFallback;
                            }}
                        />

                        <div className="grid gap-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="font-semibold text-sm cursor-pointer hover:underline max-w-[200px] truncate"
                                    onClick={() => onUserProfileClick?.(displayPost.user.id)}
                                >
                                    {displayPost?.user?.fullName}
                                </span>
                            </div>
                            <div className="flex items-center text-netural-100 gap-1">
                                <span className="text-sm text-gray-500">{formatTimeFromNow(displayPost.createDate, t)}</span>
                                <GoDotFill className="w-2 h-2" />
                                <span className='opacity-20'>
                                    {getPrivacyIcon(displayPost.privacy)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!isOwnPost && postToDisplay?.isFriend === false && (
                        postToDisplay?.friendRequest !== null ? (
                            <button className="flex items-center gap-1 text-sm font-semibold text-netural-300" disabled>
                                {t('Sent')}
                            </button>
                        ) : (
                            <button
                                className="flex items-center gap-1 text-sm font-semibold text-netural-500"
                                onClick={() => {
                                    onSendFriendRequest();
                                }}
                                disabled={sendFriendRequestMutation.isLoading}
                            >
                                <AddFriendIcon />
                                {t('Add Friend')}
                            </button>
                        )
                    )}
                </div>
            )}

            {/* Regular post content (non-repost) */}
            {!isRepost && (
                <>
                    <div className="px-4">
                        <ExpandableText
                            contentClassName="text-gray-800 text-sm leading-relaxed"
                            clampClassName="line-clamp-2"
                            resetKey={displayPost?.content || ''}
                        >
                            {parseHashtagsWithClick(displayPost.content)}
                        </ExpandableText>
                        <div className="mt-2">
                            {displayPost.content && showOriginal ? (
                                <ActionButton
                                    spinnerPosition="right"
                                    variant="ghost"
                                    size="none"
                                    className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                                    loading={createTranslationMutation.isLoading}
                                    onClick={async () => {
                                        try {
                                            const res = await createTranslationMutation.mutateAsync({ toLanguageId: toLanguageId as number, originalText: displayPost.content || '' });
                                            const text = res?.data?.translated_text || res?.data?.translatedText || '';
                                            setTranslatedText(text);
                                            setShowOriginal(false);
                                        } catch (e) { }
                                    }}
                                    disabled={!displayPost?.content}
                                >
                                    <div className="flex items-center gap-1">
                                        <LogoIcon className="w-5 h-5" /> {t('Translate')}
                                    </div>
                                </ActionButton>
                            ) : displayPost.content && !showOriginal ? (
                                <ActionButton
                                    variant="ghost"
                                    size="none"
                                    className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                                    onClick={() => setShowOriginal(true)}
                                >
                                    <div className="flex items-center gap-1">
                                        <LogoIcon className="w-5 h-5" /> {t('See original')}
                                    </div>
                                </ActionButton>
                            ) : null}
                            {!showOriginal && translatedText && (
                                <div className="mt-2 border-l-4 border-gray-200 pl-3 text-sm text-gray-700 whitespace-pre-wrap">
                                    {translatedText}
                                </div>
                            )}
                        </div>
                        {/* {displayPost.hashtags && displayPost.hashtags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                                {displayPost.hashtags.map((hashtag: any) => (
                                    <span key={hashtag.id}>
                                        {parseHashtagsWithClick(hashtag.tag)}
                                    </span>
                                ))}
                            </div>
                        )} */}
                    </div>

                    {/* Regular post media */}
                    {displayPost.media && displayPost.media.length > 0 && (
                        <div className="mt-2">
                            <MediaDisplay
                                mediaFiles={displayPost.media}
                                lightboxUserName={displayPost.user.fullName}
                                lightboxUserAvatar={displayPost.user.avatarUrl}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PostContent;
