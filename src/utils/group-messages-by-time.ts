import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export function useSyncDayjsLocale() {
    const { i18n } = useTranslation();
    const localeMap: Record<string, string> = {
        vi: "vi",
        "vi-VN": "vi",
        en: "en",
        "en-US": "en",
        "zh-CN": "zh-cn",
        "zh-TW": "zh-tw",
        zh: "zh-cn",
    };


    useEffect(() => {
        const lang = i18n.language;
        const dayjsLocale = localeMap[lang] || "en";
        dayjs.locale(dayjsLocale);
    }, [i18n.language]);
}

export interface MessageGroup {
    timestamp: string;
    displayTime: string;
    messages: any[];
}

const MESSAGE_GROUP_THRESHOLD = 5 * 60 * 1000;
const TIME_GROUP_THRESHOLD = 10 * 60 * 1000;

type TFn = (key: string, options?: any) => string;

type GroupOpts = {
    isGroup?: boolean;
    currentUserId?: number | string | null;
};

export function groupMessagesByTime(
    messages: any[],
    t: TFn,
    opts: GroupOpts = {}
): MessageGroup[] {
    const { isGroup = false, currentUserId = null } = opts;
    if (!messages || messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    const sortedMessages = [...messages].sort(
        (a, b) => getMessageTime(a) - getMessageTime(b)
    );

    sortedMessages.forEach((message) => {
        const messageTime = getMessageTime(message);
        const messageDayjs = dayjs(messageTime);

        const normalized = {
            ...message,
            _senderKey: getSenderKey(message),
            _isUser: isFromCurrentUser(message, currentUserId),
        };

        const startNewTimeGroup =
            !currentGroup || shouldCreateNewTimeGroup(currentGroup, messageTime);

        if (startNewTimeGroup) {
            const displayTime = getDisplayTime(messageDayjs, t);
            currentGroup = {
                timestamp: messageDayjs.toISOString(),
                displayTime,
                messages: [],
            };
            groups.push(currentGroup);
        }

        const seq = currentGroup!.messages;
        if (seq.length === 0) {
            normalized._shouldShowAvatar = true;
            normalized._showSenderName = isGroup && !normalized._isUser;
            normalized._isFirstInSequence = true;
            currentGroup!.messages.push(normalized);
            return;
        }

        const last = seq[seq.length - 1];
        const timeDiff = messageTime - getMessageTime(last);
        const senderChanged = normalized._senderKey !== last._senderKey;

        const breakSequence = senderChanged || timeDiff > MESSAGE_GROUP_THRESHOLD;

        normalized._isFirstInSequence = breakSequence;
        normalized._shouldShowAvatar = breakSequence;
        normalized._showSenderName = isGroup && !normalized._isUser && breakSequence;

        currentGroup!.messages.push(normalized);
    });

    return groups;
}

function getMessageTime(message: any): number {
    if (message.timeStamp) {
        const ts = Number(message.timeStamp);
        return ts > 999999999999999 ? Math.floor(ts / 1000) : ts;
    }
    if (message.createDate) return new Date(message.createDate).getTime();
    return Date.now();
}

function shouldCreateNewTimeGroup(
    currentGroup: MessageGroup,
    newMessageTime: number
): boolean {
    const last = currentGroup.messages[currentGroup.messages.length - 1];
    return newMessageTime - getMessageTime(last) > TIME_GROUP_THRESHOLD;
}

function getDisplayTime(time: dayjs.Dayjs, t: TFn): string {
    const now = dayjs();
    const diffMinutes = now.diff(time, "minute");
    const diffHours = now.diff(time, "hour");
    const diffDays = now.diff(time, "day");

    if (diffMinutes < 1) return t("Just now");
    if (diffMinutes < 60) return t("{{count}} minutes ago", { count: diffMinutes });
    if (diffHours < 24 && time.isSame(now, "day")) return time.format("HH:mm");
    if (diffDays === 1) return t("Yesterday") + " " + time.format("HH:mm");
    if (diffDays < 7) return time.format("dddd HH:mm");
    if (time.isSame(now, "year")) return time.format("DD/MM HH:mm");
    return time.format("DD/MM/YYYY HH:mm");
}

function getSenderKey(m: any): string | number {
    if (m.isNotifyRoomChat || m.messageType === 10 || m.messageType === 2) {
        const sysId = m.Key || m.Event || m.messageText || m.code || (`sys:${m.id ?? Math.random()}`);
        return `system:${sysId}`;
    }

    if (m.userId !== undefined && m.userId !== null) return m.userId;
    if (m.senderId !== undefined && m.senderId !== null) return m.senderId;
    if (m.userName) return `name:${m.userName}`;
    if (m.senderType !== undefined) return `stype:${m.senderType}`;
    return `anon:${m.id ?? Math.random()}`;
}

function isFromCurrentUser(m: any, currentUserId: any): boolean {
    if (m.isRight != null) return !!m.isRight;
    if (m.userId != null && currentUserId != null)
        return String(m.userId) === String(currentUserId);
    return false;
}
