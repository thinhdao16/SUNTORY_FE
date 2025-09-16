import React from 'react';
import { useTranslation } from 'react-i18next';
import { SocialPost } from '@/types/social-feed';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { parseHashtagsWithClick } from '@/utils/hashtagHighlight';

dayjs.extend(relativeTime);

interface SocialFeedCardProps {
  post: SocialPost;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onRepost?: (postId: number) => void;
  onPostClick?: (postId: number) => void;
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
  const { t, i18n } = useTranslation();
  
  const formatTimeAgo = (dateString: string) => {
    const locale = i18n.language === 'vi' ? 'vi' : 'en';
    return dayjs(dateString).locale(locale).fromNow();
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <div className="mt-3">
        {post.media.length === 1 ? (
          <div className="rounded-lg overflow-hidden">
            {post.media[0].type === 'image' ? (
              <img 
                src={post.media[0].url} 
                alt=""
                className="w-full max-h-96 object-cover"
              />
            ) : post.media[0].type === 'video' ? (
              <video 
                src={post.media[0].url}
                controls
                className="w-full max-h-96"
              />
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114a4.369 4.369 0 00-1.045-.063 3.983 3.983 0 00-4 4c0 2.206 1.794 4 4 4s4-1.794 4-4V7.041l8-1.6v4.675a4.369 4.369 0 00-1.045-.063 3.983 3.983 0 00-4 4c0 2.206 1.794 4 4 4s4-1.794 4-4V3z"/>
                  </svg>
                  <span className="text-sm text-gray-600">{t('Audio file')}</span>
                </div>
                <audio src={post.media[0].url} controls className="w-full mt-2" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {post.media.slice(0, 4).map((media, index) => (
              <div key={media.id} className="relative">
                {media.type === 'image' ? (
                  <img 
                    src={media.url} 
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                    </svg>
                  </div>
                )}
                {index === 3 && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">+{post.media.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't trigger post click if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('svg')) {
      return;
    }
    onPostClick?.(post.id);
  };

  const handleHashtagClick = (hashtag: string) => {
    console.log('Hashtag clicked:', hashtag);
    // TODO: Navigate to hashtag search or filter
  };

  return (
    <div 
      className={`bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
      onClick={handlePostClick}
    >
      {/* Post header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img 
            src={post.user.avatarUrl || '/default-avatar.png'} 
            alt={post.user.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{post.user.fullName}</span>
            </div>
            <span className="text-gray-500 text-xs">{formatTimeAgo(post.createDate)}</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {parseHashtagsWithClick(post.content, handleHashtagClick)}
        </div>
        
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map((hashtag) => (
              <span key={hashtag.id} className="text-blue-500 text-sm hover:underline cursor-pointer">
                {hashtag.tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Post actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
              post.isLike ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={post.isLike ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{post.reactionCount.toLocaleString()}</span>
          </button>
          
          <button 
            onClick={() => onComment?.(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{post.commentCount.toLocaleString()}</span>
          </button>
          
          <button 
            onClick={() => onShare?.(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="text-sm">{post.shareCount}</span>
          </button>
          
          <button 
            onClick={() => onRepost?.(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">{post.repostCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
