import { useQuery } from "react-query";
import { getUserChatsByTopic } from "@/services/chat/chat-service";
import { UserChatByTopicResponse } from "@/services/chat/chat-types";
import { useChatStore } from "@/store/zustand/chat-store";

export const useUserChatsByTopic = (topicId?: number | null, enabled = true) => {
    const setChats = useChatStore((s) => s.setChats);

    return useQuery<UserChatByTopicResponse>(
        ["userChatsByTopic", topicId],
        () => getUserChatsByTopic(topicId),
        {
            enabled,
            onSuccess: (data) => {
                setChats(data.data);
            },
        }
    );
};