import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSkeletonText } from '@ionic/react';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded-full.svg';
import {
    acceptFriendRequest,
    rejectFriendRequest
} from '@/services/social/social-partner-service';
import { useHistory } from 'react-router-dom';
import { useNotificationStore } from '@/store/zustand/notify-store';
import { useToastStore } from '@/store/zustand/toast-store';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useFriendshipReceivedRequests } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';

interface FriendRequestItem {
    id: number;
    fromUserId: number;
    toUserId: number;
    status: number; // 0: pending, 1: accepted, 2: rejected
    inviteStatus: number; // 10: pending, 20: accepted, 30: rejected
    createDate: string;
    fromUser: {
        id: number;
        fullName: string;
        firstname: string;
        lastname: string;
        avatar: string;
        code: string;
    };
}

const FriendRequest = (activeTab?: any) => {
    const { t } = useTranslation();
    const history = useHistory();

    const [displayedRequests, setDisplayedRequests] = useState<FriendRequestItem[]>([]);
    const [draftRequests, setDraftRequests] = useState<FriendRequestItem[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
    const { notificationCounts } = useSocialChatStore();
    const {
        data,
        refetch
    } = useFriendshipReceivedRequests(20);

    const prevFriendRequestCount = useRef(notificationCounts.pendingFriendRequestsCount);
    const deviceInfo = useDeviceInfo();

    // Enable real-time SignalR connection
    useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: "",
        refetchRoomData: () => { },
        autoConnect: true,
        enableDebugLogs: false,
    });
    // Use data from React Query instead of local API calls
    const requests = data?.pages.flat() ?? [];
    useEffect(() => {
        const currentCount = notificationCounts.pendingFriendRequestsCount;
        const previousCount = prevFriendRequestCount.current;
        // Only refetch when count increases (new friend request)
        if (previousCount !== currentCount && previousCount !== undefined && currentCount > previousCount) {
            refetch();
        }
        prevFriendRequestCount.current = currentCount;
    }, [notificationCounts.pendingFriendRequestsCount, refetch]);

    // Update displayed requests when showAll changes
    useEffect(() => {
        if (showAll) {
            setDisplayedRequests(requests);
        } else {
            setDisplayedRequests([...displayedRequests, ...requests.slice(0, 6)]);
        }
        refetch();
    }, [showAll, activeTab, data]);

    const formatTimestamp = (createDate: string): string => {
        const now = new Date();
        let timestamp: Date;

        if (createDate.includes('Z') || createDate.includes('+') || createDate.includes('-', 10)) {
            timestamp = new Date(createDate);
        } else {
            timestamp = new Date(createDate + 'Z');
        }

        const diffInMs = now.getTime() - timestamp.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInMinutes < 1) return 'Now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    };

    const handleAccept = async (requestId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const draftRequest = displayedRequests.filter((request: FriendRequestItem) => request.id == requestId)[0];
        draftRequest.inviteStatus = 20;
        setDisplayedRequests([...displayedRequests.map((request: FriendRequestItem) => request.id != requestId ? request : draftRequest)]);
        try {
            await acceptFriendRequest(requestId);
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleDecline = async (requestId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const draftRequest = displayedRequests.filter((request: FriendRequestItem) => request.id == requestId)[0];
        draftRequest.inviteStatus = 30;
        setDisplayedRequests([...displayedRequests.map((request: FriendRequestItem) => request.id != requestId ? request : draftRequest)]);
        try {
            await rejectFriendRequest(requestId);
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    };

    const getStatusText = (status: number): string => {
        switch (status) {
            case 20: return t('Request accepted');
            case 30: return t('Request declined');
            default: return 'has sent you a friend request';
        }
    };

    const handleInfiniteScroll = async (event: CustomEvent<void>) => {
        // React Query handles infinite scroll automatically
        (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center p-4 border-b border-gray-100">
                    <div className="flex-shrink-0 mr-3">
                        <IonSkeletonText animated style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <IonSkeletonText animated style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderRequestItem = (request: FriendRequestItem) => {
        const fullName = request.fromUser?.fullName ||
            `${request.fromUser?.firstname || ''} ${request.fromUser?.lastname || ''}`.trim();
        const isProcessing = processingIds.has(request.id);

        return (
            <div
                key={request.id}
                className="flex items-center px-4 py-4 border-b border-gray-100 w-full"
                onClick={() => {
                    history.push(`/profile/${request.fromUser?.id}`);
                }}
            >
                <div className="flex-shrink-0 mr-3">
                    <img
                        className="w-16 h-16 rounded-2xl object-cover"
                        src={request.fromUser?.avatar || avatarFallback}
                        alt={fullName}
                    />
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-[14px] text-black">
                        <span className="font-semibold">{fullName}</span>{' '}
                        {request.inviteStatus == 10 && (
                            <span className="text-black">{t('has sent you a friend request')}</span>
                        )}
                    </p>
                    {
                        request.inviteStatus == 20 && (
                            <p className="text-[12px] text-gray-500 mt-1">
                                {getStatusText(request.inviteStatus)}
                            </p>
                        )
                    }
                    {
                        request.inviteStatus == 30 && (
                            <p className="text-[12px] text-gray-500 mt-1">
                                {getStatusText(request.inviteStatus)}
                            </p>
                        )
                    }
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                            {formatTimestamp(request.createDate)}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                className="p-1 hover:bg-gray-100 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle ellipsis click
                                }}
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {request.inviteStatus == 10 && (
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                className={`px-6 py-2 bg-blue-600 text-white text-m font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-35`}
                                onClick={(e) => handleAccept(request.id, e)}
                                disabled={isProcessing}
                            >
                                {t('Accept')}
                            </button>
                            <button
                                className={`px-6 py-2 bg-gray-200 text-gray-900 text-m font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-35`}
                                onClick={(e) => handleDecline(request.id, e)}
                                disabled={isProcessing}
                            >
                                {t('Decline')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <IonContent 
            className="h-full" 
            style={{ 
                '--background': 'white', 
                '--ion-background-color': 'white',
                height: '100%',
                maxHeight: 'calc(100vh - 140px)', // Trừ đi space cho header, tabs và bottom sheet
                minHeight: '250px'
            } as any}
        >
            <div 
                className="bg-white pb-6 w-full h-full overflow-y-auto" 
                style={{ 
                    paddingBottom: '120px', // Tăng padding để tránh modal
                    maxHeight: 'calc(100vh - 160px)', // Giảm maxHeight để tránh overlap
                    minHeight: '200px'
                }}
            >
                {!data ? (
                    <div className="h-full flex items-center justify-center">
                        {renderSkeleton()}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {displayedRequests.length > 0 ? (
                            <div className="bg-white flex-1 w-full overflow-x-hidden">
                                {displayedRequests.map(renderRequestItem)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-2 bg-[#EDF1FC]">
                                <p className="text-black text-sm">{t('No new friend requests')}</p>
                            </div>
                        )}

                        {/* See All Button */}
                        {!showAll && requests.length > 6 && (
                            <div className="px-4 py-4 flex justify-center bg-white">
                                <button
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-black font-semibold text-sm py-3 px-6 rounded-full transition-colors duration-200"
                                    onClick={() => setShowAll(true)}
                                >
                                    {t('See all')}
                                </button>
                            </div>
                        )}

                        {/* Infinite Scroll - React Query handles this automatically */}
                        {requests.length > 0 && showAll && (
                            <IonInfiniteScroll
                                onIonInfinite={handleInfiniteScroll}
                                threshold="100px"
                            >
                                <IonInfiniteScrollContent
                                    loadingSpinner="bubbles"
                                    loadingText={t('loading...')}
                                />
                            </IonInfiniteScroll>
                        )}
                    </div>
                )}
            </div>
        </IonContent>
    );
};

export default FriendRequest;