import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IonModal } from '@ionic/react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { DraggableImageGrid } from '@/components/common/DraggableImageGrid';
import { AudioRecorder } from '@/components/common/AudioRecorder';
import ActionButton from '@/components/loading/ActionButton';
import { useUpdatePost } from '@/pages/Social/Feed/hooks/useUpdatePost';
import { useImageUploadState } from '@/pages/Social/Feed/CreateFeed/hooks/useImageUploadState';
import { useImageUploadHandlers } from '@/pages/Social/Feed/CreateFeed/hooks/useImageUploadHandlers';
import { useAudioUploadState } from '@/pages/Social/Feed/CreateFeed/hooks/useAudioUploadState';
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
import { PrivacyPostType } from '@/types/privacy';
import { useAuthStore } from '@/store/zustand/auth-store';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { SocialPost } from '@/types/social-feed';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import CloseIcon from "@/icons/logo/close-default.svg?react"
import CamIcon from "@/icons/logo/chat/cam.svg?react"
import ImageIcon from "@/icons/logo/chat/image.svg?react"
import { parseHashtags } from '@/utils/hashtagHighlight';

interface EditFeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    postCode: string;
    onSuccess?: () => void;
}

const EditFeedModal: React.FC<EditFeedModalProps> = ({
    isOpen,
    onClose,
    postCode,
    onSuccess
}) => {
    const { t } = useTranslation();
    const [postText, setPostText] = useState("");
    const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyPostType>(PrivacyPostType.Public);
    const [isLoading, setIsLoading] = useState(true);
    const [originalPost, setOriginalPost] = useState<SocialPost | null>(null);
    
    const { images, isUploading, setIsUploading, addImages, addAudioItem, removeImage, reorderImages, clearImages, setImages } = useImageUploadState();
    const {
        audioBlob,
        setAudioBlob,
        audioDuration,
        setAudioDuration,
        audioServerUrl,
        setAudioServerUrl,
        audioFilename,
        setAudioFilename,
        isAudioUploading,
        isRecording,
        setIsRecording,
        audioUploadMutation,
        handleAudioRecorded,
        handleRemoveAudio,
        clearAudio
    } = useAudioUploadState();
    const { handleImageUpload, handleCameraCapture, handleGallerySelect } = useImageUploadHandlers({
        addImages,
        clearAudio
    });
    const handleAudioRecordedWithImageItem = useCallback((blob: Blob, duration: number, serverUrl?: string, filename?: string) => {
        const audioItemsToRemove = images.filter(item => item.mediaType === 'audio');
        audioItemsToRemove.forEach((item) => {
            const audioIndex = images.findIndex(img => img === item);
            if (audioIndex !== -1) {
                removeImage(audioIndex);
            }
        });
        
        handleAudioRecorded(blob, duration, serverUrl, filename);
        if (serverUrl && filename) {
            addAudioItem(blob, filename, serverUrl, filename);
        }
    }, [handleAudioRecorded, addAudioItem, images, removeImage]);

    const handleRemoveAudioWithImageItem = useCallback(() => {
        const audioItemsToRemove = images.filter(item => item.mediaType === 'audio');
        audioItemsToRemove.forEach((item, index) => {
            const audioIndex = images.findIndex(img => img === item);
            if (audioIndex !== -1) {
                removeImage(audioIndex);
            }
        });
        
        handleRemoveAudio();
    }, [handleRemoveAudio, images, removeImage]);

    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const updatePostMutation = useUpdatePost();
    const { user } = useAuthStore();
    useAutoResizeTextarea(textareaRef, postText);
    useEffect(() => {
        const loadPost = async () => {
            if (!postCode || !isOpen || originalPost) return; 
            try {
                setIsLoading(true);
                const post = await SocialFeedService.getPostByCode(postCode);
                setOriginalPost(post);
                setPostText(post.content || '');
                setSelectedPrivacy(post.privacy as PrivacyPostType);
                if (post.media && post.media.length > 0) {
                    const mediaItems = post.media.map((media, index) => {
                        const dummyFile = new File([''], media.fileName || `media-${index}`, {
                            type: media.fileType || 'image/jpeg'
                        });
                        
                        return {
                            file: dummyFile,
                            localUrl: media.urlFile, 
                            serverUrl: media.urlFile,
                            serverName: media.s3Key || media.fileName || '',
                            filename: media.s3Key || media.fileName || '',
                            mediaType: media.fileType?.startsWith('audio') ? 'audio' as const : 'image' as const,
                            isUploading: false,
                            isExisting: true, 
                            isUploaded: true,
                            width: media.width|| 300,
                            height: media.height|| 300,
                        };
                    });
                    clearImages();
                    setTimeout(() => setImages(mediaItems), 0);
                    const audioMedia = post.media.find(m => m.fileType.startsWith('audio'));
                    if (audioMedia) {
                        setAudioServerUrl(audioMedia.urlFile);
                        setAudioFilename(audioMedia.fileName || '');
                        setAudioDuration(0);
                    }
                }
            } catch (error) {
                console.error('Failed to load post:', error);
                // onClose();
            } finally {
                setIsLoading(false);
            }
        };

        loadPost();
    }, [postCode, isOpen, originalPost]);

    useEffect(() => {
        if (!isOpen) {
            setPostText('');
            setSelectedPrivacy(PrivacyPostType.Public);
            clearImages();
            clearAudio();
            setOriginalPost(null);
            setIsLoading(true);
        }
    }, [isOpen]);

    const privacyOptions = [
        {
            id: PrivacyPostType.Public,
            label: t("Everyone"),
            icon: "🌍"
        },
        {
            id: PrivacyPostType.Friend,
            label: t("Friends"),
            icon: "👥"
        },
        {
            id: PrivacyPostType.Private,
            label: t("Private"),
            icon: "🔒"
        }
    ];
    const selectedPrivacyOption = privacyOptions.find(option => option.id === selectedPrivacy);

    const handleUpdate = async () => {
        if (!postText.trim() && images.length === 0 && !audioBlob && !audioServerUrl) {
            return;
        }

        if (!postCode) return;

        setIsUploading(true);

        try {
            const existingMedia = images.filter(item => item.isExisting);
            const newUploads = images.filter(item => !item.isExisting && item.serverUrl && item.serverName);
            const existingMediaFilenames = existingMedia
                .map(item => {
                    if (item.serverName && item.serverName.trim()) {
                        return item.serverName.trim();
                    } else if (item.filename && item.filename.trim()) {
                        return item.filename.trim();
                    } else if (item.serverUrl) {
                        const urlParts = item.serverUrl.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        return filename.split('?')[0];
                    }
                    return '';
                })
                .filter(filename => filename && filename !== '');
            
            const newMediaFilenames = newUploads
                .filter(item => (item.serverName || item.serverUrl || item.filename))
                .map(item => {
                    if (item.serverName && item.serverName.trim()) {
                        return item.serverName.trim();
                    } else if (item.filename && item.filename.trim()) {
                        return item.filename.trim();
                    } else if (item.serverUrl) {
                        const urlParts = item.serverUrl.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        return filename.split('?')[0];
                    }
                    return '';
                })
                .filter(filename => filename && filename !== '');
            
            const allMediaFilenames = [...existingMediaFilenames, ...newMediaFilenames];
            
            if (audioFilename && !images.some(item => item.mediaType === 'audio')) {
                allMediaFilenames.push(audioFilename);
            }

            const hashtags = postText.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
            await updatePostMutation.mutateAsync({
                postCode,
                content: postText.trim(),
                mediaFilenames: allMediaFilenames.length > 0 ? allMediaFilenames : undefined,
                hashtags: hashtags.length > 0 ? hashtags : undefined,
                privacy: Number(selectedPrivacy)
            });
            
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to update post:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            backdropDismiss={false}
            canDismiss={true}
            presentingElement={undefined}
            initialBreakpoint={1}
            breakpoints={[1]}
            className='modal-edit-feed'
        >
            <div className="h-full bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-start p-4 border-b border-netural-50 gap-6 flex-shrink-0">
                    <button onClick={onClose}>
                        <CloseIcon />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">{t("Edit post")}</h1>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20" onClick={(e) => e.stopPropagation()}>
                    {/* {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-2"></div>
                                <p className="text-gray-600">{t("Loading...")}</p>
                            </div>
                        </div>
                    ) : ( */}
                        <>
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user?.avatarLink || avatarFallback}
                                    alt={user?.name || 'User Avatar'}
                                    className="w-[40px] h-[40px] rounded-2xl object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = avatarFallback;
                                    }}
                                />
                                <div>
                                    <div className="font-semibold text-netural-900 mb-1">{user?.name}</div>
                                    <button
                                        onClick={() => setIsPrivacyModalOpen(true)}
                                        className="flex items-center gap-1 px-2 py-0.5 font-semibold bg-primary-50 text-main rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="text-sm">
                                            {selectedPrivacyOption?.label}
                                        </div>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder={t("What's new?")}
                                    className="w-full min-h-[2.5rem] py-3 border-none outline-none resize-none text-transparent bg-transparent caret-gray-700 leading-relaxed relative z-10"
                                    rows={1}
                                    autoFocus
                                    style={{ color: 'transparent' }}
                                />
                                <div 
                                    className="absolute top-0 left-0 w-full min-h-[2.5rem] py-3 pointer-events-none text-gray-700 leading-relaxed whitespace-pre-wrap z-0"
                                    style={{ 
                                        minHeight: textareaRef.current?.scrollHeight || 'auto',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {postText ? parseHashtags(postText) : (
                                        <span className="text-gray-400">{t("What's new?")}</span>
                                    )}
                                </div>
                            </div>

                            <DraggableImageGrid
                                images={images.filter(item => item.mediaType === 'image' || (item.mediaType as any) === 'video')}
                                onRemoveImage={removeImage}
                                onReorderImages={reorderImages}
                                enableDragDrop={true}
                                showDragHandle={true}
                                dragFromTopArea={true}
                            />

                            {(audioBlob || audioServerUrl) && (
                                <AudioRecorder
                                    onAudioRecorded={handleAudioRecordedWithImageItem}
                                    onRemoveAudio={handleRemoveAudioWithImageItem}
                                    audioBlob={audioBlob ?? undefined}
                                    duration={audioDuration}
                                    serverUrl={audioServerUrl}
                                    isUploading={isAudioUploading || audioUploadMutation.isLoading}
                                    className=""
                                    showAsButton={false}
                                    audioUploadMutation={audioUploadMutation}
                                />
                            )}
                        </>
                    {/* )} */}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-netural-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {!images.some(item => item.mediaType === 'audio') && (
                                    <>
                                        {!isRecording && (
                                            <>
                                                <button
                                                    onClick={handleGallerySelect}
                                                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                                                    title={t("Select from Gallery")}
                                                    disabled={!!audioBlob || !!audioServerUrl}
                                                >
                                                    <ImageIcon />
                                                </button>
                                                <button
                                                    onClick={handleCameraCapture}
                                                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                                                    title={t("Take Photo")}
                                                    disabled={!!audioBlob || !!audioServerUrl}
                                                >
                                                    <CamIcon />
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {!images.some(item => item.mediaType === 'image') && (
                                    <AudioRecorder
                                        onAudioRecorded={handleAudioRecordedWithImageItem}
                                        onRemoveAudio={handleRemoveAudioWithImageItem}
                                        audioBlob={audioBlob ?? undefined}
                                        duration={audioDuration}
                                        serverUrl={audioServerUrl}
                                        isUploading={isAudioUploading || audioUploadMutation.isLoading}
                                        className=""
                                        showAsButton={true}
                                        audioUploadMutation={audioUploadMutation}
                                        onRecordingStateChange={setIsRecording}
                                    />
                                )}
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                                {(isUploading || audioUploadMutation.isLoading) && (
                                    <div className="text-sm text-blue-600 font-medium">
                                        {audioUploadMutation.isLoading && t("Uploading audio...")}
                                        {isUploading && !isAudioUploading && t("Uploading images...")}
                                        {isUploading && isAudioUploading && t("Uploading files...")}
                                    </div>
                                )}
                                {!isRecording && (
                                    <ActionButton
                                        onClick={handleUpdate}
                                        disabled={!postText.trim() && images.length === 0 && !audioBlob && !audioServerUrl}
                                        loading={updatePostMutation.isLoading || isUploading || audioUploadMutation.isLoading}
                                        className="px-3 py-2 text-sm bg-main flex items-center justify-center gap-2 text-white rounded-2xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {updatePostMutation.isLoading ? t("Updating...") : t("Update")}
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                )}

                <PrivacyBottomSheet
                    isOpen={isPrivacyModalOpen}
                    closeModal={() => setIsPrivacyModalOpen(false)}
                    selectedPrivacy={selectedPrivacy}
                    onSelectPrivacy={setSelectedPrivacy}
                />
            </div>
        </IonModal>
    );
};

export default EditFeedModal;
