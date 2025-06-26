import { useMutation, useQueryClient } from "react-query";
import { updateAccountInfo } from "@/services/auth/auth-service";
import { useToastStore } from "@/store/zustand/toast-store";

export const useUpdateAccountInfo = () => {
    const queryClient = useQueryClient();
    const showToast = useToastStore.getState().showToast;

    return useMutation(updateAccountInfo, {
        onSuccess: () => {
            showToast(t("Update profile successfully!"), 2000, "success");
            queryClient.invalidateQueries("authInfo");
        },
        onError: (error: any) => {
            showToast(
                error?.response?.data?.message || t("Update profile failed!"),
                3000,
                "error"
            );
        },
    });
};