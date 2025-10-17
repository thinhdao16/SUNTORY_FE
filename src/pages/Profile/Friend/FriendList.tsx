import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonSkeletonText, IonInfiniteScroll, IonSearchbar, IonTitle, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthInfo } from '@/pages/Auth/hooks/useAuthInfo';
import { arrowBack, personRemove, chatbubbleOutline, personRemoveOutline } from 'ionicons/icons';
import { getFriendshipFriends, unfriend } from '@/services/social/social-partner-service';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded.svg';
import ConfirmModal from '@/components/common/modals/ConfirmModal';


interface FriendItem {
    id: number;
    name: string;
    code: string;
    avatar: string;
    roomChatId?: number;
    roomChatTitle?: string;
    roomChatCode?: string;
    roomChatAvatar?: string;
    isOnline?: boolean;
}

type ConfirmState = {
    open: boolean;
    type: "cancel" | "unfriend" | null;
    targetId: number | null;
    userName: string;
};

const FriendList: React.FC = () => {
    const history = useHistory();
    const { t } = useTranslation();
    const { data: userInfo, refetch } = useAuthInfo();
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const isFetchingRef = useRef(false);
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        open: false,
        type: null,
        targetId: null,
        userName: ""
    });

    const loadFriends = async (currentPage: number, pageSize: number, searchKeyword: string | null, isLoadMore: boolean = false) => {
        try {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            const apiList: any[] = await getFriendshipFriends(currentPage, pageSize, searchKeyword || undefined);
            const mapped: FriendItem[] = (apiList || []).map((it: any) => ({
                id: Number(it?.id) || 0,
                name: it?.fullName || `${it?.firstname ?? ''} ${it?.lastname ?? ''}`.trim(),
                code: it?.code ?? '',
                avatar: it?.avatar ?? '',
                roomChatId: it?.roomChat?.id,
                roomChatCode: it?.roomChat?.code,
                roomChatTitle: it?.roomChat?.title,
                roomChatAvatar: it?.roomChat?.avatarRoomChat,
                isOnline: Boolean(it?.isOnline)
            }));

            if (mapped.length > 0) {
                if (isLoadMore) {
                    setFriends(prevFriends => {
                        const existingIds = new Set(prevFriends.map(friend => friend.id));
                        const newFriends = mapped.filter((friend: FriendItem) => !existingIds.has(friend.id));
                        return [...prevFriends, ...newFriends];
                    });
                } else {
                    setFriends(mapped);
                }
                // Nếu API trả về ít hơn pageSize => không còn trang tiếp theo
                setHasNextPage(mapped.length === pageSize);
            } else {
                if (!isLoadMore) {
                    setHasNextPage(false);
                }
            }
        } catch (err) {
            console.error('Error loading friends:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        refetch();
        setTotalRecords(userInfo?.friendNumber || 0);
        setPage(0);
    }, []);

    useEffect(() => {
        if (userInfo && typeof (userInfo as any).friendNumber !== 'undefined') {
            setTotalRecords((userInfo as any).friendNumber || 0);
        }
    }, [userInfo]);

    // Debounce input -> searchQuery
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reload list when debounced search changes
    useEffect(() => {
        setPage(0);
        setFriends([]);
        loadFriends(0, pageSize, searchQuery || '', false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const handleBack = () => {
        history.goBack();
    };

    const handleInfiniteScroll = async (event: CustomEvent<void>) => {
        if (!loadingMore && hasNextPage && !isFetchingRef.current) {
            const nextPage = page + 1;
            setPage(nextPage);

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadFriends(nextPage, pageSize, searchQuery, true);
            } catch (error) {
                setHasNextPage(false);
            }
        }

        (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    const handleMessage = (friend: FriendItem) => {
        // Navigate to chat with friend
        history.push(`/social-chat/t/${friend?.roomChatCode}`);
    };

    const handleRemoveFriend = async (friend: number) => {
        // Remove friend logic
        await unfriend(friend);
        setFriends(prevFriends => prevFriends.filter(f => f.id !== friend));
        await refetch();
    };

    const truncate = (text: string | undefined, max: number = 15) => {
        if (!text) return '';
        return text.length > max ? text.slice(0, max) + '…' : text;
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center p-4 bg-white rounded-lg">
                    <IonSkeletonText animated style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div className="ml-4 flex-1">
                        <IonSkeletonText animated style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '40%', height: '14px' }} />
                    </div>
                    <div className="flex gap-2">
                        <IonSkeletonText animated style={{ width: '60px', height: '32px', borderRadius: '16px' }} />
                        <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFriendItem = (friend: FriendItem) => (
        <div key={friend.id} className="flex items-center justify-between bg-white -mx-10 px-5 py-5 border-b border-gray-200 min-h-[80px] w-auto">
            {/* Left - Avatar + Text */}
            <div
                className="flex items-center gap-4 min-w-0 cursor-pointer"
                onClick={() => history.push(`/profile/${friend.id}`)}
            >
                <div className="relative flex-shrink-0">
                    <img
                        src={friend?.avatar || avatarFallback}
                        alt={friend.name}
                        className="w-16 h-16 rounded-2xl object-cover"
                        onError={(e) => {
                            e.currentTarget.src = avatarFallback;
                        }}
                    />
                    {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-[17px] truncate" title={friend.name}>
                        {truncate(friend?.name, 18)}
                    </h3>
                    {/* <p className="text-[14px] text-gray-700 truncate" title={friend.code}>
                        {truncate(friend?.code, 15)}
                    </p> */}
                </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={() => handleMessage(friend)}
                    className="px-5 h-12 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-[0.98]"
                >
                    {t('Message')}
                </button>
                <button
                    onClick={() => setConfirmState({ open: true, type: "unfriend", targetId: friend.id, userName: friend.name })}
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors font-semibold"
                >
                    <IonIcon icon={personRemoveOutline} className="w-5 h-5 font-bold" />
                </button>
            </div>
        </div>
    );

    return (
        <IonPage className="ion-page" style={{ '--background': 'white', height: '100%' } as any}>
            {/* Fixed Header */}
            <IonToolbar style={{ '--background': 'white', '--ion-background-color': 'white' } as any}>
                <IonButtons slot="start">
                    <IonButton
                        fill="clear"
                        onClick={() => history.goBack()}
                        className="ml-2"
                    >
                        <IonIcon icon={arrowBack} className="text-black font-bold text-2xl" />
                    </IonButton>
                </IonButtons>
                <IonTitle className="text-center font-semibold text-lg">
                    {t('Friend list')}
                </IonTitle>
                <IonButtons slot="end">
                    <IonButton className="opacity-0 pointer-events-none" fill="clear">
                        <IonIcon icon={arrowBack} />
                    </IonButton>
                </IonButtons>
            </IonToolbar>

            {/* Fixed Search Bar */}
            <div className="px-3 py-3 bg-white">
                <IonSearchbar
                    value={searchInput}
                    onIonInput={(e) => setSearchInput((e.detail.value ?? '').toString())}
                    type="text"
                    placeholder={t('Search')}
                    showClearButton="focus"
                    className="custom-searchbar"
                    style={{
                        '--background': '#f3f4f6',
                        '--border-radius': '12px',
                        '--box-shadow': 'none',
                        '--padding-start': '16px',
                        '--padding-end': '16px'
                    } as any}
                />
            </div>

            {/* Fixed Friend Count */}
            <div className="px-4 pb-2 bg-white">
                <p className="text-m text-black font-semibold">
                    {totalRecords} {t('friends')}
                </p>
            </div>

            {/* Scrollable Content */}
            <IonContent
                className="ion-padding"
                style={{ '--background': 'white', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' } as any}
            >
                <div className="px-4 pb-24">
                    {loading ? (
                        renderSkeleton()
                    ) : (
                        <div className="space-y-2 space-x-1">
                            {friends.map((friend) => renderFriendItem(friend))}
                        </div>
                    )}

                    {!loading && friends.length === 0 && searchQuery && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <IonIcon icon={chatbubbleOutline} className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-sm">
                                {t('No friends found matching your search')}
                            </p>
                        </div>
                    )}

                    {!loading && friends.length === 0 && !searchQuery && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <IonIcon icon={chatbubbleOutline} className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-sm">
                                {t('No friends yet')}
                            </p>
                        </div>
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

                    {/* Infinite Scroll */}
                    {friends.length > 0 && !searchQuery && (
                        <IonInfiniteScroll
                            onIonInfinite={handleInfiniteScroll}
                            threshold="100px"
                            disabled={!hasNextPage || loading}
                            className="pb-16"
                        >
                        </IonInfiniteScroll>
                    )}
                </div>
            </IonContent>
            <ConfirmModal
                isOpen={confirmState.open}
                title={t("Are you sure?")}
                message={confirmState.type === "cancel" ? t("You can always send another request later!") : t("You will no longer see their updates or share yours with them")}
                confirmText={confirmState.type === "cancel" ? t("Yes, cancel") : t("Yes, unfriend")}
                cancelText={t("Cancel")}
                onConfirm={() => {
                    if (confirmState.type === "cancel" && confirmState.targetId) {
                        handleRemoveFriend(confirmState.targetId);
                    }
                    if (confirmState.type === "unfriend" && confirmState.targetId) {
                        handleRemoveFriend(confirmState.targetId);
                    }
                    setConfirmState({ open: false, type: confirmState.type, targetId: confirmState.targetId, userName: confirmState.userName });
                }}
                onClose={() => setConfirmState({ open: false, type: confirmState.type, targetId: confirmState.targetId, userName: confirmState.userName })}
            />
        </IonPage>
    );
};

export default FriendList;
