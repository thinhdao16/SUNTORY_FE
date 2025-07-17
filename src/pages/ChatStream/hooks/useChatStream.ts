import { useQuery } from "react-query";
import { useState, useEffect } from "react";
import { getChatMessage, getUserChatsByTopic } from "@/services/chat/chat-service";
import { UserChatByTopicResponse } from "@/services/chat/chat-types";
import { useChatStore } from "@/store/zustand/chat-store";
import { ChatMessage } from "@/pages/Chat/hooks/useChatMessages";

export const useUserChatsStreamByTopicSearch = (
    topicId?: number | null,
    keyword: string = "",
    enabled = true,
    debounceMs = 400
) => {
    const setChats = useChatStore((s) => s.setChats);
    const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(keyword), debounceMs);
        return () => clearTimeout(handler);
    }, [keyword, debounceMs]);

    return useQuery<UserChatByTopicResponse>(
        ["userChatsByTopic", topicId, debouncedKeyword],
        () => getUserChatsByTopic(topicId, debouncedKeyword),
        {
            enabled,
            onSuccess: (data) => {
                setChats(data.data);
            },
        }
    );
};
export const useChatMessageQuery = (chatCode: string) => {
    return useQuery<ChatMessage[], Error>(
        ["chatMessages", chatCode],
        () => getChatMessage(chatCode),
        {
            enabled: !!chatCode,
        }
    );
};