import { createChatGroup, CreateGroupPayload } from "@/services/social/social-group-service";
import { useMutation } from "react-query";
import { useSocialChatStore } from "@/store/zustand/social-chat-store";

export const useCreateChatGroup = (history: any) => {
    const { setRoomChatInfo, setRoomMembers } = useSocialChatStore();

    return useMutation(
        (payload: CreateGroupPayload) => createChatGroup(payload),
        {
            onSuccess: (data) => {
                if (!data || data.length === 0) {
                    return;
                }
                const chatInfo = data?.participants?.[0].chatInfo;
                setRoomChatInfo({
                    id: chatInfo.id,
                    code: chatInfo.code,
                    title: chatInfo.title,
                    avatarRoomChat: "", 
                    type: chatInfo.type,
                    status: chatInfo.status,
                    createDate: chatInfo.createDate,
                    updateDate: "", 
                    unreadCount: 0,
                    lastMessageInfo: null,
                    topic: chatInfo.topic,
                });
                setRoomMembers(data);
                history.push(`/social-chat/t/${data.chatCode}`);
            },
            onError: (error: any) => {
                const message = error?.response?.data?.message || "Đã xảy ra lỗi khi tạo nhóm.";
            },
        }
    );
};
