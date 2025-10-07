import React from 'react';
import { SocialFeedService } from '@/services/social/social-feed-service';

/**
 * Highlights hashtags in text with blue color
 * @param text - The text content to parse
 * @returns JSX elements with highlighted hashtags
 */
export const parseHashtags = (text: string): React.ReactNode => {
  if (!text) return text;

  const hashtagRegex = /(#\w+)/g;
  const parts = text.split(hashtagRegex);
  
  return parts.map((part, index) => {
    if (hashtagRegex.test(part)) {
      return (
        <span key={index} className="text-blue-500 font-medium">
          {part}
        </span>
      );
    }
    
    // Regular text
    return part;
  });
};

/**
 * Alternative function that returns styled hashtags as clickable elements
 * @param text - The text content to parse
 * @param onHashtagClick - Optional callback when hashtag is clicked
 * @returns JSX elements with clickable highlighted hashtags
 */
export const parseHashtagsWithClick = (
  text: string, 
  onHashtagClick?: (hashtag: string) => void
): React.ReactNode => {
  if (!text) return text;

  const hashtagRegex = /(#\w+)/g;
  const parts = text.split(hashtagRegex);
  
  const handleHashtagClick = async (hashtag: string) => {
    // Navigate immediately
    onHashtagClick?.(hashtag);
    // Then track interest and notify listeners on success
    try {
      await SocialFeedService.trackHashtagInterest(hashtag);
      window.dispatchEvent(new CustomEvent('hashtag-interest-success', { detail: hashtag }));
    } catch {}
  };
  
  return parts.map((part, index) => {
    if (hashtagRegex.test(part)) {
      return (
        <span 
          key={index} 
          className="text-blue-500 font-medium cursor-pointer hover:underline hover:text-blue-600 transition-colors"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); void handleHashtagClick(part); }}
        >
          {part}
        </span>
      );
    }
    
    return part;
  });
};
