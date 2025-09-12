import React from 'react';
import { ChatMessage } from '@/types/social-chat';
import { useTranslation } from 'react-i18next';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg";

interface MessageStatusProps {
    message: ChatMessage;
    isGroup: boolean;
    currentUserId: number | null;
    isLastUserMessage?: boolean;
    isLastMessageInConversation?: boolean;
    isSendingMessage?: boolean;
    activeUserIds?: number[];
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message, isGroup, currentUserId, isLastUserMessage = false, isLastMessageInConversation = false, isSendingMessage = false, activeUserIds = [] }) => {
    const { t } = useTranslation();

    if (message.userId !== currentUserId) {
        return null;
    }

    const getMessageStatus = () => {
        if (message.isError) {
            return 'failed';
        }

        if (message.tempId && (message.id === undefined || message.id === null)) {
            return 'sending';
        }
        
        if (isSendingMessage && isLastUserMessage && message.tempId && (message.id === undefined || message.id === null)) {
            return 'sending';
        }

        const hasUploadingAttachments = message.chatAttachments?.some(att =>
            (att as any).isUploading || (att as any).isSending
        );
        if (hasUploadingAttachments) {
            return 'sending';
        }

        if (isGroup) {
            const readUsers = (message.userHasRead || []).filter(user => user.userId !== currentUserId);
            if (readUsers.length > 0) {
                return 'seen';
            }

            return isLastMessageInConversation ? 'sent' : null;
        } else {
            const readUsers = (message.userHasRead || []).filter(user => user.userId !== currentUserId);
            const otherUserRead = readUsers.length > 0;

            if (otherUserRead) {
                return 'seen';
            }

            return isLastMessageInConversation ? 'sent' : null;
        }
    };

    const status = getMessageStatus();
    const renderStatus = () => {
        switch (status) {
            case 'sending':
                return (
                    <span className="text-xs text-gray-400">
                        {t('Sending...')}
                    </span>
                );

            case 'failed':
                return (
                    <span className="text-xs text-red-500">
                        {t('Failed')}
                    </span>
                );

            case 'sent':
                return (
                    <span className="text-xs text-gray-500">
                        {t('Sent')}
                    </span>
                );

            case 'seen':
                if (isGroup) {
                    const readUsers = (message.userHasRead || []).filter(user => user.userId !== currentUserId) || [];
                    const activeUsersExcludingMe = activeUserIds.filter(userId => userId !== currentUserId);
                    const allSeenUsers = [...readUsers];
                    activeUsersExcludingMe.forEach(activeUserId => {
                        const alreadyRead = readUsers.some(user => user.userId === activeUserId);
                        if (!alreadyRead) {
                            allSeenUsers.push({
                                userId: activeUserId,
                                userName: `User ${activeUserId}`,
                                userAvatar: null,
                                readTime: new Date().toISOString()
                            });
                        }
                    });

                    const visibleUsers = allSeenUsers.slice(0, 3);
                    const remainingCount = allSeenUsers.length - 3;

                    return (
                        <div className="flex items-center">
                            <div className="flex items-center -space-x-1">
                                {visibleUsers.map((user) => (
                                    <div
                                        key={user.userId}
                                        className="w-[18px] h-[18px] rounded-lg border border-white bg-gray-200 overflow-hidden"
                                        title={user.userName}
                                    >
                                        {/* {user.userAvatar ? ( */}
                                        <img
                                            src={user?.userAvatar || avatarFallback}
                                            alt={user?.userName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = avatarFallback;
                                            }}
                                        />
                                        {/* ) : (
                                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                                                {user.userName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )} */}
                                    </div>
                                ))}
                                {remainingCount > 0 && (
                                    <div className="w-[18px] h-[18px] rounded-lg p-1 border border-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                                        +{remainingCount}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                } else {
                    const readUsers = (message.userHasRead || []).filter(user => user.userId !== currentUserId) || [];
                    const otherUserRead = readUsers.find(user => user.userId !== currentUserId);
                    const otherUserActive = activeUserIds.find(userId => userId !== currentUserId);

                    if (otherUserRead) {
                        return (
                            <div className="flex items-center">
                                <div className="w-[18px] h-[18px] rounded-lg border border-white bg-gray-200 overflow-hidden" title={otherUserRead.userName}>
                                    {/* {otherUserRead.userAvatar ? ( */}
                                        <img
                                            src={otherUserRead?.userAvatar || avatarFallback}
                                            alt={otherUserRead?.userName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = avatarFallback;
                                            }}
                                        />
                                    {/* ) : (
                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                                            {otherUserRead.userName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        );
                    } else if (otherUserActive) {
                        return (
                            <div className="flex items-center">
                                <div className="w-[18px] h-[18px] rounded-lg border border-white bg-blue-500 flex items-center justify-center" title="Active">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            </div>
                        );
                    }

                    return null;
                }

            case null:
                return null;

            default:
                return null;
        }
    };

    // Nếu không có status để hiển thị, không render gì cả
    if (!status) return null;

    return (
        <div className="flex items-center justify-end mt-1">
            {renderStatus()}
        </div>
    );
};

export default MessageStatus;
