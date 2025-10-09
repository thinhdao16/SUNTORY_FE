import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFriendshipRecommendedInfinite, useSendFriendRequest } from '@/pages/SocialPartner/hooks/useSocialPartner';
import { useToastStore } from '@/store/zustand/toast-store';
import FriendCardSkeleton from '@/components/skeletons/FriendCardSkeleton';
import avatarFallback from "@/icons/logo/social-chat/avt-rounded.svg"
import { useSocialChatStore } from '@/store/zustand/social-chat-store';
import { useHistory } from 'react-router-dom';

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
    const history = useHistory();
    const {
        data,
        isLoading,
        fetchNextPage,
        isFetchingNextPage,
        refetch,
    } = useFriendshipRecommendedInfinite(pageSize);

    const sendRequest = useSendFriendRequest(showToast, () => { void refetch(); });
    const {
        hasFriendRequestOutgoing,
        setFriendRequestOutgoing,
        pruneExpiredFriendRequestOutgoing,
    } = useSocialChatStore();

    // Horizontal scroll container + sentinel
    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    // Local states
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [sentLocal, setSentLocal] = useState<Set<number>>(new Set());
    // Persist users across refetch
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

    const handleDismissCard = (id: number) => {
        setDismissed((prev) => new Set([...prev, id]));
        // If not enough width to scroll, fetch more
        setTimeout(() => {
            const el = listRef.current;
            if (!el) return;
            const needMore = (el.scrollWidth - el.clientWidth) <= 80;
            if (!isFetchingNextPage && needMore) {
                fetchNextPage();
            }
        }, 0);
    };

    // Horizontal scroll to load more
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const onScroll = () => {
            if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 80 && !isFetchingNextPage) {
                fetchNextPage();
            }
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [isFetchingNextPage, fetchNextPage]);

    // IntersectionObserver sentinel at end (horizontal)
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

    return (
        <div className={`bg-white ${className}`}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="font-medium text-gray-900">
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
                <div ref={listRef} className="flex gap-3 overflow-x-auto ">
                    {visibleUsers.map((user: any) => {
                        const isSent = !!user?.isRequestSender;
                        const isSentStore = hasFriendRequestOutgoing(user?.id);
                        const isSentUI = isSent || isSentStore || sentLocal.has(user?.id);
                        const isFriend = !!user?.isFriend;
                        return (
                            <div
                                key={user?.id}
                                className="relative min-w-[180px] max-w-[180px] bg-white border border-netural-50 rounded-xl px-2 pb-2 pt-8"
                                onClick={() => { if (user?.id) history.push(`/profile/${user.id}/posts`); }}
                            >
                                {/* per-card dismiss */}
                                <button
                                    aria-label="Dismiss card"
                                    className="absolute right-2 top-2 text-netural-300 hover:text-gray-600 text-3xl"
                                    onClick={(e) => { e.stopPropagation(); handleDismissCard(user?.id); }}
                                >
                                    ×
                                </button>
                                <div className="flex flex-col items-center text-center">

                                    <img
                                        src={user?.avatar || avatarFallback}
                                        alt={user?.name || 'User Avatar'}
                                        className="w-34 h-34 rounded-4xl object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = avatarFallback;
                                        }}
                                    />
                                    <div className=" text-gray-900 font-medium line-clamp-1">{user?.fullName}</div>
                                    <div className="text-sm text-netural-300 mt-0.5">{t('Suggested for you')}</div>

                                    <div className="mt-3 w-full">
                                        {!isFriend && (
                                            isSentUI ? (
                                                <button className="w-full border border-netural-100  font-semibold py-2 rounded-2xl" disabled>
                                                    {t('Sent')}
                                                </button>
                                            ) : (
                                                <button
                                                    className="w-full text-white bg-main rounded-2xl py-2 font-semibold"
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
                                            <div className="text-xs text-green-600 font-medium py-1.5">{t('Friends')}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {isFetchingNextPage && (
                        <>
                            {Array.from({ length: Math.max(2, Math.min(4, pageSize)) }).map((_, i) => (
                                <FriendCardSkeleton key={`np-s-${i}`} />
                            ))}
                        </>
                    )}
                    {/* Horizontal sentinel */}
                    <div ref={sentinelRef} className="w-2" />
                </div>

            </div>
        </div>
    );
};
