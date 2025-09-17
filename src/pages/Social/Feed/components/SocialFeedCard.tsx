import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialPost } from '@/types/social-feed';
import { PrivacyPostType } from '@/types/privacy';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';
import { formatTimeFromNow } from '@/utils/formatTime';
import MediaDisplay from '@/components/social/MediaDisplay';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";
import GlobalIcon from "@/icons/logo/social-feed/global-default.svg?react";
import FriendIcon from "@/icons/logo/social-feed/friend-default.svg?react";
import LockIcon from "@/icons/logo/social-feed/lock-default.svg?react";
import { GoDotFill } from 'react-icons/go';
import ReactHeartIcon from "@/icons/logo/social-feed/react-heart.svg?react";
import CommentsIcon from "@/icons/logo/social-feed/comments.svg?react";
import RetryIcon from "@/icons/logo/social-feed/retry.svg?react";
import SendIcon from "@/icons/logo/social-feed/send.svg?react";
import { MdMoreHoriz } from 'react-icons/md';
import { useCreateTranslationChat } from '@/pages/Translate/hooks/useTranslationLanguages';
import useLanguageStore from '@/store/zustand/language-store';
import ActionButton from '@/components/loading/ActionButton';
import AnimatedActionButton from '@/components/common/AnimatedActionButton';
import ReactHeartRedIcon from "@/icons/logo/social-feed/react-heart-red.svg?react";
import PostOptionsBottomSheet from '@/components/social/PostOptionsBottomSheet';
import { usePostOptions } from '@/hooks/usePostOptions';
import LogoIcon from "@/icons/logo/logo-rounded-full.svg?react";
interface SocialFeedCardProps {
  post: SocialPost;
  onLike?: (postCode: string) => void;
  onComment?: (postCode: string) => void;
  onShare?: (postCode: string) => void;
  onRepost?: (postCode: string) => void;
  onPostClick?: (postCode: string) => void;
  onSendFriendRequest?: (userId: number) => void;
  onUnfriend?: (userId: number) => void;
  onCancelFriendRequest?: (friendRequestId: number, friendName: string) => void;
  onAcceptFriendRequest?: (friendRequestId: number) => void;
  onRejectFriendRequest?: (friendRequestId: number, friendName: string) => void;
  className?: string;
  containerRefCallback?: (node: HTMLDivElement | null) => void;
}

