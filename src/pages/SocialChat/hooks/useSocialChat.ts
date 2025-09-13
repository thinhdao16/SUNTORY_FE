import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "react-query";
import { addGroupMembersApi, chatRoomAttachments, createAnonymousChatRoom, createSocialChatMessageApi, getChatRoomByCode, getNotificationCounts, getSocialChatMessages, getUserChatRooms, removeGroupMembersApi, revokeSocialChatMessageApi, updateSocialChatMessageApi, updateChatRoomApi, leaveChatRoomApi, toggleChatRoomQuietStatusApi, transferAdminApi } from "@/services/social/social-chat-service";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { AddGroupMembersPayload, CreateSocialChatMessagePayload, NotificationCounts, RemoveGroupMembersPayload, RevokeSocialChatMessagePayload, UpdateSocialChatMessagePayload, UpdateChatRoomPayload, UseAddGroupMembersOptions, UseRemoveGroupMembersOptions } from "@/services/social/social-chat-type";
import { ChatInfo } from "@/types/social-chat";
import { useAuthStore } from "@/store/zustand/auth-store";
import { removeChatRoomApi } from "../../../services/social/social-chat-service";

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
    participants: {
        user: {
            id: number;
            name: string;
            avatar: string;
            fullName?: string;

        };
        isAdmin: number;
        userId?: number | undefined;
    }[];
    chatInfo: ChatInfo | null;
    isFriend?: boolean;
    friendRequest?: {
        fromUserId: number;
        toUserId: number;
    };
    isQuiet?: boolean;
    activeUserIds?: number[];
    activeUserCount?: number;
    lastActiveTime?: string;
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
interface UseUpdateChatRoomOptions {
    onSuccess?: (data: any, variables: UpdateChatRoomPayload) => void;
    onError?: (error: any) => void;
}

export const useAddGroupMembers = (options?: UseAddGroupMembersOptions) => {
    const showToast = useToastStore.getState().showToast;
    const queryClient = useQueryClient();

    return useMutation(
        (payload: AddGroupMembersPayload) => addGroupMembersApi(payload),
        {
            onSuccess: (data, variables) => {
                showToast("Đã thêm thành viên vào nhóm", 2000, "success");
                queryClient.invalidateQueries(["chatRoom", variables.chatCode]);
                options?.onSuccess?.(data, variables);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || "Không thể thêm thành viên";
                showToast(errorMessage, 3000, "error");
                options?.onError?.(error);
            },
        }
    );
};


