import React from "react";
import { useForm, Controller } from "react-hook-form";
import { t } from "@/lib/globalT";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import InputTextField from "@/components/input/InputFieldText";
import SelectMenu from "@/components/select/SelectMenu";
import MainButton from "@/components/common/MainButton";
import { useQueryClient } from "react-query";
import { useUpdateAccountInfo } from "../hooks/useProfile";
import dayjs from "dayjs";
import useKeyboardManager from "@/hooks/useKeyboardManager";
import { useKeyboardResize } from "@/pages/Chat/hooks/useKeyboardResize";

const genderOptions = [
    { label: t("Male"), code: "Nam" },
    { label: t("Female"), code: "Nữ" },
    { label: t("Other"), code: "Khác" },
];

const AccountEdit: React.FC = () => {
    const { data: userInfo } = useAuthInfo();
    const queryClient = useQueryClient();
    const updateAccountInfo = useUpdateAccountInfo();
    const { isKeyboardVisible, heightKeyBoard } = useKeyboardManager();
    const { keyboardHeight, keyboardResizeScreen } = useKeyboardResize();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            firstname: userInfo?.firstname || "",
            lastname: userInfo?.lastname || "",
            dateOfBirth: userInfo?.dateOfBirth
                ? dayjs(userInfo.dateOfBirth).format("YYYY-MM-DD")
                : "",
            gender: userInfo?.gender === 1 ? "Nam" : userInfo?.gender === 2 ? "Nữ" : "Khác",
            height: userInfo?.height?.toString() || "",
            weight: userInfo?.weight?.toString() || "",
        },
    });

    const onSubmit = async (data: any) => {
        updateAccountInfo.mutate(
            {
                ...userInfo,
                id: userInfo?.id ?? 0,
                firstname: data.firstname,
                lastname: data.lastname,
                birthDay: data.dateOfBirth,
                gender: data.gender === "Nam" ? 1 : data.gender === "Nữ" ? 2 : 0,
                height: Number(data.height),
                weight: Number(data.weight),
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries("authInfo");
                },
            }
        );
    };

    return (
        <>
            <form className="space-y-4 pb-20" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-2">
                    <Controller
                        name="firstname"
                        control={control}
                        rules={{ required: t("First name is required") }}
                        render={({ field }) => (
                            <InputTextField
                                label={t("First Name")}
                                error={errors.firstname?.message}
                                inputClassName="text-netural-500"
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="lastname"
                        control={control}
                        rules={{ required: t("Last name is required") }}
                        render={({ field }) => (
                            <InputTextField
                                label={t("Last Name")}
                                error={errors.lastname?.message}
                                {...field}
                            />
                        )}
                    />
                </div>
                <div className="flex gap-2">
                    <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field }) => (
                            <InputTextField
                                label={t("Birthday")}
                                type="date"
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <SelectMenu
                                label={t("Gender")}
                                options={genderOptions}
                                control={control}
                                menuButtonClassName="py-3 !border-netural-200"
                                labelClassName="!mb-0"
                                {...field}
                            />
                        )}
                    />
                </div>
                <div className="flex gap-2">
                    <Controller
                        name="height"
                        control={control}
                        render={({ field }) => (
                            <InputTextField
                                label={t("Height") + " (cm)"}
                                type="number"
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="weight"
                        control={control}
                        render={({ field }) => (
                            <InputTextField
                                label={t("Weight") + " (kg)"}
                                type="number"
                                {...field}
                            />
                        )}
                    />
                </div>
                {/* Ẩn nút Save mặc định nếu muốn, hoặc để đây cho desktop */}
                {/* {!isKeyboardVisible && ( */}
                {/* <MainButton type="submit" className="w-full mt-4">
                    {t("Save")}
                </MainButton> */}
                {/* )} */}
            </form>
            {isKeyboardVisible && (
                <div
                    style={{
                        position: "fixed",
                        left: 0,
                        right: 0,
                        bottom: heightKeyBoard,
                        zIndex: 1000,
                        transition: "bottom 0.2s",
                    }}
                >
                    <MainButton
                        type="submit"
                        className="w-full"
                        onClick={handleSubmit(onSubmit)}
                    >
                        {t("Save")}
                    </MainButton>
                </div>
            )}
        </>
    );
};

export default AccountEdit;