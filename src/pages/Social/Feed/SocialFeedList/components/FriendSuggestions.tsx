import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
    
    const [lastEmptyCheck, setLastEmptyCheck] = useState<number | null>(null);
    const [isInCooldown, setIsInCooldown] = useState(false);
    
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

    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [sentLocal, setSentLocal] = useState<Set<number>>(new Set());
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
    const [renderLimit, setRenderLimit] = useState<number>(pageSize);
    const prefetchedOnceRef = useRef(false);
    const noMoreRef = useRef(false);
    const limitedUsers = useMemo(() => visibleUsers.slice(0, renderLimit), [visibleUsers, renderLimit]);

    // When the latest page from API is empty, enter cooldown and stop further fetches for a while
    useEffect(() => {
        const pages = data?.pages ?? [];
        if (pages.length === 0) return;
        const last: any = pages[pages.length - 1];
        const len = Array.isArray(last?.data) ? last.data.length : 0;
        if (len === 0) {
            noMoreRef.current = true;
            setIsInCooldown(true);
            const id = setTimeout(() => {
                noMoreRef.current = false;
                setIsInCooldown(false);
            }, 2 * 60 * 1000);
            return () => clearTimeout(id);
        }
    }, [data?.pages]);

    const safeFetchNext = useCallback(() => {
        if (isFetchingNextPage || isInCooldown || noMoreRef.current) return;
        fetchNextPage().catch(() => {
            setIsInCooldown(true);
            setTimeout(() => setIsInCooldown(false), 60 * 1000);
        });
    }, [isFetchingNextPage, isInCooldown, fetchNextPage]);
    useEffect(() => {
        // Keep limit within bounds and at least 1 page on data changes
        setRenderLimit((prev) => Math.max(pageSize, Math.min(prev, visibleUsers.length)));
    }, [visibleUsers.length, pageSize]);

    // Prefetch one extra batch after first page arrives to ensure smooth horizontal scroll
    useEffect(() => {
        if (prefetchedOnceRef.current) return;
        const hasFirstPage = !!data?.pages && data.pages.length >= 1;
        if (!isLoading && hasFirstPage && !isFetchingNextPage && !noMoreRef.current) {
            prefetchedOnceRef.current = true;
            fetchNextPage();
        }
    }, [isLoading, isFetchingNextPage, data?.pages, fetchNextPage]);
    
    useEffect(() => {
        if (!isLoading && !isFetchingNextPage && visibleUsers.length === 0 && data?.pages && data.pages.length > 0) {
            const now = Date.now();
            const COOLDOWN_DURATION = 2 * 60 * 1000;  
            
            if (!lastEmptyCheck) {
                setLastEmptyCheck(now);
                setIsInCooldown(true);
                
                setTimeout(() => {
                    setIsInCooldown(false);
                    setLastEmptyCheck(null);
                }, COOLDOWN_DURATION);
            }
        }
    }, [isLoading, isFetchingNextPage, visibleUsers.length, data?.pages, lastEmptyCheck]);

    const ensureFill = () => {
        const el = listRef.current;
        if (!el) return;
        const needMore = (el.scrollWidth - el.clientWidth) <= 80;
        if (needMore && renderLimit < visibleUsers.length) {
            setRenderLimit((prev) => Math.min(prev + pageSize, visibleUsers.length));
        }
        safeFetchNext();
    };

    const handleDismissCard = (id: number) => {
        setDismissed((prev) => new Set([...prev, id]));
        setTimeout(() => {
            ensureFill();
        }, 0);
    };

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const onScroll = () => {
            const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 80;
            if (nearEnd) {
                if (renderLimit < visibleUsers.length) {
                    setRenderLimit((prev) => Math.min(prev + pageSize, visibleUsers.length));
                }
                safeFetchNext();
            }
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [isFetchingNextPage, fetchNextPage, isInCooldown, renderLimit, visibleUsers.length, pageSize]);

    useEffect(() => {
        const root = listRef.current;
        const target = sentinelRef.current;
        if (!root || !target) return;
        const obs = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    if (renderLimit < visibleUsers.length) {
                        setRenderLimit((prev) => Math.min(prev + pageSize, visibleUsers.length));
                    }
                    safeFetchNext();
                }
            },
            { root, threshold: 0.1 }
        );
        obs.observe(target);
        return () => obs.disconnect();
    }, [isFetchingNextPage, fetchNextPage, isInCooldown, renderLimit, visibleUsers.length, pageSize]);

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
                {visibleUsers.length === 0 && isInCooldown && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">{t('No suggestions available')}</h3>
                        <p className="text-xs text-gray-500">{t('We\'ll check for new suggestions in a few minutes')}</p>
                    </div>
                )}

                {visibleUsers.length === 0 && !isInCooldown && isLoading && (
                    <div className="flex gap-3 overflow-x-auto">
                        {Array.from({ length: Math.max(4, pageSize) }).map((_, i) => (
                            <FriendCardSkeleton key={`init-s-${i}`} />
                        ))}
                    </div>
                )}

                {visibleUsers.length > 0 && (
                    <div ref={listRef} className="flex gap-3 overflow-x-auto ">
                        {limitedUsers.map((user: any) => {
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
                        <div ref={sentinelRef} className="w-2" />
                    </div>
                )}

            </div>
        </div>
    );
};
