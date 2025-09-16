import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "@/store/zustand/auth-store";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import InputPasswordField from "@/components/input/InputPasswordField";
import MainButton from "@/components/common/MainButton";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import { useChangePassword } from "../hooks/useAuth";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";
import { t } from "@/lib/globalT";
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
                            history.replace("/profile");
                        } else {
                            history.replace("/login");
                        }
                    }, 500);
                },
            }
        );
    };

    return (
        <AuthCardLayout>
            <div className="flex items-center justify-between mb-6">
                <button
                    className="w-10 h-10 flex items-center justify-center text-main font-medium rounded-full hover:bg-gray-100"
                    onClick={() => history.goBack()}
                    type="button"
                >
                    <CloseIcon aria-label="Back" />
                </button>
                <h1 className="flex-1 text-2xl text-center font-semibold text-main darkk:text-gray-200">
                    {t("Change Password")}
                </h1>
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
        </AuthCardLayout>
    );
};

export default ChangePassword;
