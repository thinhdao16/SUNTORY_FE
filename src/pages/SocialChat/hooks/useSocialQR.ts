  import { useMutation } from "react-query";
  import { createFriendshipByCodeRequest, CreateFriendshipByCodePayload } from "@/services/social/social-partner-service";
  import { useToastStore } from "@/store/zustand/toast-store";
  import { useSocialChatStore } from "@/store/zustand/social-chat-store";
  import { useHistory } from "react-router";

  export function useCreateFriendshipByCode(options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
  }) {
    const setRoomChatInfo = useSocialChatStore((s) => s.setRoomChatInfo);
    const showToast = useToastStore.getState().showToast;
    const history = useHistory()
    return useMutation(
      (data: CreateFriendshipByCodePayload) => createFriendshipByCodeRequest(data),
      {
        onSuccess: (data) => {
          const room = data?.roomChat;
          if (room) setRoomChatInfo(room);
          console.log(room)
          history.push(`/social-chat/t/${room?.code}`);
          options?.onSuccess?.(data);
        },
        onError: (error: any) => {
          showToast(
            error?.response?.data?.message || "Failed to create friendship. Please try again.",
            3000,
            "error"
          );
          options?.onError?.(error);
        },
      }
    );
  }
