import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "@/store/zustand/auth-store";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import InputPasswordField from "@/components/input/InputPasswordField";
import MainButton from "@/components/common/MainButton";
import { useChangePassword } from "../hooks/useAuth";
import BackIcon from "@/icons/logo/back.svg?react";

import { t } from "@/lib/globalT";
import { IonIcon, IonTitle } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import PageContainer from "@/components/layout/PageContainer";
interface ChangePasswordForm {
    currentPassword: string;
    password: string;
    confirmPassword: string;
}

const ChangePassword: React.FC = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChangePasswordForm>();

    const { isAuthenticated } = useAuthStore();
    const history = useHistory();
    const { mutate: updatePasswordMutate, isLoading } = useChangePassword();



    const onSubmit = (data: ChangePasswordForm) => {
        updatePasswordMutate(
            {
                currentPassword: data.currentPassword,
                password: data.password,
                confirmPassword: data.confirmPassword,
            },
            {
                onSuccess: () => {
                    setTimeout(() => {
                        if (isAuthenticated) {
                            history.replace("/profile-setting");
                        } else {
                            history.replace("/login");
                        }
                    }, 500);
                },
            }
        );
    };

    return (
        <PageContainer className="py-2 px-6">
            <div className="flex items-center justify-between mb-6">
                <button
                    className="w-10 h-10 flex items-center justify-center font-medium rounded-full hover:bg-gray-100 p-2"
                    onClick={() => history.goBack()}
                    type="button"
                >
                    <IonIcon icon={arrowBack} className="text-black" style={{ width: 20, height: 20, color: 'black', textEmphasisColor: 'black' }} />
                </button>
                <span className="text-center font-bold text-black ">
                    {t("Change Password")}
                </span>
                {/* Spacer to balance header width with back button */}
                <div className="w-10 h-10" />
            </div>
            <div className="min-h-[calc(100vh-100px)] flex items-center">
                <div className="w-full max-w-m mx-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <InputPasswordField
                            label={t("Current password")}
                            id="currentPassword"
                            showIcon
                            placeholder={t("Enter your current password")}
                            error={errors.currentPassword?.message}
                            required
                            {...register("currentPassword", {
                                required: t("Password is required"),
                                minLength: { value: 8, message: t("At least 8 characters") },
                            })}
                        />
                        <InputPasswordField
                            label={t("Enter new password")}
                            id="password"
                            showIcon
                            placeholder={t("Enter new password")}
                            error={errors.password?.message}
                            required
                            {...register("password", {
                                required: t("Password is required new"),
                                minLength: { value: 8, message: t("At least 8 characters") },
                            })}
                        />
                        <InputPasswordField
                            label={t("Re-enter new password")}
                            id="confirmPassword"
                            showIcon
                            placeholder={t("Confirm new password")}
                            error={errors.confirmPassword?.message}
                            required
                            {...register("confirmPassword", {
                                required: t("Confirm password is required new"),
                                validate: (value) => value === watch("password") || t("Passwords do not match"),
                            })}
                        />

                        <MainButton
                            type="submit"
                            className="mt-4 h-12 rounded-2xl text-white font-semibold"
                            disabled={isLoading}
                        >
                            {t("Change Password")}
                        </MainButton>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
};

export default ChangePassword;
