import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFriendshipRecommended, useSendFriendRequest, useCancelFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useToastStore } from '@/store/zustand/toast-store';

interface FriendSuggestionsProps {
    title?: string;
    pageSize?: number;
    onDismiss?: () => void;
    className?: string;
}

export const FriendSuggestions: React.FC<FriendSuggestionsProps> = ({
    title,
    pageSize = 8,
    onDismiss,
    className = ''
}) => {
    const { t } = useTranslation();
    const showToast = useToastStore((s) => s.showToast);
    const { data: users = [], isLoading, refetch } = useFriendshipRecommended(pageSize);

    const sendRequest = useSendFriendRequest(showToast, () => { void refetch(); });
    const cancelRequest = useCancelFriendRequest(showToast, () => { void refetch(); });
    const acceptRequest = useAcceptFriendRequest(showToast, () => { void refetch(); });
    const rejectRequest = useRejectFriendRequest(showToast, () => { void refetch(); });

    if (isLoading || !users || users.length === 0) return null;

    return (
        <div className={`bg-white rounded-2xl border border-neutral-100 shadow-sm ${className}`}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                    {title || t('Suggested for you')}
                </h3>
                {onDismiss && (
                    <button
                        aria-label="Dismiss suggestions"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={onDismiss}
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="px-3 pb-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {users.map((user: any) => {
                        const reqId = user?.friendRequest?.id ?? user?.friendRequestId;
                        return (
                            <div key={user?.id} className="min-w-[180px] max-w-[180px] bg-white border border-neutral-100 rounded-xl p-3">
                                <div className="flex flex-col items-center text-center">
                                    <img
                                        src={user?.avatar || '/favicon.png'}
                                        alt={user?.fullName || 'User'}
                                        className="w-20 h-20 rounded-full object-cover mb-2"
                                    />
                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{user?.fullName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{t('Suggested for you')}</div>

                                    <div className="mt-3 w-full">
                                        {!user?.isFriend && (
                                            user?.isRequestSender ? (
                                                <button
                                                    className="w-full text-sm border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50"
                                                    onClick={() => reqId && cancelRequest.mutate(reqId)}
                                                >
                                                    {t('Request sent')}
                                                </button>
                                            ) : !user?.friendRequest ? (
                                                <button
                                                    className="w-full text-sm bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700"
                                                    onClick={() => user?.id && sendRequest.mutate(user.id)}
                                                >
                                                    {t('Add friend')}
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="flex-1 text-sm bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700"
                                                        onClick={() => reqId && acceptRequest.mutate(reqId)}
                                                    >
                                                        {t('Accept')}
                                                    </button>
                                                    <button
                                                        className="flex-1 text-sm border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50"
                                                        onClick={() => reqId && rejectRequest.mutate(reqId)}
                                                    >
                                                        {t('Reject')}
                                                    </button>
                                                </div>
                                            )
                                        )}
                                        {user?.isFriend && (
                                            <div className="text-xs text-green-600 font-medium py-1.5">{t('Friends')}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
