import { useNotificationStore } from "@/store/zustand/notify-store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAcceptFriendRequest, useRejectFriendRequest } from "@/pages/SocialPartner/hooks/useSocialPartner";
import { useToastStore } from "@/store/zustand/toast-store";
import { useSendSocialChatMessage } from "@/pages/SocialChat/hooks/useSocialChat";
import { useHistory, useLocation } from "react-router-dom";
import LogoIcon from "@/icons/logo/logo.svg?react";
import { markAsReadMessageApi } from "@/services/social/social-chat-service";
import { useTranslation } from 'react-i18next';

export const NotificationList = () => {
    const { t } = useTranslation();
    const { notifications, markAsRead, clearOne } = useNotificationStore();
    const [replyOpenId, setReplyOpenId] = useState<string | number | null>(null);
    const [replyText, setReplyText] = useState<string>("");
    const [expandedNotifications, setExpandedNotifications] = useState<Set<string | number>>(new Set());
    const [pinnedNotifications, setPinnedNotifications] = useState<Set<string | number>>(new Set());
    const timersRef = useRef<Map<string | number, number>>(new Map());
    const prevReplyIdRef = useRef<string | number | null>(null);
    const isDraggingRef = useRef(false);
    const [swipeDismissIds, setSwipeDismissIds] = useState<Set<string | number>>(new Set());
    const showToast = useToastStore((state) => state.showToast);
    const history = useHistory();
    const { mutate: acceptRequest } = useAcceptFriendRequest(showToast);
    const { mutate: rejectRequest } = useRejectFriendRequest(showToast);
    const { mutate: sendMessage } = useSendSocialChatMessage({
        onSuccess: (data, variables) => {
            showToast("Message sent successfully", 2000, "success");
        }, onError: (error) => {
            showToast("Send message failed", 2000, "error");
        }
    });
    const { pathname } = useLocation();
    const room_match = pathname.match(/\/social-chat\/t\/(.+)$/);
    const user_match = pathname.match(/\/profile\/(.+)$/);
    const post_match = pathname.match(/\/social-feed\/f\/(.+)$/);
    const roomId = room_match ? room_match[1] : null;
    const userId = user_match ? user_match[1] : null;

    const toggleExpanded = (notificationId: string | number) => {
        setExpandedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(notificationId)) {
                newSet.delete(notificationId);
                // Unpin when collapsing (unless reply is open) - with shorter timer
                if (replyOpenId !== notificationId) {
                    unpinNotification(notificationId, true);
                }
            } else {
                newSet.add(notificationId);
                // Pin when expanding
                pinNotification(notificationId);
            }
            return newSet;
        });
    };

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return t('time.now_short', { defaultValue: t('now') });
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return t('time.minutes_short', { count: minutes, defaultValue: t('{{count}}m') });
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return t('time.hours_short', { count: hours, defaultValue: t('{{count}}h') });
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return t('time.days_short', { count: days, defaultValue: t('{{count}}d') });
        } else if (diffInSeconds < 31536000) {
            const months = Math.floor(diffInSeconds / 2592000);
            return t('time.months_short', { count: months, defaultValue: t('{{count}}mo') });
        } else {
            const years = Math.floor(diffInSeconds / 31536000);
            return t('time.years_short', { count: years, defaultValue: t('{{count}}y') });
        }
    };

    const pinNotification = (id: string | number) => {
        setPinnedNotifications(prev => new Set(prev).add(id));
        // Clear existing timer if notification is pinned
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    };

    const unpinNotification = (id: string | number, isAfterInteraction: boolean = false) => {
        setPinnedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        // Restart timer when unpinned - shorter duration if after interaction
        const duration = isAfterInteraction ? 1500 : 3500;
        startTimer(id, duration);
    };

    const startTimer = (id: string | number, duration: number = 3000) => {
        // Don't start timer if notification is pinned
        if (pinnedNotifications.has(id)) return;

        const timer = setTimeout(() => {
            clearOne(String(id));
            timersRef.current.delete(id);
        }, duration);

        timersRef.current.set(id, timer);
    };

    // Auto-dismiss notifications after 3 seconds
    useEffect(() => {
        // Start timer cho tất cả notifications đang hiển thị (tối đa 3 cái)
        visibleNotifications.forEach((notification) => {
            if (!timersRef.current.has(notification.id) && !pinnedNotifications.has(notification.id)) {
                startTimer(notification.id, 3000); // 3 giây
            }
        });

        // Cleanup timers for notifications that no longer exist
        const currentIds = new Set(notifications.map(n => String(n.id)));
        timersRef.current.forEach((timer, id) => {
            if (!currentIds.has(String(id))) {
                clearTimeout(timer);
                timersRef.current.delete(id);
            }
        });

        // Cleanup function
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, [notifications, clearOne, pinnedNotifications]);

    // Pin notification when reply input is open
    useEffect(() => {
        if (replyOpenId) {
            pinNotification(replyOpenId);
        } else if (prevReplyIdRef.current && !replyOpenId) {
            // When closing reply, use shorter timer
            unpinNotification(prevReplyIdRef.current, true);
        }

        prevReplyIdRef.current = replyOpenId;
    }, [replyOpenId]);


    // Giới hạn hiển thị tối đa 3 notification cùng lúc
    const maxVisibleNotifications = 3;
    const visibleNotifications = notifications.slice(0, maxVisibleNotifications);
    console.log(visibleNotifications)
    return (
        <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center pointer-events-none pt-4">
            <div className="pointer-events-auto flex flex-col gap-3 w-100 max-w-[110vw]">
                <AnimatePresence>
                    {visibleNotifications.map((n) => {
                        const renderNotification = () => {
                            switch (n.type) {
                                case "friend_request":
                                    if (userId === n.data.from_user_id) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    const isExpanded = expandedNotifications.has(n.id);
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            {/* Collapsed State */}
                                            <div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/10 transition-colors"
                                                onClick={() => toggleExpanded(n.id)}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            {t("Friend request")} • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    {!isExpanded && (
                                                        <p className="text-base line-clamp-1">
                                                            <span className="font-bold text-black">{(n as any)?.data?.from_user_name || "User"}</span>
                                                            <span className="text-gray-700">: {t(n.body, { ns: 'api' })}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <motion.button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpanded(n.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center flex-shrink-0"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <motion.svg
                                                        className="w-4 h-4 text-gray-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </motion.svg>
                                                </motion.button>
                                            </div>

                                            {/* Expanded State */}
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    height: isExpanded ? "auto" : 0,
                                                    opacity: isExpanded ? 1 : 0,
                                                    y: isExpanded ? 0 : -10
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: [0.4, 0.0, 0.2, 1]
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {n.avatar && (
                                                            <img
                                                                src={n.avatar}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                alt="User avatar"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-base">
                                                                <span className="font-bold text-black">{(n as any)?.data?.from_user_name || "User"}</span>
                                                                <span className="text-gray-600">:{t(" Hey my name is")} {(n as any)?.data?.from_user_name || "User"}. {t("Nice to meet you")}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 pb-2 pl-14">
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                acceptRequest(Number(n.data.friend_request_id))
                                                                markAsRead(n.id);
                                                                clearOne(n.id);
                                                            }}
                                                            className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            {t("Accept")}</motion.button>
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                rejectRequest(Number(n.data.friend_request_id))
                                                                markAsRead(n.id);
                                                                clearOne(n.id);
                                                            }}
                                                            className="text-red-500 text-sm font-semibold hover:text-red-600 transition-colors"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            {t("Decline")}</motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "friend_request_accepted":
                                    return (
                                        <motion.div
                                            className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900 cursor-pointer"
                                            onClick={() => {
                                                history.push(`/profile/${n.data.accepter_user_id}`);
                                                markAsRead(n.id);
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{t(n.title, { ns: 'api' })}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    <span className="font-semibold mr-1 text-neutral-900">{(n as any)?.data?.accepter_name || ""}</span>
                                                    {t(n.body, { ns: 'api' })}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </motion.div>
                                    );
                                case "chat_message":
                                    if (roomId === n.data.chat_code) {
                                        // Không hiện thông báo khi đang ở chính chat đó
                                        clearOne(n.id);
                                        return null;
                                    }
                                    const isChatExpanded = expandedNotifications.has(n.id);

                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            {/* Collapsed State */}
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-chat/t/${n.data.chat_code}`);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            {t("New message")} • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    {!isChatExpanded && (
                                                        <p className="text-base line-clamp-1">
                                                            <span className="font-bold text-black">{(n?.fullData?.UserName)} {t("to")} {(n?.fullData?.ChatInfo?.Title)}</span>

                                                            <span className="text-gray-700">: {n.body}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <motion.button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpanded(n.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center flex-shrink-0"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <motion.svg
                                                        className="w-4 h-4 text-gray-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        animate={{ rotate: isChatExpanded ? 180 : 0 }}
                                                        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </motion.svg>
                                                </motion.button>
                                            </motion.div>

                                            {/* Expanded State */}
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    height: isChatExpanded ? "auto" : 0,
                                                    opacity: isChatExpanded ? 1 : 0,
                                                    y: isChatExpanded ? 0 : -10
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: [0.4, 0.0, 0.2, 1]
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {n.avatar && (
                                                            <img
                                                                src={n.avatar}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                alt="User avatar"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-base">
                                                                <span className="font-bold text-black">{(n.title || "")}</span>
                                                                <span className="text-gray-600">: {n.body}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 pb-2 pl-14">
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReplyOpenId(replyOpenId === n.id ? null : n.id);
                                                                if (replyOpenId !== n.id) setReplyText("");
                                                            }}
                                                            className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            {t("Reply")}</motion.button>
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(n.id);
                                                                markAsReadMessageApi({
                                                                    chatCode: n.data.chat_code,
                                                                    messageCode: n.data.message_id,
                                                                });
                                                                clearOne(n.id);
                                                            }}
                                                            className="text-blue-500 text-sm font-semibold hover:text-gray-600 transition-colors"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            {t("Mark as read")}</motion.button>
                                                    </div>
                                                    {/* Reply Input - only show when Reply is clicked */}
                                                    {replyOpenId === n.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                            transition={{
                                                                duration: 0.25,
                                                                ease: [0.4, 0.0, 0.2, 1]
                                                            }}
                                                            className="mt-3 flex gap-3 pl-14"
                                                        >
                                                            <input
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && replyText.trim()) {
                                                                        e.preventDefault();
                                                                        sendMessage({
                                                                            chatCode: n.data.chat_code,
                                                                            messageText: replyText,
                                                                            replyToMessageCode: n.data.message_code,
                                                                            tempId: n.id,
                                                                        });
                                                                        setReplyText("");
                                                                        setReplyOpenId(null);
                                                                    }
                                                                }}
                                                                placeholder="Type a reply..."
                                                                className="flex-1 rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            />
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!replyText.trim()) return;
                                                                    sendMessage({
                                                                        chatCode: n.data.chat_code,
                                                                        messageText: replyText,
                                                                        replyToMessageCode: n.data.message_code,
                                                                        tempId: n.id,
                                                                    });
                                                                    setReplyText("");
                                                                    setReplyOpenId(null);
                                                                }}
                                                                disabled={!replyText.trim()}
                                                                className="px-3 py-2 rounded-xl text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                aria-label="Send reply"
                                                                whileHover={{ scale: replyText.trim() ? 1.05 : 1 }}
                                                                whileTap={{ scale: replyText.trim() ? 0.95 : 1 }}
                                                                transition={{ duration: 0.15 }}
                                                            >
                                                                {t("Send")}</motion.button>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "group_chat_created":
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{t(n.title, { ns: 'api' })}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    <span className="font-semibold mr-1 text-neutral-900">{n.data.creator_name ? (`${n.data.creator_name}: `) : ""}</span>
                                                    {t("added you to")}  {n?.data?.group_title}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "group_chat_updated":
                                    if (roomId === n.data.chat_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{t(n.title, { ns: 'api' })}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    <span className="font-semibold mr-1 text-neutral-900">{n.data.updater_name ? (`${n.data.updater_name}: `) : ""}</span>
                                                    {n?.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "group_members_added":
                                    if (roomId === n.data.chat_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{t(n.title, { ns: 'api' })}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    {/* <span className="font-semibold mr-1 text-neutral-900">{n.data.adder_name ? (`${n.data.adder_name}: `) : ""}</span> */}
                                                    {n?.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "group_members_removed":
                                    if (roomId === n.data.chat_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{t(n.title, { ns: 'api' })}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    {/* <span className="font-semibold mr-1 text-neutral-900">{n.data.remover_name ? (`${n.data.remover_name}: `) : ""}</span> */}
                                                    {n?.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "member_added_to_group":
                                    if (roomId === n.data.chat_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{n.title}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    <span className="font-semibold mr-1 text-neutral-900">{(n.data.adder_name || "")} </span>
                                                    {n.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "group_chat_removed":
                                    return (
                                        <div className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900">
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{n.title}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    <span className="font-semibold mr-1 text-neutral-900">{n.data.remover_name ? (`${n.data.remover_name}: `) : ""}</span>
                                                    {n.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </div>
                                    );
                                case "liked_post":
                                    if (post_match ? post_match[1] : null === n.data.post_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-feed/f/${n.data.post_code}`);
                                                    markAsRead(n.id);
                                                    clearOne(n.id);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            Wayjet • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <p className="text-base">
                                                        <span className="font-bold text-black">{(n.data.liker_name || "")} </span>
                                                        <span className="text-black">{t("liked your post")}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "commented_post":
                                    if (post_match ? post_match[1] : null === n.data.post_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-feed/f/${n.data.post_code}`);
                                                    markAsRead(n.id);
                                                    clearOne(n.id);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            Wayjet • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <p className="text-base">
                                                        <span className="font-bold text-black">{(n.data.commenter_name || "")} </span>
                                                        <span className="text-black">{t("commented on your post")}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "reposted_post":
                                    if (post_match ? post_match[1] : null === n.data.post_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-feed/f/${n.data.post_code}`);
                                                    markAsRead(n.id);
                                                    clearOne(n.id);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            Wayjet • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <p className="text-base">
                                                        <span className="font-bold text-black">{(n.data.reposter_name || "")} </span>
                                                        <span className="text-black">{t("reposted your post")}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "comment_liked_post":
                                    if (post_match ? post_match[1] : null === n.data.post_code) {
                                        clearOne(n.id);
                                        return null;
                                    }
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-feed/f/${n.data.post_code}`);
                                                    markAsRead(n.id);
                                                    clearOne(n.id);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            Wayjet • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <p className="text-base">
                                                        <span className="font-bold text-black">{(n.data.liker_name || "")} </span>
                                                        <span className="text-black">{t("liked your comment")}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                case "reply_comment_post":
                                    return (
                                        <div className="relative z-10 text-neutral-900">
                                            <motion.div
                                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    history.push(`/social-feed/f/${n.data.post_code}`);
                                                    markAsRead(n.id);
                                                    clearOne(n.id);
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-10 h-10 rounded-3xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <LogoIcon className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1">
                                                        <span className="text-sm text-gray-400">
                                                            Wayjet • {formatTimeAgo(new Date(n.createdAt))}
                                                        </span>
                                                    </div>
                                                    <p className="text-base">
                                                        <span className="font-bold text-black">{(n.data.replyer_name || "")} </span>
                                                        <span className="text-black">{t("replied to your comment")}</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                default:
                                    return (
                                        <motion.div
                                            className="relative z-10 flex items-center gap-4 p-5 sm:p-5 text-neutral-900"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {n.avatar && (
                                                <img
                                                    src={n.avatar}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold leading-snug text-[clamp(14px,2.5vw,16px)] line-clamp-1">{n.title}</p>
                                                <p className="text-[clamp(12px,2.2vw,14px)] leading-snug text-neutral-700 line-clamp-2">
                                                    {n.body}
                                                </p>
                                            </div>
                                            {(n as any)?.data?.time_ago && (
                                                <span className="shrink-0 text-[11px] text-neutral-700">{(n as any).data.time_ago}</span>
                                            )}
                                        </motion.div>
                                    );
                            }
                        };

                        return (
                            <motion.div
                                key={n.id}
                                initial={{
                                    opacity: 0,
                                    y: -50,
                                    scale: 0.95
                                }}
                                animate={swipeDismissIds.has(n.id)
                                    ? {
                                        opacity: 0,
                                        x: -300,
                                        scale: 0.8,
                                        transition: {
                                            duration: 0.35,
                                            ease: [0.4, 0.0, 0.2, 1]
                                        }
                                    }
                                    : {
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: {
                                            duration: 0.4,
                                            ease: [0.4, 0.0, 0.2, 1]
                                        }
                                    }}
                                exit={{
                                    opacity: 0,
                                    y: -30,
                                    scale: 0.9,
                                    transition: {
                                        duration: 0.3,
                                        ease: [0.4, 0.0, 0.2, 1]
                                    }
                                }}
                                className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200"
                                drag="x"
                                dragElastic={0.15}
                                dragMomentum={false}
                                dragConstraints={{ left: -350, right: 0 }}
                                dragSnapToOrigin
                                onDragStart={() => { isDraggingRef.current = true; }}
                                onDragEnd={(_, info) => {
                                    const passedOffset = info.offset.x < -50;
                                    const passedVelocity = info.velocity.x < -400;
                                    if (passedOffset || passedVelocity) {
                                        // animate sang trái rồi xóa với hiệu ứng mượt hơn
                                        setSwipeDismissIds(prev => { const s = new Set(prev); s.add(n.id); return s; });
                                        markAsRead(n.id);
                                        setTimeout(() => clearOne(n.id), 350);
                                    }
                                    // allow clicks again on next tick
                                    setTimeout(() => { isDraggingRef.current = false; }, 0);
                                }}
                                whileDrag={{
                                    x: -12,
                                    opacity: 0.9,
                                    scale: 0.98,
                                    transition: { duration: 0.1 }
                                }}

                                onClickCapture={(e) => { if (isDraggingRef.current) e.stopPropagation(); }}
                                onMouseEnter={() => pinNotification(n.id)}
                                onMouseLeave={() => unpinNotification(n.id, true)}
                                onTouchStart={() => pinNotification(n.id)}
                                onTouchEnd={() => unpinNotification(n.id, true)}
                            >
                                {renderNotification()}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};