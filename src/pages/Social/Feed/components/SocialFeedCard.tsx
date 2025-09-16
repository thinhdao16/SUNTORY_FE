import React from 'react';
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

interface SocialFeedCardProps {
  post: SocialPost;
  onLike?: (postCode: string) => void;
  onComment?: (postCode: string) => void;
  onShare?: (postCode: string) => void;
  onRepost?: (postCode: string) => void;
  onPostClick?: (postCode: string) => void;
  className?: string;
}

export const SocialFeedCard: React.FC<SocialFeedCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onRepost,
  onPostClick,
  className = ''
}) => {
  const { t } = useTranslation();

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    return <MediaDisplay mediaFiles={post.media} className="mt-3" />;
  };

  const handlePostClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('svg')) {
      return;
    }
    onPostClick?.(post.code);
  };

  const handleHashtagClick = (hashtag: string) => {
    console.log('Hashtag clicked:', hashtag);
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
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
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
        <div className=" mb-3 rounded-lg">
          <div className="px-4 py-3">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {parseHashtagsWithClick(displayPost?.content, handleHashtagClick)}
            </div>
            {displayPost?.hashtags && displayPost?.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayPost?.hashtags.map((hashtag) => (
                  <span key={hashtag.id} className="text-blue-500 text-sm hover:underline cursor-pointer">
                    {hashtag.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {displayPost?.media && displayPost?.media.length > 0 && (
            <MediaDisplay mediaFiles={displayPost?.media} className="px-4 pb-3" />
          )}
        </div>
      ) : (
        <>
          <div className="px-4 pb-3">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {parseHashtagsWithClick(displayPost?.content, handleHashtagClick)}
            </div>
            {displayPost?.hashtags && displayPost?.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayPost?.hashtags.map((hashtag) => (
                  <span key={hashtag.id} className="text-blue-500 text-sm hover:underline cursor-pointer">
                    {hashtag.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {displayPost.media && displayPost.media.length > 0 && (
            <MediaDisplay mediaFiles={displayPost.media} className="mt-3" />
          )}
        </>
      )}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onLike?.(post.code)}
            className={`flex items-center gap-2 transition-colors ${post.isLike ? 'text-red-500' : 'text-netural-900'
              }`}
          >
            <ReactHeartIcon/>
            <span className="">{post.reactionCount.toLocaleString()}</span>
          </button>

          <button
            onClick={() => onComment?.(post?.code)}
            className="flex items-center gap-2 text-netural-900 hover:text-blue-500 transition-colors"
          >
            <CommentsIcon  />
            <span className="">{post.commentCount.toLocaleString()}</span>
          </button>
          <button
            onClick={() => onRepost?.(post.code)}
            className="flex items-center gap-2 text-netural-900 hover:text-purple-500 transition-colors"
          >
            <RetryIcon  />

            <span className="">{post.repostCount}</span>
          </button>
          <button
            onClick={() => onShare?.(post.code)}
            className="flex items-center gap-2 text-netural-900 hover:text-green-500 transition-colors"
          >
            <SendIcon  />
            <span className="">{post.shareCount}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
