import { useEffect } from "react";
import { useQuery } from "react-query";
import { getChatHistoryModule } from "@/services/chat/chat-service";
import { useToastStore } from "@/store/zustand/toast-store";
import { useChatStore } from "@/store/zustand/chat-store";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";

export const useChatHistoryLastModule = (topicId: number, enabled: boolean) => {
    const { showToast } = useToastStore();
    const { chatHistory, setChatHistory } = useChatStore();
    const { data: userInfo } = useAuthInfo();

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error: queryError,
        refetch,
    } = useQuery(
        ["chatHistory", topicId],
        () => {
            console.log("Fetching chat history for topic:", topicId);
            return getChatHistoryModule(topicId);
        },
        {
            enabled: !!userInfo?.id && enabled,
            onSuccess: (data) => {
                console.log("History loaded:", data);
                setChatHistory(data);
            },
            onError: (err: any) => {
                const errorMessage = err?.response?.data?.message || "Failed to load chat history";
                // showToast(errorMessage, 3000, "error");
            },
        }
    );

    return {
        chatHistory,
        isLoading: isLoading || isFetching,
        error: queryError,
        refetch,
        refreshHistory: () => refetch(),
    };
};