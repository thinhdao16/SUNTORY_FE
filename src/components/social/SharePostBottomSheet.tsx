import React, { useMemo, useState, useEffect, useRef } from 'react';
import BottomSheet from '@/components/common/BottomSheet';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/zustand/auth-store';
import { ChatInfoType } from '@/constants/socialChat';
import avatarFallback from '@/icons/logo/social-chat/avt-rounded.svg';
import { ShareLogType } from '@/constants/socialShare';
import { SocialFeedService } from '@/services/social/social-feed-service';
import { useToastStore } from '@/store/zustand/toast-store';
import { useSocialFeedStore } from '@/store/zustand/social-feed-store';
import { useQueryClient } from 'react-query';
import { getFriendshipFriends } from '@/services/social/social-partner-service';
import { getUserChatRooms } from '@/services/social/social-chat-service';
import SearchIcon from "@/icons/logo/social-chat/search.svg?react"
interface SharePostBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postCode: string;
}

const SharePostBottomSheet: React.FC<SharePostBottomSheetProps> = ({ isOpen, onClose, postCode }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore.getState();
    const showToast = useToastStore((s) => s.showToast);
    const queryClient = useQueryClient();
    const [query, setQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [selectedGroupCodes, setSelectedGroupCodes] = useState<Set<string>>(new Set());
    const [selectSocial, setSelectSocial] = useState<boolean>(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [inputFocused, setInputFocused] = useState(false);
    const hasSelection = selectedUserIds.size > 0 || selectedGroupCodes.size > 0;

    const PAGE_SIZE = 20;
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [refreshingFriends, setRefreshingFriends] = useState(false);
    const [refreshingGroups, setRefreshingGroups] = useState(false);
    const [friendItems, setFriendItems] = useState<Array<{ userId: number; name: string; avatar: string }>>([]);
    const [friendPage, setFriendPage] = useState(0);
    const [hasMoreFriends, setHasMoreFriends] = useState(true);
    const [loadingFriends, setLoadingFriends] = useState(false);

    const [groupList, setGroupList] = useState<Array<{ chatCode: string; name: string; avatar: string }>>([]);
    const [groupPage, setGroupPage] = useState(0);
    const [hasMoreGroups, setHasMoreGroups] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const friendsScrollRef = useRef<HTMLDivElement>(null);
    const groupsScrollRef = useRef<HTMLDivElement>(null);
    const friendsTouchStart = useRef<{ x: number; y: number } | null>(null);
    const groupsTouchStart = useRef<{ x: number; y: number } | null>(null);
    const friendsReqIdRef = useRef(0);
    const groupsReqIdRef = useRef(0);

    const meId = user?.id;

    const userItems = friendItems;
    const groupItems = groupList;

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => clearTimeout(id);
    }, [query]);

    const loadFriends = async (page: number, append: boolean, keyword?: string) => {
        if (loadingFriends) return;
        setLoadingFriends(true);
        try {
            const thisId = ++friendsReqIdRef.current;
            const q = (keyword !== undefined ? keyword : debouncedQuery) || undefined;
            const list: any[] = await getFriendshipFriends(page, PAGE_SIZE, q);
            if (thisId !== friendsReqIdRef.current) return; // stale response
            const mapped = (list || [])
                .map((it: any) => ({
                    userId: Number(it?.id) || 0,
                    name: (it?.fullName || it?.userName || '').trim() || (t('User') as string),
                    avatar: it?.avatarUrl || it?.avatar || avatarFallback,
                }))
                .filter((u) => !!u.userId);

            setFriendItems((prev) => {
                if (!append) return mapped;
                const map = new Map<number, { userId: number; name: string; avatar: string }>();
                prev.forEach((p) => map.set(p.userId, p));
                mapped.forEach((m) => { if (!map.has(m.userId)) map.set(m.userId, m); });
                return Array.from(map.values());
            });
            setHasMoreFriends((list || []).length === PAGE_SIZE);
            setFriendPage(page);
        } finally {
            setLoadingFriends(false);
        }
    };

    const loadGroups = async (page: number, append: boolean, keyword?: string) => {
        if (loadingGroups) return;
        setLoadingGroups(true);
        try {
            const thisId = ++groupsReqIdRef.current;
            const q = (keyword !== undefined ? keyword : debouncedQuery) || undefined;
            const res: any[] = await getUserChatRooms({ PageNumber: page, PageSize: PAGE_SIZE, Keyword: q, Type: ChatInfoType.Group });
            if (thisId !== groupsReqIdRef.current) return; // stale response
            const mapped = (res || [])
                .map((room: any) => ({
                    chatCode: room?.code,
                    name: room?.title || (t('Group') as string),
                    avatar: room?.avatarRoomChat || avatarFallback,
                }))
                .filter((g) => !!g.chatCode);

            setGroupList((prev) => {
                if (!append) return mapped;
                const setCodes = new Set(prev.map((p) => p.chatCode));
                const merged = [...prev];
                mapped.forEach((m) => { if (!setCodes.has(m.chatCode)) merged.push(m); });
                return merged;
            });
            setHasMoreGroups((res || []).length === PAGE_SIZE);
            setGroupPage(page);
        } finally {
            setLoadingGroups(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        // initial open: reset lists then fetch with current input
        setFriendItems([]);
        setFriendPage(0);
        setHasMoreFriends(true);
        setGroupList([]);
        setGroupPage(0);
        setHasMoreGroups(true);
        setRefreshingFriends(true);
        setRefreshingGroups(true);
        const initialQ = query.trim();
        Promise.all([
            loadFriends(0, false, initialQ),
            loadGroups(0, false, initialQ),
        ]).finally(() => {
            setRefreshingFriends(false);
            setRefreshingGroups(false);
        });
    }, [isOpen]);

    // Debounced query refresh: keep previous items while fetching
    useEffect(() => {
        if (!isOpen) return;
        setHasMoreFriends(true);
        setHasMoreGroups(true);
        setRefreshingFriends(true);
        setRefreshingGroups(true);
        Promise.all([
            loadFriends(0, false, debouncedQuery),
            loadGroups(0, false, debouncedQuery),
        ]).finally(() => {
            setRefreshingFriends(false);
            setRefreshingGroups(false);
        });
    }, [debouncedQuery, isOpen]);

    const handleFriendsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 48;
        if (nearEnd && hasMoreFriends && !loadingFriends) {
            void loadFriends(friendPage + 1, true);
        }
    };

    const handleGroupsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 48;
        if (nearEnd && hasMoreGroups && !loadingGroups) {
            void loadGroups(groupPage + 1, true);
        }
    };

    const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        }
    };

    const onFriendsTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const t = e.touches[0];
        friendsTouchStart.current = { x: t.clientX, y: t.clientY };
    };
    const onFriendsTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const start = friendsTouchStart.current;
        if (!start) return;
        const t = e.touches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            e.stopPropagation();
        }
    };
    const onGroupsTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const t = e.touches[0];
        groupsTouchStart.current = { x: t.clientX, y: t.clientY };
    };
    const onGroupsTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const start = groupsTouchStart.current;
        if (!start) return;
        const t = e.touches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            e.stopPropagation();
        }
    };

    const toggleUser = (userId: number) => {
        setSelectedUserIds((prev) => {
            const n = new Set(prev);
            if (n.has(userId)) n.delete(userId);
            else n.add(userId);
            return n;
        });
    };

    const toggleGroup = (chatCode: string) => {
        setSelectedGroupCodes((prev) => {
            const n = new Set(prev);
            if (n.has(chatCode)) n.delete(chatCode);
            else n.add(chatCode);
            return n;
        });
    };

    const handleSend = async () => {
        if (sending) return;

        const otherUserIds = Array.from(selectedUserIds);
        const chatCodes = Array.from(selectedGroupCodes);
        const trimmedMsg = message?.trim();

        const calls: Promise<any>[] = [];

        const types: number[] = [];
        if (otherUserIds.length > 0) types.push(ShareLogType.UserChat);
        if (chatCodes.length > 0) types.push(ShareLogType.GroupChat);
        if (types.length > 0) {
            calls.push(
                SocialFeedService.sharePost({
                    postCode,
                    type: types,
                    otherUserIds,
                    chatCodes,
                    messageShare: trimmedMsg || undefined,
                })
            );
        }

        if (calls.length === 0) {
            showToast(t('Select at least one destination'), 2000, 'warning');
            return;
        }

        try {
            setSending(true);
            const results = await Promise.all(calls);
            const extractShareCount = (obj: any): number | undefined => {
                if (!obj) return undefined;
                if (typeof obj.shareCount === 'number') return obj.shareCount;
                if (obj.data && typeof obj.data.shareCount === 'number') return obj.data.shareCount;
                if (obj.originalPost && typeof obj.originalPost.shareCount === 'number') return obj.originalPost.shareCount;
                return undefined;
            };
            let serverShareCount: number | undefined;
            for (const r of results) {
                const c = extractShareCount(r);
                if (typeof c === 'number') { serverShareCount = c; break; }
            }

            const store = useSocialFeedStore.getState();
            let prevCount: number = 0;
            const feeds = store.cachedFeeds || ({} as any);
            for (const key of Object.keys(feeds)) {
                const found = feeds[key]?.posts?.find((p: any) => p?.code === postCode);
                if (found && typeof found.shareCount === 'number') { prevCount = found.shareCount; break; }
            }
            if (!prevCount) {
                const cachedDetail: any = queryClient.getQueryData(['feedDetail', postCode]);
                if (cachedDetail && typeof cachedDetail.shareCount === 'number') prevCount = cachedDetail.shareCount;
            }

            const nextCount = typeof serverShareCount === 'number' ? serverShareCount : (prevCount + 1);
            store.applyRealtimePatch(postCode, { shareCount: nextCount } as any);
            queryClient.setQueryData(['feedDetail', postCode], (old: any) => ({ ...(old || {}), shareCount: nextCount }));

            showToast(t('Shared successfully'), 2000, 'success');
            setSelectedUserIds(new Set());
            setSelectedGroupCodes(new Set());
            setMessage("");
            onClose();
        } catch (e: any) {
            const msg = e?.response?.data?.message || t('Failed to share');
            showToast(msg, 3000, 'error');
        } finally {
            setSending(false);
        }
    };



    const Tile: React.FC<{
        name: string;
        avatar: string;
        selected: boolean;
        onClick: () => void;
    }> = ({ name, avatar, selected, onClick }) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center  mr-3 focus:outline-none`}
        >
            <div className="relative mb-2 w-[56px] h-[56px] pt-1 ">
                <img
                    src={avatar || avatarFallback}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarFallback; }}
                    className={`w-[56px] h-[56px] aspect-square rounded-3xl object-cover `}
                    alt={name}
                />
                {selected && (
                    <span className="absolute -top-0 -right-2 w-6 h-6 rounded-full bg-primary-400 text-white flex items-center justify-center text-xl border border-white">✓</span>
                )}
            </div>
            <span className="text-xs text-gray-700 truncate w-[40px] text-center">{name}</span>
        </button>
    );

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={null}
            showCloseButton={false}
            lockDismiss={inputFocused}
            classNameContainer=" !px-0 !pb-0"
        >
            <div className="" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 relative px-4">
                    <SearchIcon className="absolute top-1/2 left-7 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('Search') as string}
                        className="w-full rounded-xl px-4 py-2 pl-10 outline-none bg-chat-to"
                    />
                </div>

                <div className="mb-4">
                    <div className="px-4 pb-2 font-semibold text-gray-900 flex items-center gap-2">{t('User')}
                        {(refreshingFriends) && (
                            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                    <div
                        className="px-4 flex flex-nowrap overflow-x-auto lg:no-scrollbar min-h-[96px]"
                        ref={friendsScrollRef}
                        onScroll={handleFriendsScroll}
                        onWheel={handleHorizontalWheel}
                        onTouchStart={onFriendsTouchStart}
                        onTouchMove={onFriendsTouchMove}
                        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' as any }}
                    >
                        {userItems.map((u: any) => (
                            <Tile
                                key={u.userId}
                                name={u.name}
                                avatar={u.avatar}
                                selected={selectedUserIds.has(u.userId)}
                                onClick={() => toggleUser(u.userId)}
                            />
                        ))}
                        {(loadingFriends) && (
                            <div className="flex items-center justify-center w-[72px] mr-3">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        {userItems.length === 0 && !loadingFriends && !refreshingFriends && (
                            <div className="text-sm text-gray-400 px-2 py-1">{t('No users')}</div>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="px-4 pb-2 font-semibold text-gray-900 flex items-center gap-2">{t('Group')}
                        {(refreshingGroups) && (
                            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                    <div
                        className="px-4 flex flex-nowrap overflow-x-auto lg:no-scrollbar w-full min-h-[96px]"
                        ref={groupsScrollRef}
                        onScroll={handleGroupsScroll}
                        onWheel={handleHorizontalWheel}
                        onTouchStart={onGroupsTouchStart}
                        onTouchMove={onGroupsTouchMove}
                        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' as any }}
                    >
                        {groupItems.map((g: any) => (
                                <Tile
                                key={g.chatCode}
                                name={g.name}
                                avatar={g.avatar}
                                selected={selectedGroupCodes.has(g.chatCode)}
                                onClick={() => toggleGroup(g.chatCode)}
                            />
                        ))}
                        {(loadingGroups) && (
                            <div className="flex items-center justify-center w-[72px]  mr-3">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        {groupItems.length === 0 && !loadingGroups && !refreshingGroups && (
                            <div className="text-sm text-gray-400 px-2 py-1">{t('No groups')}</div>
                        )}
                    </div>
                </div>

                {/* <div className="mb-4">
                    <div className="px-4 pb-2 font-semibold text-gray-900">{t('Share to')}</div>
                    <div className="px-4 flex overflow-x-auto lg:no-scrollbar">
                        <Tile
                            key="social"
                            name={t('Social') as string}
                            avatar={avatarFallback}
                            selected={false}
                            onClick={handleExternalShare}
                        />
                      
                    </div>
                </div> */}

                {hasSelection && (
                    <div className="px-4 flex items-center gap-3 pt-3">
                        <input
                            className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none"
                            placeholder={t('Enter message') as string}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className={`px-4 py-2 rounded-2xl text-white font-semibold ${sending ? 'bg-gray-400' : 'bg-primary-500'}`}
                        >
                            {t('Send')}
                        </button>
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};

export default SharePostBottomSheet;
