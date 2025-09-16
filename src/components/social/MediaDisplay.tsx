import React, { useState } from 'react';
import { SocialMediaFile } from '@/types/social-feed';
import { categorizeMediaFiles, MediaType, getMediaType, formatFileSize } from '@/utils/mediaUtils';
import { useTranslation } from 'react-i18next';
import PlayAudioIcon from "@/icons/logo/play-audio.svg?react";

interface MediaDisplayProps {
  mediaFiles: SocialMediaFile[];
  className?: string;
}

interface ImageGridProps {
  images: SocialMediaFile[];
  className?: string;
}

interface AudioPlayerProps {
  audioFile: SocialMediaFile;
  className?: string;
}

interface VideoPlayerProps {
  videoFile: SocialMediaFile;
  className?: string;
}

interface ImageModalProps {
  image: SocialMediaFile;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <img
          src={image.urlFile}
          alt={image.fileName}
          className="max-w-full max-h-full object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const ImageGrid: React.FC<ImageGridProps> = ({ images, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState<SocialMediaFile | null>(null);

  if (images.length === 0) return null;

  // Single image - full width, fit to screen like thread view
  if (images.length === 1) {
    const image = images[0];
    return (
      <>
        <div className={`w-full ${className}`}>
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer w-full"
            onClick={() => setSelectedImage(image)}
            style={{ maxHeight: '60vh' }}
          >
            <img
              src={image.urlFile}
              alt={image.fileName}
              className="w-full h-full object-contain "
              loading="lazy"
              // style={{ maxHeight: '60vh' }}
            />
          </div>
        </div>
        {selectedImage && (
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </>
    );
  }

  // Multiple images - horizontal scroll
  return (
    <>
      <div className={`w-full ${className}`}>
        <div 
          className="flex gap-2 overflow-x-auto scrollbar-thin pb-2" 
          style={{ maxHeight: '300px' }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative overflow-hidden rounded-lg cursor-pointer flex-shrink-0"
              onClick={() => setSelectedImage(image)}
              style={{ width: '200px', height: '200px' }}
            >
              <img
                src={image.urlFile}
                alt={image.fileName}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              {images.length > 5 && index === 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    +{images.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </>
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioFile, className = '' }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [audioProgress, setAudioProgress] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressIntervalRef = React.useRef<number | null>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else {
        audioRef.current.play();
        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            const totalDuration = audioRef.current.duration || 1;
            setAudioProgress((currentTime / totalDuration) * 60);
          }
        }, 100);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 mx-4 p-3 border border-netural-50 rounded-2xl ${className}`}>
      <button
        onClick={togglePlayPause}
        className="w-10 h-10  rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
          {isPlaying ? (
                        <svg className="w-6 h-6 text-netural-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <PlayAudioIcon className="w-6 h-6 ml-0.5" />
                    )}
      </button>

      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 h-4 mt-1">
          {Array.from({ length: 65 }).map((_, i) => {
            const isActive = i < audioProgress;
            return (
              <div
                key={i}
                className={`w-[1px] rounded-full transition-all duration-150 ${isActive ? 'bg-black' : 'bg-netural-100'}`}
                style={{
                  height: `${Math.random() * 60 + 60}%`,
                  // opacity: isActive ? 0.8 : 0.3
                }}
              />
            );
          })}
        </div>
        {/* <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div> */}
      </div>

      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      >
        <source src={audioFile.urlFile} type={audioFile.fileType} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoFile, className = '' }) => {
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <video
        controls
        className="w-full aspect-video"
        preload="metadata"
        poster={videoFile.urlFile + '#t=0.1'} // Generate thumbnail
      >
        <source src={videoFile.urlFile} type={videoFile.fileType} />
        Your browser does not support the video element.
      </video>
    </div>
  );
};

const DocumentDisplay: React.FC<{ file: SocialMediaFile; className?: string }> = ({ 
  file, 
  className = '' 
}) => {
  const { t } = useTranslation();

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.fileName}
          </p>
          <p className="text-sm text-gray-500">
            {formatFileSize(file.fileSize)}
          </p>
        </div>
        <a
          href={file.urlFile}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export const MediaDisplay: React.FC<MediaDisplayProps> = ({ mediaFiles, className = '' }) => {
  if (!mediaFiles || mediaFiles.length === 0) return null;

  const categorized = categorizeMediaFiles(mediaFiles);

  return (
    <div className={`space-y-3 ${className}`}>
      {categorized.images.length > 0 && (
        <ImageGrid images={categorized.images} />
      )}

      {categorized.videos.map((video) => (
        <VideoPlayer key={video.id} videoFile={video} />
      ))}

      {categorized.audios.map((audio) => (
        <AudioPlayer key={audio.id} audioFile={audio} />
      ))}

      {categorized.documents.map((doc) => (
        <DocumentDisplay key={doc.id} file={doc} />
      ))}
    </div>
  );
};

export default MediaDisplay;
