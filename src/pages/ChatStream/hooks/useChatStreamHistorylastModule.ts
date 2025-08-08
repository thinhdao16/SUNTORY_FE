import { useQuery } from "react-query";
import { getChatHistoryModule } from "@/services/chat/chat-service";
import { useChatStore } from "@/store/zustand/chat-store";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";

export const useChatHistoryLastModule = (topicId: number, enabled: boolean) => {
    const { chatHistory, setChatHistory } = useChatStore();
    const { data: userInfo } = useAuthInfo();

    const {
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useQuery(
        ["chatHistory", topicId],
        () => {
            return getChatHistoryModule(topicId);
        },
        {
            enabled: !!userInfo?.id && enabled,
            onSuccess: (data) => {
                setChatHistory(data);
            },
            onError: () => {
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