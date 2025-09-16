import React from 'react';

/**
 * Parses text and highlights hashtags with blue color
 * @param text - The text content to parse
 * @returns JSX elements with highlighted hashtags
 */
export const parseHashtags = (text: string): React.ReactNode => {
  if (!text) return text;

  // Regex to match hashtags: # followed by word characters (letters, numbers, underscore)
  const hashtagRegex = /(#\w+)/g;
  
  // Split text by hashtags while keeping the hashtags in the result
  const parts = text.split(hashtagRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a hashtag
    if (hashtagRegex.test(part)) {
      return (
        <span 
          key={index} 
          className="text-blue-500 font-medium cursor-pointer hover:underline"
        >
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
  
  return parts.map((part, index) => {
    if (hashtagRegex.test(part)) {
      return (
        <span 
          key={index} 
          className="text-blue-500 font-medium cursor-pointer hover:underline hover:text-blue-600 transition-colors"
          onClick={() => onHashtagClick?.(part)}
        >
          {part}
        </span>
      );
    }
    
    return part;
  });
};
