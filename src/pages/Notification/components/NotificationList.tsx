import { useState, useEffect, useRef } from 'react';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonSkeletonText } from '@ionic/react';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded.svg';
import WaveIcon from '@/icons/logo/social/wave-icon.svg?react';
import { listNotificationApi, Notification } from '@/services/social/social-notification';
import { useModalContext } from '@/contexts/ModalContext';
import NotificationBottomModal from '@/components/common/bottomSheet/NotificationBottomModal';
import { handleTouchStart as handleTouchStartUtil, handleTouchMove as handleTouchMoveUtil, handleTouchEnd as handleTouchEndUtil } from '@/utils/translate-utils';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useNotificationStore } from '@/store/zustand/notify-store';
import { readNotificationApi, ReadNotificationParams } from "@/services/social/social-notification";
import { useTranslation } from 'react-i18next';
import { formatTimeFromNow } from '@/utils/formatTime';

const NotificationList = ({ isReadAll,refreshKey }: { isReadAll: boolean,refreshKey: number }) => {
    const history = useHistory();
    const { setHideBottomTabBar } = useModalContext();
    const lastNotificationTime = useNotificationStore((state) => state.lastNotificationTime);
    const { t } = useTranslation();
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
    const [olderNotifications, setOlderNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const pageSize = 100; 
    const [hasNextPage, setHasNextPage] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [notificationIds, setNotificationIds] = useState<number[] | null>(null);
    const [isFromHeader, setIsFromHeader] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const screenHeightRef = useRef(window.innerHeight);
    const velocityThreshold = 0.4;
    const didInitRef = useRef(false);

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
    const handleMarkAsRead = async (id: number) => {
        const payload: ReadNotificationParams = {
            ids: [id],
            isAll: isReadAll
        };
        await readNotificationApi(payload);
        setAllNotifications(allNotifications.map((notif: Notification) => notif.id === id ? { ...notif, isRead: true } : notif));
        setNewNotifications(newNotifications.map((notif: Notification) => notif.id === id ? { ...notif, isRead: true } : notif));
        setOlderNotifications(olderNotifications.map((notif: Notification) => notif.id === id ? { ...notif, isRead: true } : notif));
    };

    const handleLoadMoreNotifications = async () => {
        if (!loadingMore) {
            setShowAll(true);
            if (allNotifications.length > 0) {
                return;
            }
            
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await loadNotifications(nextPage, true);
            } catch (error) {
                console.error('Error loading more notifications:', error);
            }
        }
    }

    const loadNotifications = async (currentPage: number, isLoadMore: boolean = false, silent: boolean = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else if (!silent) {
                setIsLoading(true);
            }
            
            const response = await listNotificationApi({ pageNumber: currentPage, pageSize });
            const responseData = response?.data || {};
            const totalRecs = responseData?.totalRecords || 0;
            const notifications = responseData?.data || [];

            if (notifications.length > 0) {
                if (isLoadMore) {
                    setAllNotifications(prevNotifications => {
                        const existingIds = new Set(prevNotifications.map(notif => notif.id));
                        const newNotifications = notifications.filter((notif: Notification) => !existingIds.has(notif.id));
                        const updatedNotifications = [...prevNotifications, ...newNotifications];

                        const hasMore = updatedNotifications.length < totalRecs;
                        setHasNextPage(hasMore);

                        return updatedNotifications;
                    });
                } else if (silent) {
                    setAllNotifications(prev => {
                        const seen = new Set<number>();
                        const merged: Notification[] = [];
                        for (const n of notifications) {
                            if (!seen.has(n.id)) { merged.push(n); seen.add(n.id); }
                        }
                        for (const p of prev) {
                            if (!seen.has(p.id)) { merged.push(p); seen.add(p.id); }
                        }
                        setHasNextPage(merged.length < totalRecs);
                        return merged;
                    });
                } else {
                    setAllNotifications(notifications);
                    const hasMore = notifications.length < totalRecs;
                    setHasNextPage(hasMore);
                }
            } else {
                if (!silent) setIsLoading(false);
                if (!isLoadMore) {
                    setHasNextPage(false);
                }
            }
        } catch (error) {
            if (!isLoadMore) {
                setAllNotifications([]);
            }
        } finally {
            if (isLoadMore) {
                setLoadingMore(false);
            } else {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const firstLoad = !didInitRef.current;
        didInitRef.current = true;
        setPage(0);
        loadNotifications(0, false, !firstLoad);
    }, [lastNotificationTime]);

    useEffect(() => {
        if (allNotifications.length > 0) {
            setIsLoading(false);
        }
    }, [allNotifications.length]);

    useEffect(() => {
        if (!showAll || !hasNextPage || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    handleInfiniteScroll({ target: { complete: () => {} } } as any);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px'
            }
        );

        const lastElement = document.querySelector('.notification-item:last-child');
        if (lastElement) {
            observer.observe(lastElement);
        }

        return () => {
            observer.disconnect();
        };
    }, [showAll, hasNextPage, loadingMore, allNotifications.length]);

    useEffect(() => {
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

        const newNotifs = allNotifications.filter((notif: Notification) => {
            let createDate: Date;
            if (notif.createDate.includes('Z') || notif.createDate.includes('+') || notif.createDate.includes('-', 10)) {
                createDate = new Date(notif.createDate);
            } else {
                createDate = new Date(notif.createDate + 'Z');
            }
            return createDate >= twelveHoursAgo;
        });

        const olderNotifs = allNotifications.filter((notif: Notification) => {
            let createDate: Date;
            if (notif.createDate.includes('Z') || notif.createDate.includes('+') || notif.createDate.includes('-', 10)) {
                createDate = new Date(notif.createDate);
            } else {
                createDate = new Date(notif.createDate + 'Z');
            }
            return createDate < twelveHoursAgo;
        });

        if (!showAll) {
            const maxTotal = 8;
            const newCount = newNotifs.length;
            const olderCount = Math.max(0, maxTotal - newCount);

            setNewNotifications(newNotifs.slice(0, maxTotal));
            setOlderNotifications(olderNotifs.slice(0, olderCount));
        } else {
            setNewNotifications(newNotifs);
            setOlderNotifications(olderNotifs);
        }
    }, [allNotifications, showAll]);

    useEffect(() => {
        if (isReadAll) {
            setAllNotifications(allNotifications.map((notif: Notification) => ({ ...notif, isRead: true })));
            setNewNotifications(newNotifications.map((notif: Notification) => ({ ...notif, isRead: true })));
            setOlderNotifications(olderNotifications.map((notif: Notification) => ({ ...notif, isRead: true })));
        }
    }, [isReadAll]);
    const formatTimestamp = (createDate: string): string => {
        const iso = (createDate.includes('Z') || createDate.includes('+') || createDate.includes('-', 10))
            ? createDate
            : createDate + 'Z';
        return formatTimeFromNow(iso, t);
    };

    const getActionText = (type: number): string => {
        switch (type) {
            case 10: return t('created a new post');
            case 20: return t('updated a post');
            case 25: return t('deleted a post');
            case 30: return t('liked your post');
            case 40: return t('unliked your post');
            case 45: return t('reposted your post');
            case 47: return t('shared your post');
            case 50: return t('commented on your post');
            case 60: return t('updated a comment');
            case 70: return t('deleted a comment');
            case 80: return t('liked your comment');
            case 90: return t('unliked your comment');
            case 100: return t('sent you a friend request');
            case 110: return t('accepted your friend request');
            case 120: return t('replied to your comment');
            default: return t('performed an action');
        }
    };
    const handleNavigate = (type: number, id?: number, code?: string) => {
        switch (type) {
            case 10: return `/social-feed/f/${code}`;
            case 20: return `/social-feed/f/${code}`;
            case 30: return `/social-feed/f/${code}`;
            case 40: return `/social-feed/f/${code}`;
            case 45: return `/social-feed/f/${code}`;
            case 47: return `/social-feed/f/${code}`;
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
        
        if (!loadingMore && hasNextPage) {
            const nextPage = page + 1;
            setPage(nextPage);

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadNotifications(nextPage, true);
            } catch (error) {
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
                    className={`notification-item flex items-center px-4 py-4 border-b border-gray-200 min-h-[78px] ${!notification.isRead ? 'bg-[#EDF1FC]' : 'bg-white'
                        }`}
                    onClick={() => {
                        history.push(handleNavigate(notification.type, notification.actorId, notification?.postCode || ''));
                        handleMarkAsRead(notification.id);
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
                        <div className="text-m text-black flex gap-1">
                            <div className="font-semibold overflow-hidden max-w-[60px] truncate ">{notification.actorName}</div>
                            <span className="text-black">{getActionText(notification.type)}</span>
                        </div>
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
        <IonContent className="h-[92%]" style={{ '--background': 'white', '--ion-background-color': 'white', '--padding-start': '0', '--padding-end': '0', '--padding-top': '0', '--padding-bottom': '0' } as any}>
            <div className="bg-white pb-24 w-full">
                {isLoading ? (
                    renderSkeleton()
                ) : (
                    <>
                        {showAll ? (
                            <div className="bg-white">
                                {allNotifications.map(renderNotificationItem)}
                            </div>
                        ) : (
                            <>
                                {newNotifications.length > 0 && (
                                    <div className="bg-white">
                                        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                                            <h3 className="text-[14px] font-semibold text-black">{t('New')}</h3>
                                        </div>
                                        {newNotifications.map(renderNotificationItem)}
                                    </div>
                                )}

                                {olderNotifications.length > 0 && (
                                    <div className="bg-white">
                                        <div className="px-4 py-3 bg-white border-b border-gray-200">
                                            <h3 className="text-[14px] font-semibold text-black">{t('Older')}</h3>
                                        </div>
                                        {olderNotifications.map(renderNotificationItem)}
                                    </div>
                                )}

                                {newNotifications.length === 0 && olderNotifications.length === 0 && !isLoading && (
                                    <div className="flex flex-col items-center justify-center py-2 bg-[#EDF1FC]">
                                        <p className="text-black text-sm">{t('No notifications')}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-gray-500 text-sm">{t('loading...')}</span>
                                </div>
                            </div>
                        )}

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
                    setHideBottomTabBar(modalOpen || false);
                }}
                isFromHeader={isFromHeader}
            />
        </IonContent>
    );
};

export default NotificationList;