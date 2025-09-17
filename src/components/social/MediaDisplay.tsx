import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageLightbox from '@/components/common/ImageLightbox';
import { SocialMediaFile } from '@/types/social-feed';
import { categorizeMediaFiles, formatFileSize } from '@/utils/mediaUtils';
import PlayAudioIcon from '@/icons/logo/play-audio.svg?react';

interface MediaDisplayProps {
  mediaFiles: SocialMediaFile[];
  className?: string;
  lightboxUserName?: string;
  lightboxUserAvatar?: string | null;
}

interface ImageGridProps {
  images: SocialMediaFile[];
  className?: string;
  onImageClick: (index: number) => void;
}

interface AudioPlayerProps {
  audioFile: SocialMediaFile;
  className?: string;
}

interface VideoPlayerProps {
  videoFile: SocialMediaFile;
  className?: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, className = '', onImageClick }) => {
  if (!images.length) return null;

  if (images.length === 1) {
    const image = images[0];
    return (
      <div className={`w-full ${className}`}>
        <div
          className="relative overflow-hidden rounded-2xl px-4 cursor-pointer w-full"
          onClick={() => onImageClick(0)}
          style={{ maxHeight: '60%' }}
        >
          <img
            src={image.urlFile}
            alt={image.fileName}
            className="w-full h-fit rounded-2xl object-cover"
            loading="lazy"
            style={{ maxHeight: '60vh' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 px-4"
        style={{ maxHeight: '300px' }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded-lg cursor-pointer flex-shrink-0"
            onClick={() => onImageClick(index)}
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
                <span className="text-white text-xl font-semibold">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioFile, className = '' }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressIntervalRef = React.useRef<number | null>(null);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      audioRef.current.play();
      progressIntervalRef.current = window.setInterval(() => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration || 1;
        setAudioProgress((current / total) * 65);
      }, 120);
    }

    setIsPlaying((prev) => !prev);
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
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
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
                style={{ height: `${Math.random() * 60 + 60}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      >
        <source src={audioFile.urlFile} type={audioFile.fileType} />
        {t('Your browser does not support the audio element.')}
      </audio>
    </div>
  );
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoFile, className = '' }) => (
  <div className={`relative rounded-lg overflow-hidden ${className}`}>
    <video
      controls
      className="w-full aspect-video"
      preload="metadata"
      poster={videoFile.urlFile + '#t=0.1'}
    >
      <source src={videoFile.urlFile} type={videoFile.fileType} />
      Your browser does not support the video element.
    </video>
  </div>
);

const DocumentDisplay: React.FC<{ file: SocialMediaFile; className?: string }> = ({ file, className = '' }) => {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
          <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
        </div>
        <a
          href={file.urlFile}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  mediaFiles,
  className = '',
  lightboxUserName,
  lightboxUserAvatar,
}) => {
  const categorized = useMemo(() => categorizeMediaFiles(mediaFiles || []), [mediaFiles]);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  const handleImageClick = useCallback((index: number) => {
    setLightbox({ open: true, index });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightbox({ open: false, index: 0 });
  }, []);

  if (!mediaFiles || mediaFiles.length === 0) return null;

  const imageUrls = categorized.images.map((img) => img.urlFile);

  return (
    <div className={`space-y-3 ${className}`}>
      {categorized.images.length > 0 && (
        <>
          <ImageGrid images={categorized.images} onImageClick={handleImageClick} />
          <ImageLightbox
            open={lightbox.open}
            images={imageUrls}
            initialIndex={lightbox.index}
            onClose={handleCloseLightbox}
            userInfo={lightboxUserName ? { name: lightboxUserName, avatar: lightboxUserAvatar || undefined } : undefined}
            options={{
              showDownload: true,
              showPageIndicator: true,
              showNavButtons: true,
              showZoomControls: true,
              enableZoom: true,
              showHeader: true,
              effect: 'slide',
              spaceBetween: 30,
            }}
          />
        </>
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