export const SocialFeedCard: React.FC<SocialFeedCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onRepost,
  onPostClick,
  onSendFriendRequest,
  onUnfriend,
  onCancelFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  className = '',
  containerRefCallback
}) => {
  const { t } = useTranslation();
  const createTranslationMutation = useCreateTranslationChat();
  const { selectedLanguageSocialChat, selectedLanguageTo } = useLanguageStore.getState();
  const toLanguageId = useMemo(() => selectedLanguageSocialChat?.id || selectedLanguageTo?.id || 2, [selectedLanguageSocialChat, selectedLanguageTo]);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState<boolean>(true);
  const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);

  const { actionItems } = usePostOptions({
    post,
    onSendFriendRequest: () => onSendFriendRequest?.(post.user.id),
    onUnfriend: () => onUnfriend?.(post.user.id),
    onCancelFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest
  });

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    return <MediaDisplay mediaFiles={post.media} className="mt-3" />;
  };

  const handlePostClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('svg') || target.closest('img') || target.closest('[data-media-display]')) {
      return;
    }
    onPostClick?.(post.code);
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

  const displayPost = post.isRepost && post.originalPost ? post.originalPost : post;
  const isRepost = post.isRepost && post.originalPost;
  return (
    <div
      className={`bg-white border-b border-netural-50 cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
      onClick={handlePostClick}
      ref={containerRefCallback ? containerRefCallback : undefined}
    >
      {isRepost && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <RetryIcon className='opacity-45 w-5 h-5' />
          <span className="text-[13px] text-netural-300 font-semibold">
            <span className="">{post.user.fullName}</span> {t('reposted')}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 justify-center">
          <img
            src={displayPost.user.avatarUrl || avatarFallback}
            alt={displayPost.user.fullName}
            className="w-9 h-9  rounded-2xl object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = avatarFallback;
            }}
          />
          <div className='grid gap-0'>
            <div className="flex items-center ">
              <span className="font-semibold ">{displayPost.user.fullName}</span>
            </div>
            <div className="flex items-center text-netural-100 gap-1">
              <span className=" text-sm">{formatTimeFromNow(displayPost.createDate, t)}</span>
              <GoDotFill className="w-2 h-2 " />
              <span className='opacity-20'>
                {getPrivacyIcon(displayPost.privacy)}
              </span>
            </div>
          </div>
        </div>
        <button 
          className="text-gray-400 hover:text-gray-600"
          onClick={() => setIsPostOptionsOpen(true)}
        >
          <MdMoreHoriz className='text-xl' />
        </button>
      </div>

      {/* {isRepost && post.captionRepost && (
        <div className="px-4 pb-2">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.captionRepost}
          </div>
        </div>
      )} */}

      {/* Original post content (or regular post content if not a repost) */}
      {isRepost ? (
        <div className=" rounded-lg">
          <div className="px-4">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {parseHashtagsWithClick(displayPost?.content)}
            </div>
            <div className="mt-2">
              {displayPost?.content && showOriginal ? (
                <ActionButton
                  variant="ghost"
                  size="none"
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent "
                  loading={createTranslationMutation.isLoading}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await createTranslationMutation.mutateAsync({ toLanguageId: toLanguageId as number, originalText: displayPost?.content || '' });
                      const text = (res as any)?.data?.translated_text || (res as any)?.data?.translatedText || '';
                      setTranslatedText(text);
                      setShowOriginal(false);
                    } catch { }
                  }}
                  disabled={!displayPost?.content}
                >
                  <div className="flex items-center gap-1">
                    <LogoIcon className="w-5 h-5" /> {t('Translate')}
                  </div>
                </ActionButton>
              ) : displayPost?.content && !showOriginal ? (
                <ActionButton
                  variant="ghost"
                  size="none"
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                  onClick={(e) => { e.stopPropagation(); setShowOriginal(true); }}
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
            {displayPost?.hashtags && displayPost?.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayPost?.hashtags.map((hashtag) => (
                  <span key={hashtag.id}>
                    {parseHashtagsWithClick(hashtag.tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
          {displayPost?.media && displayPost?.media.length > 0 && (
            <div data-media-display>
              <MediaDisplay
                mediaFiles={displayPost?.media}
                className="mt-3"
                lightboxUserName={displayPost.user.fullName}
                lightboxUserAvatar={displayPost.user.avatarUrl}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 ">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {parseHashtagsWithClick(displayPost?.content)}
            </div>
            <div className="mt-2">
              {displayPost?.content && showOriginal ? (
                <ActionButton
                  spinnerPosition="right"
                  variant="ghost"
                  size="none"
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                  loading={createTranslationMutation.isLoading}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await createTranslationMutation.mutateAsync({ toLanguageId: toLanguageId as number, originalText: displayPost?.content || '' });
                      const text = (res as any)?.data?.translated_text || (res as any)?.data?.translatedText || '';
                      setTranslatedText(text);
                      setShowOriginal(false);
                    } catch { }
                  }}
                  disabled={!displayPost?.content}
                >
                  <div className="flex items-center gap-1">
                    <LogoIcon className="w-5 h-5" /> {t('Translate')}
                  </div>
                </ActionButton>
              ) : displayPost?.content && !showOriginal ? (
                <ActionButton
                  variant="ghost"
                  size="none"
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium p-0 hover:bg-transparent"
                  onClick={(e) => { e.stopPropagation(); setShowOriginal(true); }}
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
            {displayPost?.hashtags && displayPost?.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayPost?.hashtags.map((hashtag) => (
                  <span key={hashtag.id}>
                    {parseHashtagsWithClick(hashtag.tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
          {displayPost.media && displayPost.media.length > 0 && (
            <div data-media-display>
              <MediaDisplay
                mediaFiles={displayPost.media}
                className="mt-3"
                lightboxUserName={displayPost.user.fullName}
                lightboxUserAvatar={displayPost.user.avatarUrl}
              />
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <AnimatedActionButton
            icon={<ReactHeartIcon />}
            activeIcon={<ReactHeartRedIcon />}
            count={post.reactionCount}
            isActive={post.isLike}
            onClick={() => onLike?.(post.code)}
            activeColor="text-red-500"
            inactiveColor="text-netural-900"
          />

          <AnimatedActionButton
            icon={<CommentsIcon />}
            count={post.commentCount}
            isActive={false}
            onClick={() => onComment?.(post?.code)}
            inactiveColor="text-netural-900"
          />

          <AnimatedActionButton
            icon={<RetryIcon />}
            count={post.repostCount}
            isActive={false}
            onClick={() => onRepost?.(post.code)}
            inactiveColor="text-netural-900"
          />

          <AnimatedActionButton
            icon={<SendIcon />}
            count={post.shareCount}
            isActive={false}
            onClick={() => onShare?.(post.code)}
            inactiveColor="text-netural-900"
          />
        </div>
      </div>

      <PostOptionsBottomSheet
        isOpen={isPostOptionsOpen}
        onClose={() => setIsPostOptionsOpen(false)}
        actionItems={actionItems}
      />
    </div>
  );
};
