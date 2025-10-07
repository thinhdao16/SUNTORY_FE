import { useState, useEffect, useRef, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSkeletonText } from '@ionic/react';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded-full.svg';
import WaveIcon from '@/icons/logo/social/wave-icon.svg?react';
import { listNotificationApi, Notification } from '@/services/social/social-notification';
import { useModalContext } from '@/contexts/ModalContext';
import NotificationBottomModal from '@/components/common/bottomSheet/NotificationBottomModal';
import { handleTouchStart as handleTouchStartUtil, handleTouchMove as handleTouchMoveUtil, handleTouchEnd as handleTouchEndUtil } from '@/utils/translate-utils';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useNotificationStore } from '@/store/zustand/notify-store';

const NotificationList = () => {
    const history = useHistory();
    const { setHideBottomTabBar } = useModalContext();
    const lastNotificationTime = useNotificationStore((state) => state.lastNotificationTime);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
    const [olderNotifications, setOlderNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(100); // 5 new + 3 older = 8 total
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [maxPages, setMaxPages] = useState(0);
    const [showAll, setShowAll] = useState(false); // Trạng thái hiển thị tất cả
    const [isOpen, setIsOpen] = useState(false);
    const [notificationIds, setNotificationIds] = useState<number[] | null>(null);
    const [isFromHeader, setIsFromHeader] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const screenHeightRef = useRef(window.innerHeight);
    const velocityThreshold = 0.4;

    const handleTouchStart = (e: React.TouchEvent) => {
        handleTouchStartUtil(e, startYRef, startTimeRef);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        handleTouchMoveUtil(e, startYRef, screenHeightRef, setTranslateY);
    };
    const handleTouchEnd = () => {
        handleTouchEndUtil(
            translateY,
            startYRef,
            startTimeRef,
            screenHeightRef,
            velocityThreshold,
            () => setIsOpen(false),
            setTranslateY
        );
    };

    const handleLoadMoreNotifications = async () => {
        if (!loadingMore) {
            const nextPage = page + 1;
            setPageSize(pageSize + 10);
            setPage(nextPage);
            try {
                await loadNotifications(nextPage, true);
                // Chuyển sang mode hiển thị tất cả SAU KHI load xong
                setShowAll(true);
            } catch (error) {
                console.error('Error loading more notifications:', error);
            }
        }
    }

    const loadNotifications = async (currentPage: number, isLoadMore: boolean = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            const response = await listNotificationApi({ pageNumber: currentPage, pageSize });
            const data = response.data || [];
            const totalRecs = response.totalRecords || 0;
            if (data.data.length > 0) {
                if (isLoadMore) {
                    setAllNotifications(prevNotifications => {
                        const existingIds = new Set(prevNotifications.map(notif => notif.id));
                        const newNotifications = data.data.filter((notif: Notification) => !existingIds.has(notif.id));
                        return [...prevNotifications, ...newNotifications];
                    });
                } else {
                    setAllNotifications(data.data);
                }

                const calculatedMaxPages = Math.ceil(totalRecs / pageSize);
                setTotalRecords(totalRecs);
                setMaxPages(calculatedMaxPages);

                const currentTotalLoaded = isLoadMore
                    ? allNotifications.length + data.length
                    : data.length;

                const hasMore = currentTotalLoaded < totalRecs;
                setHasNextPage(hasMore);
            } else {
                if (!isLoadMore) {
                    setHasNextPage(false);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (!isLoadMore) {
                setAllNotifications([]);
            }
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setAllNotifications([]);
        setPage(0);
        loadNotifications(0, false);
    }, [lastNotificationTime]);

    // Cập nhật phân chia New/Older khi allNotifications thay đổi
    useEffect(() => {
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 6 tiếng trước

        const newNotifs = allNotifications.filter((notif: Notification) => {
            // Parse createDate giống như trong formatTimestamp
            let createDate: Date;
            if (notif.createDate.includes('Z') || notif.createDate.includes('+') || notif.createDate.includes('-', 10)) {
                createDate = new Date(notif.createDate);
            } else {
                createDate = new Date(notif.createDate + 'Z');
            }
            return createDate >= twelveHoursAgo;
        });

        const olderNotifs = allNotifications.filter((notif: Notification) => {
            // Parse createDate giống như trong formatTimestamp
            let createDate: Date;
            if (notif.createDate.includes('Z') || notif.createDate.includes('+') || notif.createDate.includes('-', 10)) {
                createDate = new Date(notif.createDate);
            } else {
                createDate = new Date(notif.createDate + 'Z');
            }
            return createDate < twelveHoursAgo;
        });

        // Giới hạn: tổng 8 notifications (ưu tiên hiển thị toàn bộ new trước, phần còn lại là older)
        if (!showAll) {
            const maxTotal = 8;
            const newCount = newNotifs.length; // Hiển thị tất cả new
            const olderCount = Math.max(0, maxTotal - newCount); // Lấy phần còn lại từ older
            
            setNewNotifications(newNotifs.slice(0, maxTotal)); // Nếu new > 8 thì chỉ lấy 8
            setOlderNotifications(olderNotifs.slice(0, olderCount));
        } else {
            setNewNotifications(newNotifs);
            setOlderNotifications(olderNotifs);
        }
    }, [allNotifications, showAll]);

    const formatTimestamp = (createDate: string): string => {
        const now = new Date();

        // Nếu createDate không có timezone info (Z hoặc +XX:XX), coi như là UTC
        let timestamp: Date;
        if (createDate.includes('Z') || createDate.includes('+') || createDate.includes('-', 10)) {
            // Có timezone info, parse bình thường
            timestamp = new Date(createDate);
        } else {
            // Không có timezone info, thêm 'Z' để parse như UTC
            timestamp = new Date(createDate + 'Z');
        }

        const diffInMs = now.getTime() - timestamp.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        // Nếu là ngày trong tương lai hoặc vừa mới, hiển thị "Now"
        if (diffInMinutes < 0) return 'Now';
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

    const getActionText = (type: number): string => {
        switch (type) {
            case 10: return 'created a new post';
            case 20: return 'updated a post';
            case 25: return 'deleted a post';
            case 30: return 'liked your post';
            case 40: return 'unliked your post';
            case 45: return 'reposted your post';
            case 47: return 'shared your post';
            case 50: return 'commented on your post';
            case 60: return 'updated a comment';
            case 70: return 'deleted a comment';
            case 80: return 'liked your comment';
            case 90: return 'unliked your comment';
            case 100: return 'sent you a friend request';
            case 110: return 'accepted your friend request';
            case 120: return 'replied to your comment';
            default: return 'performed an action';
        }
    };
    const handleNavigate = (type: number, id?: number, code?: string) => {
        switch (type) {
            case 10: return `/social-feed/f/${code}`;
            case 20: return `/social-feed/f/${code}`;
            case 30: return `/social-feed/f/${code}`;
            case 40: return `/social-feed/f/${code}`;
            case 50: return `/social-feed/f/${code}`;
            case 60: return `/social-feed/f/${code}`;
            case 70: return `/social-feed/f/${code}`;
            case 80: return `/social-feed/f/${code}`;
            case 90: return `/social-feed/f/${code}`;
            case 100: return `/profile/${id}`;
            case 110: return `/profile/f/${id}`;
            case 120: return `/social-feed/f/${code}`;
            default: return '';
        }
    }

    const handleInfiniteScroll = async (event: CustomEvent<void>) => {
        if (!loadingMore && hasNextPage && page + 1 < maxPages) {
            const nextPage = page + 1;
            setPage(nextPage);

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadNotifications(nextPage, true);
            } catch (error) {
                setHasNextPage(false);
            }
        } else {
            if (allNotifications.length >= totalRecords) {
                setHasNextPage(false);
            }
        }

        (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center p-4 border-b border-gray-100 h-[90px]">
                    <div className="flex-shrink-0 mr-3">
                        <IonSkeletonText animated style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <IonSkeletonText animated style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
                                <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <IonSkeletonText animated style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderNotificationItem = (notification: Notification) => (
        <div
            key={notification.id}
            className={`flex items-center px-4 py-4 border-b border-gray-200 min-h-[78px] ${!notification.isRead ? 'bg-[#EDF1FC]' : 'bg-white'
                }`}
            onClick={() => {
                history.push(handleNavigate(notification.type, notification.actorId, notification?.postCode || ''));
                setIsOpen(true);
                setNotificationIds([notification.id]);
            }}
        >
            <div className="flex-shrink-0 mr-3">
                <img
                    className="w-14 h-14 rounded-2xl"
                    src={notification.actorAvatar || avatarFallback}
                    alt={notification.actorName}
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-m text-black">
                            <span className="font-semibold">{notification.actorName}</span>{' '}
                            <span className="text-black">{getActionText(notification.type)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(notification.createDate)}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded-full" onClick={(e) => {
                            e.stopPropagation();
                            setIsFromHeader(false);
                            setIsOpen(true);
                            setNotificationIds([notification.id]);
                        }}>
                            <WaveIcon className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <IonContent className="h-full" style={{ '--background': 'white', '--ion-background-color': 'white', '--padding-start': '0', '--padding-end': '0', '--padding-top': '0', '--padding-bottom': '0' } as any}>
            <div className="bg-white pb-24 w-full">
                {isLoading ? (
                    renderSkeleton()
                ) : (
                    <>
                        {showAll ? (
                            // Hiển thị tất cả notification không phân chia
                            <div className="bg-white">
                                {allNotifications.map(renderNotificationItem)}
                            </div>
                        ) : (
                            <>
                                {/* New Notifications */}
                                {newNotifications.length > 0 && (
                                    <div className="bg-white">
                                        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                                            <h3 className="text-[14px] font-semibold text-black">New</h3>
                                            <WaveIcon className="w-5 h-5 text-gray-400" onClick={(e) => {
                                                e.stopPropagation();
                                                setIsFromHeader(true);
                                                setIsOpen(true);
                                                setNotificationIds(newNotifications.filter(notif => !notif.isRead).map(notif => notif.id));
                                            }}/>
                                        </div>
                                        {newNotifications.map(renderNotificationItem)}
                                    </div>
                                )}

                                {/* Older Notifications */}
                                {olderNotifications.length > 0 && (
                                    <div className="bg-white">
                                        <div className="px-4 py-3 bg-white border-b border-gray-200">
                                            <h3 className="text-[14px] font-semibold text-black">Older</h3>
                                        </div>
                                        {olderNotifications.map(renderNotificationItem)}
                                    </div>
                                )}

                                {/* Empty State */}
                                {newNotifications.length === 0 && olderNotifications.length === 0 && !isLoading && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm">No notifications yet</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Loading More Indicator */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-gray-500 text-sm">{t('loading...')}</span>
                                </div>
                            </div>
                        )}

                        {/* See Previous Notifications Button - chỉ hiển thị khi chưa showAll */}
                        {!showAll && (newNotifications.length > 0 || olderNotifications.length > 0) && (
                            <div className="px-6 py-4 flex justify-center bg-white">
                                <button
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-black font-semibold text-sm py-4 px-6 rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        handleLoadMoreNotifications();
                                    }}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? t('Loading...') : t('See previous notifications')}
                                </button>
                            </div>
                        )}

                        {/* Infinite Scroll */}
                        {allNotifications.length > 0 && showAll && (
                            <IonInfiniteScroll
                                onIonInfinite={handleInfiniteScroll}
                                threshold="100px"
                                disabled={!hasNextPage || loadingMore}
                                className="pb-16"
                            >
                                <IonInfiniteScrollContent
                                    loadingSpinner="bubbles"
                                    loadingText={t('loading...')}
                                />
                            </IonInfiniteScroll>
                        )}
                    </>
                )}
            </div>
            <NotificationBottomModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                notificationIds={notificationIds}
                translateY={translateY}
                handleMarkAsRead={() => {
                    allNotifications.filter((notif: Notification) => notificationIds?.includes(notif.id)).forEach((notif: Notification) => {
                        notif.isRead = true;
                    });
                }}
                handleDelete={() => {
                    allNotifications.splice(allNotifications.findIndex((notif: Notification) => notificationIds?.includes(notif.id)), 1);
                    newNotifications.splice(newNotifications.findIndex((notif: Notification) => notificationIds?.includes(notif.id)), 1);
                    olderNotifications.splice(olderNotifications.findIndex((notif: Notification) => notificationIds?.includes(notif.id)), 1);
                }}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                onModalStateChange={(modalOpen) => {
                    setHideBottomTabBar(modalOpen);
                }}
                isFromHeader={isFromHeader}
            />
        </IonContent>
    );
};

export default NotificationList;