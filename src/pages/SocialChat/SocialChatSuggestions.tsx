import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded.svg';
import { useToastStore } from '@/store/zustand/toast-store';
import { useFriendshipRecommendedInfinite, useSendFriendRequest } from '@/pages/SocialPartner/hooks/useSocialPartner';
import UserRowSkeleton from '@/components/skeletons/UserRowSkeleton';
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useHistory } from 'react-router-dom';

const SocialChatSuggestions: React.FC = () => {
    const { t } = useTranslation();
    const showToast = useToastStore((s) => s.showToast);
    const history = useHistory();

    const {
        data,
        isLoading,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useFriendshipRecommendedInfinite(20);

    const sendRequest = useSendFriendRequest(showToast, () => { void refetch(); });
    const {
        hasFriendRequestOutgoing,
        setFriendRequestOutgoing,
        pruneExpiredFriendRequestOutgoing,
    } = useSocialChatStore();

    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [sentLocal, setSentLocal] = useState<Set<number>>(new Set());
    const lastAutoFetchRef = useRef<number>(0);
    const [userMap, setUserMap] = useState<Map<number, any>>(new Map());
    useEffect(() => {
        if (!data?.pages) return;
        setUserMap((prev) => {
            const next = new Map(prev);
            for (const p of data.pages) {
                for (const u of (p?.data ?? [])) {
                    const id = u?.id as number | undefined;
                    if (typeof id === 'number') {
                        const existing = next.get(id);
                        next.set(id, { ...existing, ...u });
                    }
                }
            }
            return next;
        });
    }, [data?.pages]);
    const users: any[] = useMemo(() => Array.from(userMap.values()), [userMap]);
    const visibleUsers = useMemo(() => users.filter((u: any) => !dismissed.has(u?.id)), [users, dismissed]);

    const handleDismiss = (id: number) => {
        setDismissed((prev) => new Set([...prev, id]));
        setTimeout(() => {
            const el = listRef.current;
            if (!el) return;
            const needMore = (el.scrollHeight - el.clientHeight) <= 100;
            if (!isFetchingNextPage && needMore) {
                fetchNextPage();
            }
        }, 0);
    };

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const onScroll = () => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100 && !isFetchingNextPage) {
                fetchNextPage();
            }
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const root = listRef.current;
        const target = sentinelRef.current;
        if (!root || !target) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { root, threshold: 0.1 }
        );
        obs.observe(target);
        return () => obs.disconnect();
    }, [isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const id = setInterval(() => {
            pruneExpiredFriendRequestOutgoing();
        }, 60000);
        return () => clearInterval(id);
    }, [pruneExpiredFriendRequestOutgoing]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const now = Date.now();
        const needMore = (el.scrollHeight - el.clientHeight) <= 100; 
        if (!isLoading && !isFetchingNextPage && needMore && now - lastAutoFetchRef.current > 800) {
            lastAutoFetchRef.current = now;
            fetchNextPage();
        }
    }, [visibleUsers.length, data?.pages?.length, isLoading, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="h-screen bg-white">
            <div ref={listRef} className="overflow-y-auto px-4 pt-4 pb-28 max-h-[75vh] lg:max-h-[75vh] xl:max-h-[85vh]">
                {isLoading && (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <UserRowSkeleton key={`urs-${i}`} />
                        ))}
                    </>
                )}
                {visibleUsers.length === 0 && !isFetchingNextPage && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                        {t('No suggestions available')}
                    </div>
                )}
                {visibleUsers.map((user: any) => {
                    const isSent = !!user?.isRequestSender;
                    const isSentStore = hasFriendRequestOutgoing(user?.id);
                    const isSentUI = isSent || isSentStore || sentLocal.has(user?.id);
                    const isFriend = !!user?.isFriend;
                    const subtitle = user?.mutualFriendsCount
                        ? `${user.mutualFriendsCount} ${t('mutual friends')}`
                        : t('Suggested for you');

                    return (
                        <div
                            key={user?.id}
                            className="py-3 flex items-center  bg-white  hover:bg-gray-50 border-b border-neutral-100"
                            onClick={() => {
                                if (user?.id) history.push(`/profile/${user.id}/posts`);
                            }}
                        >
                            <div className="flex items-center min-w-0 w-full">
                                <img
                                    src={user?.avatar || avatarFallback}
                                    alt={user?.fullName || 'User'}
                                    className="w-[64px] h-[64px] rounded-3xl object-cover shrink-0 flex-none"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = avatarFallback;
                                    }}
                                />
                                <div className="ml-3 min-w-0 w-full ">
                                    <div className="text-base font-semibold truncate max-w-[180px]">{user?.fullName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{subtitle}</div>

                                    <div className="flex items-center gap-2  font-semibold w-full">
                                        {!isFriend && (
                                            isSentUI ? (
                                                <button
                                                    className="flex-1 px-4 py-2 text-sm rounded-xl opacity-50 bg-main text-white cursor-default"
                                                    disabled
                                                >
                                                    {t('Sent')}
                                                </button>
                                            ) : (
                                                <button
                                                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-main  text-white hover:bg-blue-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (user?.id) {
                                                            setSentLocal((prev) => new Set([...prev, user.id]));
                                                            setFriendRequestOutgoing(user.id, 'sent', 86400);
                                                            sendRequest.mutate(user.id);
                                                        }
                                                    }}
                                                >
                                                    {t('Add friend')}
                                                </button>
                                            )
                                        )}
                                        {isFriend && (
                                            <span className="px-4 py-2 text-sm rounded-xl bg-green-50 text-green-600">
                                                {t('Friends')}
                                            </span>
                                        )}
                                        <button
                                            className="flex-1 px-4 py-2 text-sm rounded-xl  bg-netural-50"
                                            onClick={(e) => { e.stopPropagation(); handleDismiss(user?.id); }}
                                        >
                                            {t('Remove')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })
                }
                {isFetchingNextPage && (
                    <>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <UserRowSkeleton key={`np-urs-${i}`} />
                        ))}
                    </>
                )}
                {/* Sentinel used to auto-fetch when visible */}
                <div ref={sentinelRef} className="h-4" />
            </div>
        </div>
    );
};

export default SocialChatSuggestions;
