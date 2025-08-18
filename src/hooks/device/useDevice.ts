import { useMutation } from "react-query";
import { updateNewDevice } from "@/services/device/device-service";
import { useToastStore } from "@/store/zustand/toast-store";

export const useUpdateNewDevice = () => {
    const showToast = useToastStore.getState().showToast;
    return useMutation(updateNewDevice, {
        onSuccess: () => {
        },
        onError: (err: any) => {
            showToast(
                err?.response?.data?.message || "Cập nhật thiết bị thất bại!",
                3000,
                "error"
            );
        },
    });
};