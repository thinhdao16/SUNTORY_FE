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
    
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return safeMessages.map(msg => {
        const localCreateDate = msg.createDate ? 
            dayjs(msg.createDate).tz(localTimezone).format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ") : 
            msg.createDate;
        
        const timestamp = msg.timeStamp || 
            (msg.createDate ? generatePreciseTimestampFromDate(msg.createDate) : 0);
        
        return {
            ...msg,
            isRight: msg.userId === currentUserId,
            botName: msg.botName === null ? undefined : msg.botName,
            localCreateDate,
            createDate: msg.createDate,
            timeStamp: timestamp,
            displayTime: dayjs(msg.createDate).format("HH:mm")
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
