import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useTranslation } from 'react-i18next';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useGetChatRoomAttachments } from '../hooks/useSocialChat';
import ImageLightbox from '@/components/common/ImageLightbox';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

type FilterType = 'all' | 'images' | 'files';

const SocialChatViewAttachments: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const history = useHistory();
  const { t } = useTranslation();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [modalUserInfo, setModalUserInfo] = useState<{name: string, avatar?: string} | undefined>();
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useGetChatRoomAttachments(roomId, 20);

  // Process attachments and group by date
  const processedAttachments = React.useMemo(() => {
    if (!data?.pages) return [];
    
    const allAttachments = data.pages.flatMap(page => {
      if (page?.data?.data) return page.data.data;
      return [];
    });

    // Filter attachments based on activeFilter
    const filteredAttachments = allAttachments.filter(file => {
      const fileExt = file.fileName?.toLowerCase().split('.').pop() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
      const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExt);
      
      if (activeFilter === 'images') return isImage || isVideo;
      if (activeFilter === 'files') return !isImage && !isVideo;
      return true;
    });
    
    // Group by date
    const groupedByDate = filteredAttachments.reduce((acc: any, file) => {
      const date = dayjs(file.createDate).format('YYYY-MM-DD');
      if (!acc[date]) acc[date] = [];
      acc[date].push(file);
      return acc;
    }, {});
    
    // Convert to array sorted by date
    return Object.entries(groupedByDate)
      .map(([date, files]) => ({ date, files }))
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  }, [data, activeFilter]);
  
  // Generate preview images array
  useEffect(() => {
    if (previewImage) {
      const allImageFiles = data?.pages.flatMap((page: any) => {
        if (!page?.data?.data) return [];
        return page.data.data.filter((file: any) => {
          const fileExt = file.fileName?.toLowerCase().split('.').pop() || '';
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
        });
      }) || [];
      
      const urls = allImageFiles.map((file: any) => file.fileUrl);
      setPreviewImages(urls);
      setPreviewIndex(urls.indexOf(previewImage));
      
      // Set user info for modal (you can customize this based on your data structure)
      setModalUserInfo({
        name: "User", // Replace with actual user name from your data
        avatar: undefined // Replace with actual user avatar if available
      });
    }
  }, [previewImage, data]);

  // Download functionality
  const handleDownload = async (imageUrl: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // For mobile devices
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        const fileName = `image_${Date.now()}.jpg`;
        await Filesystem.writeFile({
          path: fileName,
          data: base64.split(',')[1],
          directory: Directory.Documents
        });
        
        // Show success message or toast
        console.log('Image saved successfully');
      } else {
        // For web - trigger download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleInfiniteScroll = (e: CustomEvent<void>) => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    setTimeout(() => {
      (e.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const today = dayjs();
    
    if (date.isSame(today, 'day')) {
      return t('Today');
    } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return t('Yesterday');
    }
    
    return date.locale('vi').format('DD MMMM, YYYY');
  };
  
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(ext || '')) {
      return 'document-pdf';
    } else if (['doc', 'docx'].includes(ext || '')) {
      return 'document-word';
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      return 'document-excel';
    } else if (['ppt', 'pptx'].includes(ext || '')) {
      return 'document-powerpoint';
    } else {
      return 'document-generic';
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="h-screen flex flex-col bg-[#F0F3F9]">
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-[#F0F3F9]">
        <div className="flex items-center">
          <button onClick={() => history.push(`/social-chat/t/${roomId}/info`)} className="p-1">
            <IoArrowBack className="text-xl" />
          </button>
          <h1 className="text-base font-medium ml-2">{t('Media')}</h1>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          className={`flex-1 py-3 text-center font-medium ${activeFilter === 'all' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveFilter('all')}
        >
          {t('All')}
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${activeFilter === 'images' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveFilter('images')}
        >
          {t('Photos & Videos')}
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${activeFilter === 'files' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveFilter('files')}
        >
          {t('Files')}
        </button>
      </div>
      
      <IonContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processedAttachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-5xl mb-4">
              {activeFilter === 'images' ? '🖼️' : activeFilter === 'files' ? '📄' : '📁'}
            </div>
            <p>{t('No media found')}</p>
          </div>
        ) : (
          <div className="pb-20">
            {processedAttachments.map((group: any) => (
              <div key={group.date} className="mb-6">
                <div className="px-4 py-2 sticky top-0 bg-[#F0F3F9] z-10">
                  <h3 className="text-sm font-medium text-gray-500">
                    {formatDate(group.date)}
                  </h3>
                </div>
                
                {activeFilter !== 'files' ? (
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {group?.files?.map((file: any, index: number) => {
                      const fileExt = file.fileName?.toLowerCase().split('.').pop() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
                      const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExt);
                      
                      if (isImage || isVideo) {
                        return (
                          <div 
                            key={`${file.id || index}-${group.date}`} 
                            className="aspect-square overflow-hidden bg-gray-100"
                            onClick={() => setPreviewImage(file.fileUrl)}
                          >
                            <img 
                              src={file.fileUrl} 
                              alt={file.fileName || `Media ${index}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Error";
                              }}
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="px-4 space-y-2">
                    {group?.files?.map((file: any, index: number) => {
                      const fileExt = file?.fileName?.toLowerCase().split('.').pop() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
                      const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExt);
                      
                      if (!isImage && !isVideo) {
                        return (
                          <div 
                            key={`${file?.id || index}-${group?.date}`} 
                            className="p-3 bg-white rounded-lg flex items-center shadow-sm"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <img 
                                src={`/icons/file-types/${getFileIcon(file?.fileName)}.svg`} 
                                alt={fileExt}
                                className="w-6 h-6"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/icons/file-types/document-generic.svg";
                                }}
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="text-sm font-medium truncate">{file.fileName}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</div>
                            </div>
                            <a 
                              href={file.fileUrl} 
                              download={file.fileName}
                              className="ml-2 text-blue-500 px-3 py-1 rounded-full border border-blue-500 text-sm"
                            >
                              {t('Download')}
                            </a>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}
            
            <IonInfiniteScroll
              threshold="100px" 
              onIonInfinite={handleInfiniteScroll}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText={t('Loading more...')}>
              </IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </div>
        )}
      </IonContent>

      {previewImage && (
        <ImageLightbox
          open={!!previewImage}
          images={previewImages}
          initialIndex={previewIndex}
          onClose={() => setPreviewImage(null)}
          userInfo={modalUserInfo}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default SocialChatViewAttachments;