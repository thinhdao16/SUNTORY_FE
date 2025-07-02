import React, { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { t } from "@/lib/globalT";
import { useAuthInfo } from "@/pages/Auth/hooks/useAuthInfo";
import InputTextField from "@/components/input/InputFieldText";
import SelectMenu from "@/components/select/SelectMenu";
import MainButton from "@/components/common/MainButton";
import { useQueryClient } from "react-query";
import { useUpdateAccountInfo } from "../hooks/useProfile";
import dayjs from "dayjs";
import HealthTextInput from "@/components/input/HealthTextInput";

const genderOptions = [
    { label: "Male", code: "Male" },
    { label: "Female", code: "Female" },
    { label: "Other", code: "Other" },
];

const AccountEdit: React.FC = () => {
    const { data: userInfo } = useAuthInfo();
    const queryClient = useQueryClient();
    const updateAccountInfo = useUpdateAccountInfo();

    const birthdayInputRef = useRef<HTMLInputElement>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
        register,
    } = useForm({
        defaultValues: {
            firstname: userInfo?.firstname || "",
            lastname: userInfo?.lastname || "",
            dateOfBirth: userInfo?.dateOfBirth
                ? dayjs(userInfo.dateOfBirth).format("YYYY-MM-DD")
                : "",
            gender: userInfo?.gender === 1 ? "Male" : userInfo?.gender === 2 ? "Female" : "Other",
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
                birthDay: data.dateOfBirth ? data.dateOfBirth : null,
                gender: data.gender === "Male" ? 1 : data.gender === "Female" ? 2 : 0,
                height: data.height !== "" ? Number(data.height) : null,
                weight: data.weight !== "" ? Number(data.weight) : null,
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
                <div className="flex gap-2 w-full">
                    <div className="w-2/3 min-w-0">
                        <Controller
                            name="dateOfBirth"
                            control={control}
                            render={({ field }) => (
                                <HealthTextInput
                                    label={t("Birthday")}
                                    register={register}
                                    required={false}
                                    placeholder={t("mm/dd/yyyy")}
                                    error={errors.dateOfBirth}
                                    type="date"
                                    inputRef={birthdayInputRef}
                                    className="py-3 pr-2 h-[44px] ml-0 w-full min-w-0 appearance-none overflow-hidden"
                                    classNameContainer="mb-0"
                                    classNameLable="!mb-0"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                    <div className="w-1/3 min-w-0">
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
                </div>


                <div className="flex gap-2">
                    <Controller
                        name="height"
                        control={control}
                        render={({ field }) => (
                            <InputTextField
                                label={`${t("Height")} (${t("cm")})`}
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
                                label={`${t("Weight")} (${t("kg")})`}
                                type="number"
                                {...field}
                            />
                        )}
                    />
                </div>
                <MainButton type="submit" className="w-full mt-4">
                    {t("Save")}
                </MainButton>
            </form>
        </>
    );
};

export default AccountEdit;