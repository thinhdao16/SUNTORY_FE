import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SocialMediaFile } from '@/types/social-feed';
import { useTranslation } from 'react-i18next';
import ImageLightbox from '@/components/common/ImageLightbox';
import { ImageWithPlaceholder } from '@/components/common/ImageWithPlaceholder';
import { VideoWithPlaceholder } from '@/components/common/VideoWithPlaceholder';
import { categorizeMediaFiles, formatFileSize } from '@/utils/mediaUtils';
import PlayAudioIcon from '@/icons/logo/play-audio.svg?react';
import { IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';

interface MediaDisplayProps {
  mediaFiles: SocialMediaFile[];
  className?: string;
  lightboxUserName?: string;
  lightboxUserAvatar?: string | null;
  classNameAudio?: string;
  customLengthAudio?: number;
  singleWrapperClassName?: string; // overrides wrapper around single media (default px-4)
  multiWrapperClassName?: string;  // overrides wrapper around multi media row (default flex gap-3 px-4 overflow-x-auto scrollbar-thin)
}

interface ImageGridProps {
  images: SocialMediaFile[];
  className?: string;
  onImageClick: (index: number) => void;
}

interface VideoGridProps {
  videos: SocialMediaFile[];
  className?: string;
}

interface AudioPlayerProps {
  audioFile: SocialMediaFile;
  className?: string;
  classNameAudio?: string;
  customLengthAudio?: number
}

interface VideoPlayerProps {
  videoFile: SocialMediaFile;
  className?: string;
}


const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioFile, className = '', classNameAudio = '', customLengthAudio = 6 }) => {
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
  const [barWidth, setBarWidth] = useState(2);

  useEffect(() => {
    const updateBarWidth = () => {
      const screenWidth = window.innerWidth;
      const maxWidth = Math.min(screenWidth, 450);
      setBarWidth(maxWidth / customLengthAudio);
    };

    updateBarWidth();
    window.addEventListener("resize", updateBarWidth);
    return () => window.removeEventListener("resize", updateBarWidth);
  }, []);
  return (
    <div className={`${classNameAudio}`}>
      <div className={`flex items-center gap-3 mx-auto p-3 border border-netural-50 rounded-2xl  `}>
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
            {Array.from({ length: barWidth }).map((_, i) => {
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
    </div>
  );
};



const DocumentDisplay: React.FC<{ file: SocialMediaFile; className?: string }> = ({ file, className = '' }) => {
  return (
    <div className={`bg-gray-50 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center">
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
  classNameAudio = '',
  customLengthAudio = 6,
  singleWrapperClassName,
  multiWrapperClassName,

}) => {
  const categorized = useMemo(() => categorizeMediaFiles(mediaFiles || []), [mediaFiles]);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [videoMuted, setVideoMuted] = useState<{ [key: string]: boolean }>({});

  const handleMediaClick = useCallback((index: number) => {
    setLightbox({ open: true, index });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightbox(prev => ({ ...prev, open: false }));
    setTimeout(() => {
      setLightbox({ open: false, index: 0 });
    }, 300);
  }, []);

  const toggleVideoMute = useCallback((videoId: string) => {
    setVideoMuted(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  }, []);

  if (!mediaFiles || mediaFiles.length === 0) return null;

  const visualMediaFiles = mediaFiles.filter(item =>
    item.fileType.startsWith('image/') || item.fileType.startsWith('video/')
  );
  const mediaItems = visualMediaFiles.map(item => ({
    url: item.urlFile,
    type: item.fileType.startsWith('video/') ? 'video' : 'image' as 'video' | 'image',
    s3Key: item?.s3Key,
    fileName: item?.fileName,
  }));
  return (
    <div className={`${className}`}>
      {visualMediaFiles.length === 1 ? (
        <div className={singleWrapperClassName ?? "px-4"}>
          {(() => {
            const item = visualMediaFiles[0];
            return (
              <div className="w-full">
                {item.fileType.startsWith('image/') && (
                  <ImageWithPlaceholder
                    src={item.urlFile}
                    alt={item.fileName || 'Image'}
                    width={item.width || 1000}
                    height={item.height || 1000}
                    className="rounded-2xl cursor-pointer w-full"
                    onClick={() => {
                      const mediaIndex = visualMediaFiles.findIndex(media => media.id === item.id);
                      if (mediaIndex !== -1) {
                        handleMediaClick(mediaIndex);
                      }
                    }}
                    maxHeight="60vh"
                    objectFit="cover"
                  />
                )}

                {item.fileType.startsWith('video/') && (
                  <div
                    className="cursor-pointer relative"
                    onClick={() => {
                      const mediaIndex = visualMediaFiles.findIndex(media => media.id === item.id);
                      if (mediaIndex !== -1) {
                        handleMediaClick(mediaIndex);
                      }
                    }}
                  >
                    <VideoWithPlaceholder
                      src={item.urlFile}
                      width={item.width || 1920}
                      height={item.height || 1080}
                      className="rounded-2xl w-full pointer-events-none"
                      maxHeight="60vh"
                      objectFit="cover"
                      controls={false}
                      muted={videoMuted[item.id] !== false}
                      autoPlay={true}
                    />

                    <button
                      className="absolute bottom-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoMute(item.id.toString());
                      }}
                    >
                      {videoMuted[item.id] !== false ? (
                        <IoVolumeMute className="text-white text-sm" />
                      ) : (
                        <IoVolumeHigh className="text-white text-sm" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : visualMediaFiles.length > 1 ? (
        <div className={multiWrapperClassName ?? "flex gap-3 px-4 overflow-x-auto "}>
          {(() => {
            const maxHeight = Math.max(...visualMediaFiles.map(item => item.height || 0));
            const containerHeight = Math.min(Math.max(maxHeight / 4, 200), 280);

            return visualMediaFiles.map((item, index) => {
              const aspectRatio = (item.width && item.height) ? (item.width / item.height) :
                (item.fileType.startsWith('video/') ? (16 / 9) : 1);
              const itemWidth = containerHeight * aspectRatio;
              const finalWidth = Math.min(Math.max(itemWidth, 150), 200);

              return (
                <div
                  key={`media-${item.id}`}
                  className="relative overflow-hidden"
                  style={{
                    width: `${finalWidth}px`,
                    height: `${containerHeight}px`,
                    flex: '0 0 auto'
                  }}
                >
                  {item.fileType.startsWith('image/') && (
                    <ImageWithPlaceholder
                      src={item.urlFile}
                      alt={item.fileName || 'Image'}
                      width={item.width || 1000}
                      height={item.height || 1000}
                      className="rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full"
                      onClick={() => {
                        const mediaIndex = visualMediaFiles.findIndex(media => media.id === item.id);
                        if (mediaIndex !== -1) {
                          handleMediaClick(mediaIndex);
                        }
                      }}
                      maxHeight="none"
                      objectFit="cover"
                    />
                  )}

                  {item.fileType.startsWith('video/') && (
                    <div
                      className="cursor-pointer hover:scale-105 transition-transform duration-200 w-full h-full relative"
                      onClick={() => {
                        const mediaIndex = visualMediaFiles.findIndex(media => media.id === item.id);
                        if (mediaIndex !== -1) {
                          handleMediaClick(mediaIndex);
                        }
                      }}
                    >
                      <VideoWithPlaceholder
                        src={item.urlFile}
                        width={item.width || 1920}
                        height={item.height || 1080}
                        className="rounded-2xl w-full h-full pointer-events-none"
                        maxHeight="none"
                        objectFit="cover"
                        controls={false}
                        muted={videoMuted[item.id] !== false}
                        autoPlay={true}
                      />

                      <button
                        className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVideoMute(item.id.toString());
                        }}
                      >
                        {videoMuted[item.id] !== false ? (
                          <IoVolumeMute className="text-white text-sm" />
                        ) : (
                          <IoVolumeHigh className="text-white text-sm" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : null}

      {visualMediaFiles.length > 0 && (
        <ImageLightbox
          open={lightbox.open}
          images={mediaItems}
          initialIndex={lightbox.index}
          onClose={handleCloseLightbox}
          userInfo={lightboxUserName ? { name: lightboxUserName, avatar: lightboxUserAvatar || undefined } : undefined}
          options={{
            showDownload: true,
            showPageIndicator: true,
            showNavButtons: true,
            showZoomControls: false,
            enableZoom: true,
            showHeader: true,
            effect: 'slide',
            spaceBetween: 30,
          }}
        />
      )}

      {categorized.audios.map((audio) => (
        <AudioPlayer key={audio.id} audioFile={audio} classNameAudio={classNameAudio} customLengthAudio={customLengthAudio} />
      ))}

      {categorized.documents.map((doc) => (
        <DocumentDisplay key={doc.id} file={doc} />
      ))}
    </div>
  );
};

export default MediaDisplay;
