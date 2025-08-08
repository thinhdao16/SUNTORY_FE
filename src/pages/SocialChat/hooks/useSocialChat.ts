import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "react-query";
import { createAnonymousChatRoom, createSocialChatMessageApi, getChatRoomByCode, getSocialChatMessages, getUserChatRooms, revokeSocialChatMessageApi, updateSocialChatMessageApi } from "@/services/social/social-chat-service";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { CreateSocialChatMessagePayload, RevokeSocialChatMessagePayload, UpdateSocialChatMessagePayload } from "@/services/social/social-chat-type";

export interface RoomChatInfo {
    id: number;
    code: string;
    title: string;
    avatarRoomChat: string;
    type: number;
    status: number;
    createDate: string;
    updateDate: string;
    unreadCount: number;
    lastMessageInfo: any;
    topic: any;
}
interface UseUpdateSocialChatMessageOptions {
    onSuccess?: (data: any, variables: UpdateSocialChatMessagePayload) => void;
    onError?: (error: any) => void;
}
interface UseRevokeSocialChatMessageOptions {
    // roomId?: string;
    onSuccess?: (data: any, variables: RevokeSocialChatMessagePayload) => void;
    onError?: (error: any) => void;
}

export const useUserChatRooms = (pageSize = 10) => {
    return useInfiniteQuery(
        ["chatRooms"],
        ({ pageParam = 0 }) => getUserChatRooms({ PageNumber: pageParam, PageSize: pageSize }),
        {
            getNextPageParam: (lastPage, pages) => {
                const totalLoaded = pages.flat().length;
                if (lastPage.length < pageSize) return undefined;
                return Math.floor(totalLoaded / pageSize);
            },
            // keepPreviousData: true,
            // staleTime: 1000 * 60 * 5,
        }
    );
};
export const useListChatRooms = (pageSize = 10) => {
    return useInfiniteQuery(
        ["chatRooms"],
        ({ pageParam = 0 }) => getUserChatRooms({ PageNumber: 0, PageSize: 50 }),
    );
};
export const useChatRoomByCode = (code: string, enabled = true) => {
    const { setRoomChatInfo } = useSocialChatStore();
    return useQuery(
        ["chatRoom", code],
        async () => {
            const data = await getChatRoomByCode(code);
            setRoomChatInfo(data);
            return data;
        },
        // {
        //     enabled: !!code && enabled,
        //     staleTime: 1000 * 60 * 5,
        // }
    );
};
export const useCreateAnonymousChat = () => {
    return useMutation({
        mutationFn: (otherUserId: number) => createAnonymousChatRoom(otherUserId),
    });
};

interface UseSendSocialChatMessageOptions {
    onSuccess?: (data: any, variables: CreateSocialChatMessagePayload) => void;
    onError?: (error: any) => void;
    roomId?: string;
}

export const useSendSocialChatMessage = (options?: UseSendSocialChatMessageOptions) => {
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);

    return useMutation(
        (payload: CreateSocialChatMessagePayload) => createSocialChatMessageApi(payload),
        {
            onSuccess: (data, variables) => {
                if (options?.roomId) {
                    // queryClient.invalidateQueries(["chatMessages", options.roomId]);
                }
                queryClient.invalidateQueries(["chatRooms"]);

                options?.onSuccess?.(data, variables);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || "Gửi tin nhắn thất bại";
                showToast(errorMessage, 3000, "error");
                options?.onError?.(error);
            },
        }
    );
};

export const useSocialChatMessages = (
    chatCode: string,
    pageSize = 20,
    keyword?: string
) => {
    return useInfiniteQuery(
        ["socialChatMessages", chatCode, keyword],
        ({ pageParam = 0 }) =>
            getSocialChatMessages({
                chatCode,
                keyword,
                PageNumber: pageParam,
                PageSize: pageSize,
            }),
        {
            enabled: !!chatCode,
            getNextPageParam: (lastPage, pages) => {
                if (lastPage && typeof lastPage === 'object' && 'pageNumber' in lastPage) {
                    if (lastPage.nextPage === false) {
                        return undefined;
                    }
                    return (lastPage.pageNumber || 0) + 1;
                }

                const safeLastPage = Array.isArray(lastPage) ? lastPage : [];
                if (safeLastPage.length < pageSize) {
                    return undefined;
                }
                return pages.length;
            },
            select: (data) => {
                return {
                    ...data,
                    pages: data.pages.map((page, index) => {
                        if (page && typeof page === 'object' && Array.isArray(page.data)) {
                            return [...page.data].reverse();
                        }
                        if (Array.isArray(page)) {
                            return [...page].reverse();
                        }
                        return [];
                    })
                };
            },
            staleTime: 1000 * 60 * 2,
            refetchOnWindowFocus: false,
        }
    );
};

export const useChatMessages = (chatCode: string) => {
    return useQuery(
        ["chatMessages", chatCode],
        () => getSocialChatMessages({
            chatCode,
            PageNumber: 0,
            PageSize: 50,
        }),
        {
            enabled: !!chatCode,
            staleTime: 1000 * 60 * 5,
        }
    );
};
export const useUpdateSocialChatMessage = (options?: UseUpdateSocialChatMessageOptions) => {
    const showToast = useToastStore.getState().showToast;
    const queryClient = useQueryClient();

    return useMutation(
        (payload: UpdateSocialChatMessagePayload) => updateSocialChatMessageApi(payload),
        {
            onSuccess: (data, variables) => {
                showToast("Tin nhắn đã được cập nhật", 2000, "success");
                
                options?.onSuccess?.(data, variables);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || "Cập nhật tin nhắn thất bại";
                showToast(errorMessage, 3000, "error");
                options?.onError?.(error);
            },
        }
    );
};
export const useRevokeSocialChatMessage = (options?: UseRevokeSocialChatMessageOptions) => {
    const showToast = useToastStore.getState().showToast;
    const queryClient = useQueryClient();

    return useMutation(
        (payload: RevokeSocialChatMessagePayload) => revokeSocialChatMessageApi(payload),
        {
            onSuccess: (data, variables) => {
                showToast("Tin nhắn đã được thu hồi", 2000, "success");
                
                // if (options?.roomId) {
                //     queryClient.invalidateQueries(["socialChatMessages", options.roomId]);
                // }
                
                options?.onSuccess?.(data, variables);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || "Thu hồi tin nhắn thất bại";
                showToast(errorMessage, 3000, "error");
                options?.onError?.(error);
            },
        }
    );
};