import { useEffect } from "react";
import { useQuery } from "react-query";
import { getChatHistoryModule } from "@/services/chat/chat-service";
import { useToastStore } from "@/store/zustand/toast-store";
import { useChatStore } from "@/store/zustand/chat-store";

export const useChatHistoryLastModule = () => {
    const { showToast } = useToastStore();
    const { chatHistory, setChatHistory } = useChatStore();

    const {
        data,
        isLoading,
        isError,
        error: queryError,
        refetch,
    } = useQuery(
        ["chatHistory"],
        getChatHistoryModule,
        {
            staleTime: 1000 * 60 * 5,
            cacheTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            onSuccess: (data) => {
                setChatHistory(data);
            },
            onError: (err: any) => {
                const errorMessage = err?.response?.data?.message || "Failed to load chat history";
                showToast(errorMessage, 3000, "error");
            },
        }
    );

    return {
        chatHistory,
        isLoading,
        error: queryError,
        refetch,
        refreshHistory: () => refetch(),
    };
};