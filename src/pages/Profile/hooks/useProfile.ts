import { useMutation, useQueryClient } from "react-query";
import { updateAccountInfo, uploadAvatar } from "@/services/auth/auth-service";
import { useToastStore } from "@/store/zustand/toast-store";

export const useUpdateAccountInfo = () => {
    const queryClient = useQueryClient();
    const showToast = useToastStore.getState().showToast;

    return useMutation(updateAccountInfo, {
        onSuccess: () => {
            showToast(t("Update done!"), 2000, "success");
            queryClient.invalidateQueries("authInfo");
        },
        onError: (error: any) => {
            const errorMessageKey = error?.response?.data?.message || "update_profile_failed";
            showToast(t(errorMessageKey, { ns: "api" }), 3000, "error");
        },
    });
};
export function useUploadAvatar() {
    const showToast = useToastStore.getState().showToast;
    return useMutation(uploadAvatar, {
        onSuccess: () => {
            showToast(t("Upload successful!"), 2000, "success");
        },
        onError: (error: any) => {
            showToast(
                error?.response?.data?.message || t("Image upload failed!"),
                3000,
                "error"
            );
        },
    });
}