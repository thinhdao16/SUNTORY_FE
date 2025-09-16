import { SocialMediaFile } from '@/types/social-feed';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

export interface CategorizedMedia {
  images: SocialMediaFile[];
  videos: SocialMediaFile[];
  audios: SocialMediaFile[];
  documents: SocialMediaFile[];
}

/**
 * Categorizes media files by their type based on fileType property
 */
export const categorizeMediaFiles = (mediaFiles: SocialMediaFile[]): CategorizedMedia => {
  const categorized: CategorizedMedia = {
    images: [],
    videos: [],
    audios: [],
    documents: []
  };

  mediaFiles.forEach(file => {
    const fileType = file.fileType.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      categorized.images.push(file);
    } else if (fileType.startsWith('video/')) {
      categorized.videos.push(file);
    } else if (fileType.startsWith('audio/')) {
      categorized.audios.push(file);
    } else {
      categorized.documents.push(file);
    }
  });

  return categorized;
};

/**
 * Gets the media type from a file's fileType property
 */
export const getMediaType = (file: SocialMediaFile): MediaType => {
  const fileType = file.fileType.toLowerCase();
  
  if (fileType.startsWith('image/')) {
    return MediaType.IMAGE;
  } else if (fileType.startsWith('video/')) {
    return MediaType.VIDEO;
  } else if (fileType.startsWith('audio/')) {
    return MediaType.AUDIO;
  } else {
    return MediaType.DOCUMENT;
  }
};

/**
 * Checks if a file is an image
 */
export const isImageFile = (file: SocialMediaFile): boolean => {
  return file.fileType.toLowerCase().startsWith('image/');
};

/**
 * Checks if a file is a video
 */
export const isVideoFile = (file: SocialMediaFile): boolean => {
  return file.fileType.toLowerCase().startsWith('video/');
};

/**
 * Checks if a file is an audio file
 */
export const isAudioFile = (file: SocialMediaFile): boolean => {
  return file.fileType.toLowerCase().startsWith('audio/');
};

/**
 * Gets the file extension from fileName
 */
export const getFileExtension = (file: SocialMediaFile): string => {
  const parts = file.fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets a display name for the media type
 */
export const getMediaTypeDisplayName = (mediaType: MediaType): string => {
  switch (mediaType) {
    case MediaType.IMAGE:
      return 'Image';
    case MediaType.VIDEO:
      return 'Video';
    case MediaType.AUDIO:
      return 'Audio';
    case MediaType.DOCUMENT:
      return 'Document';
    default:
      return 'File';
  }
};

/**
 * Checks if the post has any media files
 */
export const hasMediaFiles = (mediaFiles: SocialMediaFile[]): boolean => {
  return mediaFiles && mediaFiles.length > 0;
};

/**
 * Gets the primary media type of a post (the most common type)
 */
export const getPrimaryMediaType = (mediaFiles: SocialMediaFile[]): MediaType | null => {
  if (!hasMediaFiles(mediaFiles)) return null;
  
  const categorized = categorizeMediaFiles(mediaFiles);
  
  // Return the type with the most files
  let maxCount = 0;
  let primaryType: MediaType | null = null;
  
  if (categorized.images.length > maxCount) {
    maxCount = categorized.images.length;
    primaryType = MediaType.IMAGE;
  }
  
  if (categorized.videos.length > maxCount) {
    maxCount = categorized.videos.length;
    primaryType = MediaType.VIDEO;
  }
  
  if (categorized.audios.length > maxCount) {
    maxCount = categorized.audios.length;
    primaryType = MediaType.AUDIO;
  }
  
  if (categorized.documents.length > maxCount) {
    maxCount = categorized.documents.length;
    primaryType = MediaType.DOCUMENT;
  }
  
  return primaryType;
};
