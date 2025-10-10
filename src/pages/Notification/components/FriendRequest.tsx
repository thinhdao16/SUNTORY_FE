import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSkeletonText } from '@ionic/react';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded.svg';
import {
    acceptFriendRequest,
    rejectFriendRequest
} from '@/services/social/social-partner-service';
import { useHistory } from 'react-router-dom';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useFriendshipReceivedRequests } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useSocialSignalR } from '@/hooks/useSocialSignalR';
import useDeviceInfo from '@/hooks/useDeviceInfo';

interface FriendRequestItem {
    id: number;
    fromUserId: number;
    toUserId: number;
    status: number;
    inviteStatus: number;
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

const FriendRequest: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();

    const [displayedRequests, setDisplayedRequests] = useState<FriendRequestItem[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const pageSize = 10;
    const {
        notificationCounts,
        friendRequestOptimistic,
        setFriendRequestOptimistic,
        removeFriendRequestOptimistic,
        pruneExpiredFriendRequestOptimistic,
    } = useSocialChatStore();

    const {
        data,
        refetch
    } = useFriendshipReceivedRequests(20);
    const requests = data?.pages.flat() ?? [];
    const prevFriendRequestCount = useRef(notificationCounts.pendingFriendRequestsCount);
    const deviceInfo = useDeviceInfo();

    useSocialSignalR(deviceInfo.deviceId ?? "", {
        roomId: "",
        refetchRoomData: () => { },
        autoConnect: true,
        enableDebugLogs: false,
    });
    const handleLoadMore = () => {
        if (loadingMore) return;
        
        setLoadingMore(true);
        setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setLoadingMore(false);
        }, 500);
    };

    useEffect(() => {
        const currentCount = notificationCounts.pendingFriendRequestsCount;
        const previousCount = prevFriendRequestCount.current;
        if (previousCount !== currentCount && previousCount !== undefined && currentCount > previousCount) {
            refetch();
        }
        prevFriendRequestCount.current = currentCount;
    }, [notificationCounts.pendingFriendRequestsCount, refetch]);

    useEffect(() => {
        const baseList = showAll ? requests : requests.slice(0, currentPage * pageSize);
        const now = Date.now();
        const pinnedList: FriendRequestItem[] = Object.values(friendRequestOptimistic || {})
            .filter((e: any) => !e.expiresAt || e.expiresAt > now)
            .map((e: any) => e.item as FriendRequestItem);

        setDisplayedRequests(() => {
            const baseIds = new Set(baseList.map(r => r.id));
            const pinnedMap = new Map(pinnedList.map(p => [p.id, p]));
            const mergedBase = baseList.map(item => pinnedMap.get(item.id) ?? item);
            const pinnedNotInBase = pinnedList.filter(p => !baseIds.has(p.id));
            const combined = [...pinnedNotInBase, ...mergedBase];
            return showAll ? combined : combined.slice(0, currentPage * pageSize);
        });
    }, [data, showAll, friendRequestOptimistic, currentPage, pageSize]);

    useEffect(() => {
        const id = setInterval(() => {
            pruneExpiredFriendRequestOptimistic();
        }, 30000);
        return () => clearInterval(id);
    }, [pruneExpiredFriendRequestOptimistic]);


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
        
        setDisplayedRequests(prev => {
            const found = prev.find(r => r.id === requestId);
            if (found) {
                const updated = { ...found, inviteStatus: 20 as number };
                setFriendRequestOptimistic(updated, 180);
                return prev.map(request => request.id === requestId ? updated : request);
            }
            return prev;
        });
        
        try {
            await acceptFriendRequest(requestId);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            removeFriendRequestOptimistic(requestId);
            setDisplayedRequests(prev => 
                prev.map(request => 
                    request.id === requestId 
                        ? { ...request, inviteStatus: 10 }
                        : request
                )
            );
        }
    };

    const handleDecline = async (requestId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        
        setDisplayedRequests(prev => {
            const found = prev.find(r => r.id === requestId);
            if (found) {
                const updated = { ...found, inviteStatus: 30 as number };
                setFriendRequestOptimistic(updated, 180);
                return prev.map(request => request.id === requestId ? updated : request);
            }
            return prev;
        });
        
        try {
            await rejectFriendRequest(requestId);
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            removeFriendRequestOptimistic(requestId);
            setDisplayedRequests(prev => 
                prev.map(request => 
                    request.id === requestId 
                        ? { ...request, inviteStatus: 10 }
                        : request
                )
            );
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
        if (loadingMore) {
            (event.target as HTMLIonInfiniteScrollElement).complete();
            return;
        }

        setLoadingMore(true);
        setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setLoadingMore(false);
            (event.target as HTMLIonInfiniteScrollElement).complete();
        }, 1000);
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
                    </div>
                    {request.inviteStatus == 10 && (
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                className={`px-6 py-2 bg-blue-600 text-white text-m font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-35`}
                                onClick={(e) => handleAccept(request.id, e)}
                            >
                                {t('Accept')}
                            </button>
                            <button
                                className={`px-6 py-2 bg-gray-200 text-gray-900 text-m font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-35`}
                                onClick={(e) => handleDecline(request.id, e)}
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
        <IonContent className="h-220" style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
            <div className="bg-white pb-20 w-full">
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

                        {!showAll && displayedRequests.length < requests.length && (
                            <div className="px-6 py-4 flex justify-center bg-white">
                                <button
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-black font-semibold text-sm py-4 px-6 rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? t('Loading...') : t('Load more')}
                                </button>
                            </div>
                        )}

                        {requests.length > 0 && showAll && displayedRequests.length < requests.length && (
                            <IonInfiniteScroll
                                onIonInfinite={handleInfiniteScroll}
                                threshold="100px"
                            >
                                <IonInfiniteScrollContent
                                    loadingSpinner="bubbles"
                                    loadingText={loadingMore ? t('Loading...') : t('loading...')}
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