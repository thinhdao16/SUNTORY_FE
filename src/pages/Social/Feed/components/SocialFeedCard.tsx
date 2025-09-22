import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
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
import LogoIcon from "@/icons/logo/logo-rounded-full.svg?react";
import { useAuthStore } from '@/store/zustand/auth-store';
import PostActionsProvider from '@/components/social/PostActionsProvider';
import { useSendFriendRequest, useUnfriend, useAcceptFriendRequest, useCancelFriendRequest, useRejectFriendRequest } from '@/pages/SocialPartner/hooks/useSocialPartner';
import ConfirmModal from '@/components/common/modals/ConfirmModal';
import { useToastStore } from '@/store/zustand/toast-store';

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
  onPostUpdate?: (updatedPost: SocialPost) => void;
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
  onPostUpdate,
  className = '',
  containerRefCallback
}) => {
  const { t } = useTranslation();
  const createTranslationMutation = useCreateTranslationChat();
  const { user } = useAuthStore.getState();
  const { selectedLanguageSocialChat, selectedLanguageTo } = useLanguageStore.getState();
  const toLanguageId = useMemo(() => selectedLanguageSocialChat?.id || selectedLanguageTo?.id || 2, [selectedLanguageSocialChat, selectedLanguageTo]);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);

  const showToast = useToastStore((state) => state.showToast);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: "send" | "cancel" | "unfriend" | "reject" | "accept" | null;
    friendRequestId?: number;
    friendName?: string;
  }>({
    open: false,
    type: null,
  });

  const sendFriendRequestMutation = useSendFriendRequest(showToast);
  const unfriendMutation = useUnfriend(showToast);
  const acceptFriendRequestMutation = useAcceptFriendRequest(showToast);
  const cancelFriendRequestMutation = useCancelFriendRequest(showToast);
  const rejectFriendRequestMutation = useRejectFriendRequest(showToast);

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
  const isRepostWithDeletedOriginal = post.isRepost && !post.originalPost || post?.isRepost && post?.originalPost?.status === 190;
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
  const openConfirmModal = (type: "send" | "cancel" | "unfriend" | "reject" | "accept", friendRequestId?: number, friendName?: string) => {
    setConfirmState({
      open: true,
      type,
      friendRequestId,
      friendName
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({
      open: false,
      type: null
    });
  };

  const handleOriginalPostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.originalPost?.code) {
      history.push(`/social-feed/f/${post.originalPost.code}`);
    }
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      await sendFriendRequestMutation.mutateAsync(userId);
      const updatedPost = {
        ...post,
        user: {
          ...post.user,
          friendRequest: {
            id: Date.now(),
            status: 'pending',
            fromUserId: user?.id,
            toUserId: userId
          }
        }
      };
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleUnfriend = async (userId: number) => {
    try {
      await unfriendMutation.mutateAsync({ friendUserId: userId });
      const updatedPost = {
        ...post,
        user: {
          ...post.user,
          isFriend: null,
          friendRequest: null
        }
      };
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error('Failed to unfriend:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId: number) => {
    try {
      await acceptFriendRequestMutation.mutateAsync(requestId);
      const updatedPost = {
        ...post,
        user: {
          ...post.user,
          isFriend: true,
          friendRequest: null
        }
      };
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleCancelFriendRequest = async (requestId: number) => {
    try {
      await cancelFriendRequestMutation.mutateAsync(requestId);
      const updatedPost = {
        ...post,
        user: {
          ...post.user,
          friendRequest: null
        }
      };
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error('Failed to cancel friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId: number) => {
    try {
      await rejectFriendRequestMutation.mutateAsync(requestId);
      const updatedPost = {
        ...post,
        user: {
          ...post.user,
          friendRequest: null
        }
      };
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };
  return (
    <div
      className={`bg-white border-b border-netural-50 cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
      onClick={handlePostClick}
      ref={containerRefCallback ? containerRefCallback : undefined}
    >
      {/* Reposter header */}
      <div className="flex justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img
            src={post?.isRepost ? post?.user?.avatarUrl || avatarFallback : displayPost?.user?.avatarUrl || avatarFallback}
            alt={post?.isRepost ? post?.user?.fullName : displayPost?.user?.fullName}
            className="w-9 h-9 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src = avatarFallback;
            }}
            onClick={(e) => handleUserProfileClick(e, post?.isRepost ? post?.user?.id : displayPost?.user?.id)}
          />
          <div className='grid gap-0'>
            <div className="flex items-center gap-2">
              <span
                className="font-semibold truncate max-w-[180px] cursor-pointer hover:underline"
                onClick={(e) => handleUserProfileClick(e, post?.isRepost ? post?.user?.id : displayPost?.user?.id)}
              >
                {post?.isRepost ? post?.user?.fullName : displayPost?.user?.fullName}
              </span>
              {post?.isRepost && (
                <div className="flex items-center gap-1">
                  <RetryIcon className='w-3 h-3 text-gray-400 opacity-25' />
                  <span className="text-sm text-gray-500">{t('reposted')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center text-netural-100 gap-1">
              <span className="text-sm">{formatTimeFromNow(post?.isRepost ? post?.createDate : displayPost?.createDate, t)}</span>
              <GoDotFill className="w-2 h-2" />
              <span className='opacity-20'>
                {getPrivacyIcon(post?.privacy)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-start h-full">
          <button
            className="text-gray-400 hover:text-gray-600 pb-6 pl-4"
            onClick={() => setIsPostOptionsOpen(true)}
          >
            <MdMoreHoriz className='text-xl' />
          </button>
        </div>
      </div>

      {/* {isRepost && post.captionRepost && (
        <div className="px-4 pb-2">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.captionRepost}
          </div>
        </div>
      )} */}

      {/* Original post content (or regular post content if not a repost) */}
      {post?.isRepost ? (
        <div
          className="mx-4 mb-4 border border-gray-200 rounded-2xl overflow-hidden pb-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                  src={displayPost.user.avatarUrl || avatarFallback}
                  alt={displayPost.user.fullName}
                  className="w-8 h-8 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = avatarFallback;
                  }}
                  onClick={(e) => handleUserProfileClick(e, displayPost.user.id)}
                />
                <div className="grid">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold truncate max-w-[200px] cursor-pointer hover:underline"
                      onClick={(e) => handleUserProfileClick(e, displayPost.user.id)}
                    >
                      {displayPost.user.fullName}
                    </span>
                  </div>
                  <div className="flex items-center text-netural-100 gap-1">
                    <span className="text-xs text-gray-500">{formatTimeFromNow(displayPost.createDate, t)}</span>
                    <GoDotFill className="w-2 h-2" />
                    <span className='opacity-20'>
                      {getPrivacyIcon(displayPost?.privacy)}
                    </span>
                  </div>
                </div>

              </div>
            </>
          )}
          {!isRepostWithDeletedOriginal && (
            <div className="px-4 py-3">
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
                        const res = await createTranslationMutation.mutateAsync({ toLanguageId: user?.language?.id as number, originalText: displayPost?.content || '' });
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
                  <div className="mt-2 border-l-3 border-gray-200 pl-3 text-sm text-netural-300 whitespace-pre-wrap">
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
          )}
          {!isRepostWithDeletedOriginal && displayPost?.media && displayPost?.media.length > 0 && (
            <div data-media-display>
              <MediaDisplay
                mediaFiles={displayPost?.media}
                className="mt-3 "
                lightboxUserName={displayPost.user.fullName}
                lightboxUserAvatar={displayPost.user.avatarUrl}
                classNameAudio='!px-4'
                customLengthAudio={6.5}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap px-4">
            {parseHashtagsWithClick(displayPost?.content)}
          </div>
          <div className="mt-2 px-4">
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
                    const res = await createTranslationMutation.mutateAsync({ toLanguageId: user?.language?.id as number, originalText: displayPost?.content || '' });
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
              <div className="mt-2 border-l-3 border-gray-200 pl-3 text-sm text-netural-300 whitespace-pre-wrap">
                {translatedText}
              </div>
            )}
          </div>
          {/* {displayPost?.hashtags && displayPost?.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 px-4">
              {displayPost?.hashtags.map((hashtag: any) => (
                <span key={hashtag.id}>
                  {parseHashtagsWithClick(hashtag.tag)}
                </span>
              ))}
            </div>
          )} */}
          {displayPost.media && displayPost.media.length > 0 && (
            <div data-media-display>
              <MediaDisplay
                mediaFiles={displayPost.media}
                className="mt-3 "
                lightboxUserName={displayPost.user.fullName}
                lightboxUserAvatar={displayPost.user.avatarUrl}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <AnimatedActionButton
            icon={<ReactHeartIcon />}
            activeIcon={<ReactHeartRedIcon />}
            count={post.reactionCount}
            isActive={post.isLike}
            onClick={() => onLike?.(post.code)}
            activeColor="text-black"
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

      <PostActionsProvider
        post={post}
        onSendFriendRequest={(userId) => openConfirmModal("send")}
        onUnfriend={(userId) => openConfirmModal("unfriend")}
        onAcceptFriendRequest={(requestId) => openConfirmModal("accept", requestId, post.user.fullName)}
        onCancelFriendRequest={(requestId) => openConfirmModal("cancel", requestId, post.user.fullName)}
        onRejectFriendRequest={(requestId) => openConfirmModal("reject", requestId, post.user.fullName)}
      >
        {({ actionItems, EditModalComponent }) => (
          <>
            <PostOptionsBottomSheet
              isOpen={isPostOptionsOpen}
              onClose={() => setIsPostOptionsOpen(false)}
              actionItems={actionItems}
            />
            {EditModalComponent}
          </>
        )}
      </PostActionsProvider>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={closeConfirmModal}
        title={t("Are you sure?")}
        message={
          confirmState.type === "send" ? t('Send friend request to {{name}}?', { name: displayPost?.user?.fullName }) :
            confirmState.type === "cancel" ? t("You can always send another request later!") :
              confirmState.type === "unfriend" ? t("You will no longer see their updates or share yours with them") :
                confirmState.type === "reject" ? t('Reject friend request from {{name}}?', { name: confirmState.friendName }) :
                  confirmState.type === "accept" ? t('Accept friend request from {{name}}?', { name: confirmState.friendName }) :
                    ""
        }
        confirmText={
          confirmState.type === "send" ? t("Yes, send") :
            confirmState.type === "cancel" ? t("Yes, cancel") :
              confirmState.type === "unfriend" ? t("Yes, unfriend") :
                confirmState.type === "reject" ? t("Yes, reject") :
                  confirmState.type === "accept" ? t("Yes, accept") :
                    t("Yes")
        }
        cancelText={t("Cancel")}
        onConfirm={async () => {
          if (confirmState.type === "send") {
            await handleSendFriendRequest(displayPost.user.id);
          } else if (confirmState.type === "unfriend") {
            await handleUnfriend(displayPost.user.id);
          } else if (confirmState.type === "accept" && confirmState.friendRequestId) {
            await handleAcceptFriendRequest(confirmState.friendRequestId);
          } else if (confirmState.type === "cancel" && confirmState.friendRequestId) {
            await handleCancelFriendRequest(confirmState.friendRequestId);
          } else if (confirmState.type === "reject" && confirmState.friendRequestId) {
            await handleRejectFriendRequest(confirmState.friendRequestId);
          }
          closeConfirmModal();
        }}
      />
    </div>
  );
};
