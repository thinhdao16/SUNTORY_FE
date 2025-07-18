/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useHistory } from "react-router";

const genderOptions = [
    { label: "Male", code: "Male" },
    { label: "Female", code: "Female" },
    { label: "Other", code: "Other" },
];

const AccountEdit: React.FC = () => {
    const history = useHistory();
    const { data: userInfo } = useAuthInfo();
    const queryClient = useQueryClient();
    const updateAccountInfo = useUpdateAccountInfo();

    const birthdayInputRef = useRef<HTMLInputElement>(null);
    const minDate = dayjs().subtract(120, "year").format("YYYY-MM-DD");
    const maxDate = dayjs().subtract(6, "year").format("YYYY-MM-DD");
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
                    history.replace("/profile");
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
                        rules={{
                            required: t("First name is required"),
                            // pattern: {
                            //     value: /^[a-zA-ZÀ-ỹ\s'-]+$/,
                            //     message: t("First name cannot contain special characters"),
                            // },
                        }}
                        render={({ field }) => (
                            <InputTextField
                                label={t("First Name")}
                                required={true}
                                error={errors.firstname?.message}
                                inputClassName="text-netural-500"
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="lastname"
                        control={control}
                        rules={{
                            required: t("Last name is required"),
                            // pattern: {
                            //     value: /^[a-zA-ZÀ-ỹ\s'-]+$/,
                            //     message: t("Last name cannot contain special characters"),
                            // },
                        }}
                        render={({ field }) => (
                            <InputTextField
                                label={t("Last Name")}
                                required={true}
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
                            rules={{
                                validate: value => {
                                    if (!value) return true;
                                    const age = dayjs().diff(dayjs(value), "year");
                                    if (age < 0) return t("Birthday cannot be in the future");
                                    if (age > 120) return t("Age must be less than or equal to 120");
                                    return true;
                                }
                            }}
                            render={({ field }) => (
                                <HealthTextInput
                                    label={t("Birthday")}
                                    register={register}
                                    // required={true}
                                    placeholder={t("mm/dd/yyyy")}
                                    error={errors.dateOfBirth}
                                    type="date"
                                    inputRef={birthdayInputRef}
                                    min={minDate}
                                    max={maxDate}
                                    className="py-3 !pr-2 h-[44px] ml-0 w-full min-w-0 appearance-none overflow-hidden "
                                    classNameContainer="mb-0"
                                    classNameLable=" !text-sm"
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
                                    labelClassName=" !text-sm"
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
                        // rules={{
                        //     required: t("Height is required"),
                        //     min: { value: 50, message: t("Height must be at least 50cm") },
                        //     max: { value: 300, message: t("Height must be less than 300cm") },
                        // }}
                        render={({ field }) => (
                            <InputTextField
                                label={`${t("Height")} (${t("cm")})`}
                                type="number"
                                error={errors.height?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="weight"
                        control={control}
                        // rules={{
                        //     required: t("Weight is required"),
                        //     min: { value: 10, message: t("Weight must be at least 10kg") },
                        //     max: { value: 500, message: t("Weight must be less than 500kg") },
                        // }}
                        render={({ field }) => (
                            <InputTextField
                                label={`${t("Weight")} (${t("kg")})`}
                                type="number"
                                error={errors.weight?.message}
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