export const useRemoveGroupMembers = (options?: UseRemoveGroupMembersOptions) => {
    const showToast = useToastStore.getState().showToast;
    const queryClient = useQueryClient();

    return useMutation(
        (payload: RemoveGroupMembersPayload) => removeGroupMembersApi(payload),
        {
            onSuccess: (data, variables) => {
                showToast("Đã xóa thành viên khỏi nhóm", 2000, "success");

                queryClient.invalidateQueries(["chatRoom", variables.chatCode]);

                options?.onSuccess?.(data, variables);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || "Không thể xóa thành viên";
                showToast(errorMessage, 3000, "error");
                options?.onError?.(error);
            },
        }
    );
};
export const useUserChatRooms = (pageSize = 15,setChatRooms:any ) => {
    return useInfiniteQuery(
        ["chatRooms"],
        ({ pageParam = 0 }) => getUserChatRooms({ PageNumber: pageParam, PageSize: pageSize }),
        {
            getNextPageParam: (lastPage, pages) => {
                const totalLoaded = pages.flat().length;
                if (lastPage.length < pageSize) return undefined;
                return Math.floor(totalLoaded / pageSize);
            },
            onSuccess: (data) => {
                try {
                    const pages = data?.pages ?? [];
                    const flat = Array.isArray(pages) ? pages.flat() : [];
                    setChatRooms(flat);
                } catch (e) {
                    console.error("[useUserChatRooms] onSuccess log error", e);
                }
            },
            onError: (err) => {
                console.error("[useUserChatRooms] onError", err);
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
export const useNotificationCounts = (options?: {
    enabled?: boolean;
    refetchInterval?: number;
}) => {
    const { enabled = true, refetchInterval = 30000 } = options || {};
    const { setNotificationCounts } = useSocialChatStore();

    return useQuery({
        queryKey: ["notificationCounts"],
        queryFn: getNotificationCounts,
        enabled,
        refetchInterval,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        onSuccess: (data: NotificationCounts) => {
            const currentCounts = useSocialChatStore.getState().notificationCounts;
            const newCounts = {
                userId: data.userId || 0,
                unreadRoomsCount: data.unreadRoomsCount || 0,
                pendingFriendRequestsCount: data.pendingFriendRequestsCount || 0,
            };
            if (
                currentCounts.userId !== newCounts.userId ||
                currentCounts.unreadRoomsCount !== newCounts.unreadRoomsCount ||
                currentCounts.pendingFriendRequestsCount !== newCounts.pendingFriendRequestsCount
            ) {
                setNotificationCounts(newCounts);
            } else {
            }
        },
        onError: (error: any) => {
            if (error?.response?.status === 401) {
                console.warn("Unauthorized access to notification counts");
            } else {
                console.error("Failed to fetch notification counts:", error);
            }
        },
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        }
    });
};

export const useGetChatRoomAttachments = (
    chatCode: string,
    pageSize = 20,
    options?: {
        enabled?: boolean,
        onSuccess?: (data: any) => void,
        onError?: (error: any) => void
    }
) => {
    const { enabled = true } = options || {};

    return useInfiniteQuery({
        queryKey: ['chatRoomAttachments', chatCode],
        queryFn: ({ pageParam = 0 }) => chatRoomAttachments({
            ChatCode: chatCode,
            PageNumber: pageParam,
            PageSize: pageSize
        }),
        enabled: !!chatCode && enabled,
        onSuccess: options?.onSuccess,
        onError: options?.onError,
        getNextPageParam: (lastPage, pages) => {
            if (!lastPage?.data) return undefined;
            const { nextPage, pageNumber, totalPages } = lastPage.data;
            if (nextPage === false || pageNumber + 1 >= totalPages) {
                return undefined;
            }
            return pageNumber + 1;
        },
        refetchOnWindowFocus: false,
    });
};

export const useUpdateChatRoom = (options?: UseUpdateChatRoomOptions) => {
    const showToast = useToastStore.getState().showToast;
    const queryClient = useQueryClient();
    const setRoomChatInfo = useSocialChatStore((state) => state.setRoomChatInfo);
    const roomChatInfo = useSocialChatStore((state) => state.roomChatInfo);

    return useMutation({
        mutationFn: (payload: UpdateChatRoomPayload) => updateChatRoomApi(payload),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ["chatRoom", variables.chatCode] });

            const previousData = queryClient.getQueryData(["chatRoom", variables.chatCode]);

            if (roomChatInfo && roomChatInfo.code === variables.chatCode) {
                const updatedRoom = {
                    ...roomChatInfo,
                    title: variables.title || roomChatInfo.title,
                    avatarRoomChat: variables.avatarRoomChat || roomChatInfo.avatarRoomChat
                };

                setRoomChatInfo(updatedRoom);

                queryClient.setQueryData(["chatRoom", variables.chatCode], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        title: variables.title || old.title,
                        avatarRoomChat: variables.avatarRoomChat || old.avatarRoomChat
                    };
                });
            }

            return { previousData };
        },
        onError: (error: any, variables, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(["chatRoom", variables.chatCode], context.previousData);

                if (roomChatInfo && roomChatInfo.code === variables.chatCode) {
                    setRoomChatInfo(context.previousData);
                }
            }

            const errorMessage = error?.response?.data?.message || "Không thể cập nhật thông tin nhóm";
            showToast(errorMessage, 3000, "error");
            options?.onError?.(error);
        },
        onSuccess: (data, variables) => {
            showToast("Cập nhật thông tin nhóm thành công", 2000, "success");

            queryClient.invalidateQueries({ queryKey: ["chatRoom", variables.chatCode] });

            options?.onSuccess?.(data, variables);
        },
    });
};
export const useLeaveChatRoom = (options?: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any) => void;
}) => {
    const queryClient = useQueryClient();
    const setRoomChatInfo = useSocialChatStore.getState().setRoomChatInfo;
    const showToast = useToastStore.getState().showToast;

    return useMutation(
        (payload: any) => leaveChatRoomApi(payload),
        {
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey: ['chatRooms'] });
                const previousRooms = queryClient.getQueryData<any[]>(['chatRooms']);
                // queryClient.setQueryData(['chatRooms'], (old: any[] | undefined) =>
                //     (old || [])?.filter(r => r.code !== variables.chatCode)
                // );
                const currentRoom: any = useSocialChatStore.getState().roomChatInfo;
                setRoomChatInfo(currentRoom?.code === variables.chatCode ? null : currentRoom);
                return { previousRooms };
            },
            onError: (err: any, variables, context: any) => {
                if (context?.previousRooms) {
                    queryClient.setQueryData(['chatRooms'], context.previousRooms);
                }
                const msg = err?.response?.data?.message || "Unable to leave chat";
                showToast(msg, 3000, "error");
                options?.onError?.(err);
            },
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
                queryClient.invalidateQueries({ queryKey: ['chatRoom', variables.chatCode] });
                showToast("Left the group", 2000, "success");
                options?.onSuccess?.(data, variables);
            }
        }
    );
};
export const useToggleQuietStatus = (options?: {
    onSuccess?: (data: any, variables: { chatCode: string; isQuiet: boolean }) => void;
    onError?: (err: any) => void;
}) => {
    const queryClient = useQueryClient();
    const setRoomChatInfo = useSocialChatStore.getState().setRoomChatInfo;
    const showToast = useToastStore.getState().showToast;
    return useMutation(
        (payload: { chatCode: string; isQuiet: boolean }) => toggleChatRoomQuietStatusApi(payload),
        {
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey: ["chatRoom", variables.chatCode] });
                await queryClient.cancelQueries({ queryKey: ["chatRooms"] });
                const previousRoom = queryClient.getQueryData<any>(["chatRoom", variables.chatCode]);
                const previousRooms = queryClient.getQueryData<any[]>(["chatRooms"]);
                queryClient.setQueryData(["chatRoom", variables.chatCode], (old: any) => {
                    if (!old) return old;
                    const participants = Array.isArray(old.participants)
                        ? old.participants.map((p: any) =>
                            p.userId === useAuthStore.getState().user?.id ? { ...p, isQuiet: variables.isQuiet ? 1 : 0 } : p
                        )
                        : old.participants;
                    return { ...old, participants };
                });
                try {
                    const currentRoom = useSocialChatStore.getState().roomChatInfo;
                    if (currentRoom && currentRoom.code === variables.chatCode) {
                        const updatedParticipants = Array.isArray(currentRoom.participants)
                            ? currentRoom.participants.map((p: any) =>
                                p.userId === useAuthStore.getState().user?.id ? { ...p, isQuiet: variables.isQuiet ? 1 : 0 } : p
                            )
                            : currentRoom.participants;
                        setRoomChatInfo({ ...currentRoom, participants: updatedParticipants });
                    }
                } catch (e) { }
                queryClient.setQueryData(["chatRooms"], (old: any) => {
                    if (!old) return old;

                    const updateRoom = (r: any) => {
                        if (!r || r.code !== variables.chatCode) return r;
                        const participants = Array.isArray(r.participants)
                            ? r.participants.map((p: any) => {
                                  const pid = p.userId ?? p.user?.id ?? p.user?.userId;
                                  if (pid === undefined) return p;
                                  return { ...p, isQuiet: variables.isQuiet ? 1 : 0 };
                              })
                            : r.participants;
                        return { ...r, participants };
                    };

                    // old is plain array of rooms
                    if (Array.isArray(old)) {
                        return old.map(updateRoom);
                    }

                    // old is infinite query result { pages: [...], pageParams: [...] }
                    if (old.pages && Array.isArray(old.pages)) {
                        return {
                            ...old,
                            pages: old.pages.map((page: any) => {
                                // page might be an array of rooms
                                if (Array.isArray(page)) {
                                    return page.map(updateRoom);
                                }
                                // page might be { data: [...] } or { data: { data: [...] } }
                                if (page && Array.isArray(page.data)) {
                                    return { ...page, data: page.data.map(updateRoom) };
                                }
                                if (page && page.data && Array.isArray(page.data.data)) {
                                    return {
                                        ...page,
                                        data: { ...page.data, data: page.data.data.map(updateRoom) },
                                    };
                                }
                                return page;
                            }),
                        };
                    }

                    // unknown shape — return as-is
                    return old;
                });
                return { previousRoom, previousRooms };
            },
            onError: (err: any, variables, context: any) => {
                if (context?.previousRoom) {
                    queryClient.setQueryData(["chatRoom", variables.chatCode], context.previousRoom);
                    try { setRoomChatInfo(context.previousRoom); } catch (e) { }
                }
                if (context?.previousRooms) {
                    queryClient.setQueryData(["chatRooms"], context.previousRooms);
                }
                const msg = err?.response?.data?.message || "Unable to change notification setting";
                showToast(msg, 3000, "error");
                options?.onError?.(err);
            },
            onSuccess: (data, variables) => {
                showToast(variables.isQuiet ? "Đã tắt thông báo" : "Đã bật thông báo", 2000, "success");
                queryClient.invalidateQueries({ queryKey: ["chatRoom", variables.chatCode] });
                queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
                options?.onSuccess?.(data, variables);
            },
        }
    );
};
export const useRemoveChatRoom = (options?: {
    onSuccess?: (data: any, variables: { chatCode: string }) => void;
    onError?: (error: any) => void;
}) => {
    const queryClient = useQueryClient();
    const setRoomChatInfo = useSocialChatStore.getState().setRoomChatInfo;
    const showToast = useToastStore.getState().showToast;

    return useMutation(
        (payload: { chatCode: string }) => removeChatRoomApi(payload),
        {
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey: ["chatRooms"] });
                await queryClient.cancelQueries({ queryKey: ["chatRoom", variables.chatCode] });

                const previousRooms = queryClient.getQueryData<any[]>(["chatRooms"]);
                const previousRoom = queryClient.getQueryData<any>(["chatRoom", variables.chatCode]);

                // queryClient.setQueryData(["chatRooms"], (old: any[] | undefined) =>
                //     (old || [])?.filter((r) => r?.code !== variables.chatCode)
                // );

                try {
                    const current = useSocialChatStore.getState().roomChatInfo;
                    if (current && current.code === variables.chatCode) {
                        setRoomChatInfo(null as any);
                    }
                } catch (e) { }

                queryClient.setQueryData(["chatRoom", variables.chatCode], undefined);

                return { previousRooms, previousRoom };
            },
            onError: (err: any, variables, context: any) => {
                if (context?.previousRooms) {
                    queryClient.setQueryData(["chatRooms"], context.previousRooms);
                }
                if (context?.previousRoom) {
                    queryClient.setQueryData(["chatRoom", variables.chatCode], context.previousRoom);
                    try { setRoomChatInfo(context.previousRoom); } catch (e) { }
                }
                const msg = err?.response?.data?.message || "Unable to remove chat room";
                showToast(msg, 3000, "error");
                options?.onError?.(err);
            },
            onSuccess: (data, variables) => {
                showToast("Đã xóa nhóm", 2000, "success");
                queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
                queryClient.removeQueries({ queryKey: ["chatRoom", variables.chatCode] });
                options?.onSuccess?.(data, variables);
            }
        }
    );
};
export const useTransferAdmin = (options?: {
    onSuccess?: (data: any, variables: { chatCode: string; newAdminUserId: number }) => void;
    onError?: (err: any) => void;
}) => {
    const queryClient = useQueryClient();
    const setRoomChatInfo = useSocialChatStore.getState().setRoomChatInfo;
    const showToast = useToastStore.getState().showToast;

    return useMutation(
        (payload: { chatCode: string; newAdminUserId: number }) => transferAdminApi(payload),
        {
            onMutate: async (variables) => {
                await queryClient.cancelQueries({ queryKey: ["chatRoom", variables.chatCode] });
                await queryClient.cancelQueries({ queryKey: ["chatRooms"] });

                const previousRoom = queryClient.getQueryData<any>(["chatRoom", variables.chatCode]);
                const previousRooms = queryClient.getQueryData<any[]>(["chatRooms"]);

                queryClient.setQueryData(["chatRoom", variables.chatCode], (old: any) => {
                    if (!old) return old;
                    if (!Array.isArray(old.participants)) {return old;}
                    const newParticipants = old.participants.map((p: any) => {
                        const participantUserId = p.userId ?? p.user?.id ?? p.user?.userId;
                        if (participantUserId === undefined) return p;
                        return {
                            ...p,
                            isAdmin: participantUserId === variables.newAdminUserId ? 1 : 0,
                        };
                    });
                    return { ...old, participants: newParticipants };
                });
                try {
                    const current = useSocialChatStore.getState().roomChatInfo;
                    if (current && current.code === variables.chatCode) {
                        const participants = Array.isArray(current.participants)
                            ? current.participants.map((p: any) => ({
                                ...p,
                                isAdmin: p.userId === variables.newAdminUserId ? 1 : (p.isAdmin ? 0 : p.isAdmin)
                            }))
                            : current.participants;
                        setRoomChatInfo({ ...current, participants } as any);
                    }
                } catch (e) { }
                queryClient.setQueryData(["chatRooms"], (old: any) => {
                    if (!old) return old;
                    const updateRoom = (r: any) => {
                        if (!r || r.code !== variables.chatCode) return r;
                        const participants = Array.isArray(r.participants)
                            ? r.participants.map((p: any) => ({
                                ...p,
                                isAdmin: p.userId === variables.newAdminUserId ? 1 : (p.isAdmin ? 0 : p.isAdmin)
                            }))
                            : r.participants;
                        return { ...r, participants };
                    };
                    if (old.pages && Array.isArray(old.pages)) {
                        return {
                            ...old,
                            pages: old.pages.map((page: any) => {
                                if (Array.isArray(page)) {
                                    return page.map(updateRoom);
                                }
                                return page;
                            }),
                        };
                    }
                    if (Array.isArray(old)) {
                        return old.map(updateRoom);
                    }
                    return old;
                });
                return { previousRoom, previousRooms };
            },
            onError: (err: any, variables, context: any) => {
                if (context?.previousRoom) {
                    queryClient.setQueryData(["chatRoom", variables.chatCode], context.previousRoom);
                    try { setRoomChatInfo(context.previousRoom); } catch (e) {}
                }
                if (context?.previousRooms) {
                    queryClient.setQueryData(["chatRooms"], context.previousRooms);
                }
                const msg = err?.response?.data?.message || "Unable to transfer admin";
                showToast(msg, 3000, "error");
                options?.onError?.(err);
            },
            onSuccess: (data, variables) => {
                showToast("Đã chuyển quyền quản trị", 2000, "success");
                queryClient.invalidateQueries({ queryKey: ["chatRoom", variables.chatCode] });
                queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
                options?.onSuccess?.(data, variables);
            },
        }
    );
};