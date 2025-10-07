import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { DraggableImageGrid } from '@/components/common/DraggableImageGrid';
import { AudioRecorder } from '@/components/common/AudioRecorder';
import ActionButton from '@/components/loading/ActionButton';
import { useCreatePost } from '@/pages/Social/Feed/hooks/useCreatePost';
import { useImageUploadState } from './hooks/useImageUploadState';
import { useImageUploadHandlers } from './hooks/useImageUploadHandlers';
import { useAudioUploadState } from './hooks/useAudioUploadState';
import PrivacyBottomSheet from '@/components/common/PrivacyBottomSheet';
import { PrivacyPostType } from '@/types/privacy';
import { useAuthStore } from '@/store/zustand/auth-store';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import CloseIcon from "@/icons/logo/close-default.svg?react"
import CamIcon from "@/icons/logo/chat/cam.svg?react"
import ImageIcon from "@/icons/logo/chat/image.svg?react"
import { parseHashtags } from '@/utils/hashtagHighlight';
import ConfirmModal from '@/components/common/modals/ConfirmModal';

const CreateFeed: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const [postText, setPostText] = useState("");
    const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyPostType>(PrivacyPostType.Public);
    const { images, isUploading, setIsUploading, addImages, addAudioItem, removeImage, reorderImages, clearImages } = useImageUploadState();
    const {
        audioBlob,
        audioDuration,
        audioServerUrl,
        audioFilename,
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
        handleAudioRecorded(blob, duration, serverUrl, filename);
        if (serverUrl && filename) {
            addAudioItem(blob, filename, serverUrl, filename);
        }
    }, [handleAudioRecorded, addAudioItem]);

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
    const createPostMutation = useCreatePost();
    const { user } = useAuthStore()

    useAutoResizeTextarea(textareaRef, postText);

    const hasUnsavedChanges = useMemo(() => {
        return (postText && postText.trim().length > 0) || images.length > 0 || !!audioBlob;
    }, [postText, images.length, audioBlob]);

    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const unblockRef = useRef<null | (() => void)>(null);
    const nextLocationRef = useRef<any>(null);

    // Warn on browser/tab close or refresh
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    // Block in-app route changes when there are unsaved changes
    useEffect(() => {
        // Clear previous block
        if (unblockRef.current) {
            unblockRef.current();
            unblockRef.current = null;
        }
        if (hasUnsavedChanges) {
            unblockRef.current = history.block((location: any, action: any) => {
                setShowLeaveConfirm(true);
                nextLocationRef.current = { location, action };
                return false; // cancel navigation
            });
        }
        return () => {
            if (unblockRef.current) {
                unblockRef.current();
                unblockRef.current = null;
            }
        };
    }, [hasUnsavedChanges, history]);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const privacy = urlParams.get('privacy');
        if (privacy) {
            const privacyValue = parseInt(privacy);
            if (Object.values(PrivacyPostType).includes(privacyValue)) {
                setSelectedPrivacy(privacyValue as PrivacyPostType);
            }
        }
    }, [location.search]);

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

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowLeaveConfirm(true);
        } else {
            history.goBack();
        }
    };
    const handlePost = async () => {
        if (!postText.trim() && images.length === 0 && !audioBlob) {
            return;
        }
        // Do not allow posting while any media is still uploading
        if (isUploading || audioUploadMutation.isLoading || images.some((item: any) => item?.isUploading)) {
            return;
        }

        setIsUploading(true);

        try {
            const mediaFilenames = images
                .filter(item => item.serverName || item.serverUrl || item.filename)
                .map(item => {
                    if (item.serverName) {
                        return item.serverName;
                    } else if (item.filename) {
                        return item.filename;
                    } else if (item.serverUrl) {
                        const urlParts = item.serverUrl.split('/');
                        return urlParts[urlParts.length - 1];
                    }
                    return '';
                })
                .filter(filename => filename);
            const allMediaFilenames = [...mediaFilenames];
            if (audioFilename && !images.some(item => item.mediaType === 'audio')) {
                allMediaFilenames.push(audioFilename);
            }

            const hashtags = postText.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];

            await createPostMutation.mutateAsync({
                content: postText.trim(),
                mediaFilenames: allMediaFilenames.length > 0 ? allMediaFilenames : undefined,
                hashtags: hashtags.length > 0 ? hashtags : undefined,
                privacy: Number(selectedPrivacy)
            });
            // Unblock route guard and clear draft BEFORE navigating to avoid 'Leaving?' popup
            if (unblockRef.current) {
                unblockRef.current();
                unblockRef.current = null;
            }
            setPostText('');
            clearImages();
            clearAudio();
            history.goBack();

        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setIsUploading(false);
        }
    };
    return (
        <div className="h-[100dvh] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-start p-4 border-b border-netural-50 gap-6 flex-shrink-0">
                <button
                    onClick={handleClose}
                >
                    <CloseIcon />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">{t("New post")}</h1>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
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
                            {/* <span className="text-lg">
                                {selectedPrivacyOption?.icon}
                            </span> */}
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

                {audioBlob && (
                    <AudioRecorder
                        onAudioRecorded={handleAudioRecordedWithImageItem}
                        onRemoveAudio={handleRemoveAudioWithImageItem}
                        audioBlob={audioBlob}
                        duration={audioDuration}
                        serverUrl={audioServerUrl}
                        isUploading={isAudioUploading || audioUploadMutation.isLoading}
                        className=""
                        showAsButton={false}
                        audioUploadMutation={audioUploadMutation}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-netural-50 p-4 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {
                            !images.some(item => item.mediaType === 'audio') &&
                            <>
                                {!isRecording && (
                                    <>
                                        <button
                                            onClick={handleGallerySelect}
                                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                                            title={t("Select from Gallery")}
                                            disabled={!!audioBlob}
                                        >
                                            <ImageIcon />
                                        </button>
                                        <button
                                            onClick={handleCameraCapture}
                                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                                            title={t("Take Photo")}
                                            disabled={!!audioBlob}
                                        >
                                            <CamIcon />
                                        </button>
                                    </>
                                )}
                            </>
                        }

                        {
                            !images.some(item => item.mediaType === 'image') &&
                            <>
                                <AudioRecorder
                                    onAudioRecorded={handleAudioRecordedWithImageItem}
                                    onRemoveAudio={handleRemoveAudioWithImageItem}
                                    audioBlob={audioBlob || undefined}
                                    duration={audioDuration}
                                    serverUrl={audioServerUrl}
                                    isUploading={isAudioUploading || audioUploadMutation.isLoading}
                                    className=""
                                    showAsButton={true}
                                    audioUploadMutation={audioUploadMutation}
                                    onRecordingStateChange={setIsRecording}
                                />
                            </>
                        }

                    </div>

                    <div className="flex flex-col items-end space-y-2">
                        {(isUploading || audioUploadMutation.isLoading) && (
                            <div className="text-sm text-blue-600 font-medium">
                                {audioUploadMutation.isLoading && t("Uploading...")}
                                {isUploading && !isAudioUploading && t("Uploading...")}
                                {isUploading && isAudioUploading && t("Uploading...")}
                            </div>
                        )}
                        {!isRecording && (
                            <ActionButton
                                onClick={handlePost}
                                disabled={(!postText.trim() && images.length === 0 && !audioBlob) || isUploading || audioUploadMutation.isLoading}
                                loading={createPostMutation.isLoading || isUploading || audioUploadMutation.isLoading}
                                className="px-3 py-2 text-sm bg-main flex items-center justify-center gap-2 text-white rounded-2xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {createPostMutation.isLoading ? t("Posting...") : t("Post")}
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
                <PrivacyBottomSheet
                    isOpen={isPrivacyModalOpen}
                    closeModal={() => setIsPrivacyModalOpen(false)}
                    selectedPrivacy={selectedPrivacy}
                    onSelectPrivacy={setSelectedPrivacy}
                />
                <ConfirmModal
                    isOpen={showLeaveConfirm}
                    title={t('Leaving?')}
                    message={t('Your post will not be saved. Are you sure?')}
                    confirmText={t('Yes, leave')}
                    cancelText={t('Cancel')}
                    onConfirm={() => {
                        setShowLeaveConfirm(false);
                        // Optional: clear draft state before leaving
                        setPostText('');
                        clearImages();
                        clearAudio();
                        // Unblock and proceed to intended navigation
                        if (unblockRef.current) {
                            unblockRef.current();
                            unblockRef.current = null;
                        }
                        const next = nextLocationRef.current;
                        nextLocationRef.current = null;
                        if (next) {
                            const { location, action } = next;
                            const path = `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;
                            if (action === 'POP') {
                                history.goBack();
                            } else if (action === 'REPLACE') {
                                history.replace(path);
                            } else {
                                history.push(path);
                            }
                        } else {
                            history.goBack();
                        }
                    }}
                    onClose={() => {
                        setShowLeaveConfirm(false);
                        nextLocationRef.current = null;
                    }}
                />
            </div>
        </div>
    );
};

export default CreateFeed;
