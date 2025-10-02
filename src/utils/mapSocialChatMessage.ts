import { ChatMessage } from "@/types/social-chat";
import { generatePreciseTimestampFromDate } from "./time-stamp";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);


export function mergeSocialChatMessages(
    messages: ChatMessage[],
    currentUserId: number
): ChatMessage[] {
    const safeMessages = Array.isArray(messages) ? messages : [];

    const filteredMessages = safeMessages;
    
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const eligibleMessages = filteredMessages.filter(msg => 
        msg.messageType === 10 && 
        msg.messageText && 
        msg.messageText.trim() &&
        !(msg.id === 0 || msg.id === 1)
    );
    
    const recentEligibleMessages = eligibleMessages.slice(-5);
    const recentCount = recentEligibleMessages.length;
    
    const translateIndices = new Set<number>();
    
    if (recentCount > 0) {
        recentEligibleMessages.forEach(selectedMsg => {
            const originalIndex = filteredMessages.findIndex(msg => 
                (msg.id && msg.id === selectedMsg.id) || 
                (msg.tempId && msg.tempId === selectedMsg.tempId) ||
                (msg.code && msg.code === selectedMsg.code)
            );
            if (originalIndex !== -1) {
                translateIndices.add(originalIndex);
            }
        });
    }

    return filteredMessages.map((msg, index) => {
        const localCreateDate = msg.createDate ? 
            dayjs(msg.createDate).tz(localTimezone).format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ") : 
            msg.createDate;
        
        const timestamp = msg.timeStamp || 
            (msg.createDate ? generatePreciseTimestampFromDate(msg.createDate) : 0);
        
        const translateNeed = translateIndices.has(index);
        
        return {
            ...msg,
            isRight: msg.userId === currentUserId,
            botName: msg.botName === null ? undefined : msg.botName,
            localCreateDate,
            createDate: msg.createDate,
            timeStamp: timestamp,
            displayTime: dayjs(msg.createDate).format("HH:mm"),
            translateNeed: translateNeed
        };
    });
}

export function convertUTCToLocalTime(utcDate: string): string {
    if (!utcDate) return '';
    
    try {
        return dayjs(utcDate).local().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
    } catch (error) {
        console.error("Error converting UTC to local time:", error);
        return utcDate;
    }
}
