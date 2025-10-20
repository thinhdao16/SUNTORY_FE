import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "@/store/zustand/auth-store";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import InputPasswordField from "@/components/input/InputPasswordField";
import MainButton from "@/components/common/MainButton";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import { useUpdatePasswordOtp } from "../hooks/useAuth";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";

interface NewPasswordForm {
    password: string;
    confirmPassword: string;
}

const NewPassword: React.FC = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<NewPasswordForm>();

    const { isAuthenticated } = useAuthStore();
    const history = useHistory();
    const { mutate: updatePasswordMutate, isLoading } = useUpdatePasswordOtp();

    const email = localStorage.getItem("register-email") || "";
    const otp = localStorage.getItem("otp") || "";

    useEffect(() => {
        if (!otp || !email) {
            history.replace("/forgot-password");
        }
    }, [otp, email, history]);

    const onSubmit = (data: NewPasswordForm) => {
        updatePasswordMutate(
            {
                otp,
                email,
                password: data.password,
                confirmPassword: data.confirmPassword,
            },
            {
                onSuccess: () => {
                    localStorage.removeItem("otp");
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
            <button
                className="flex items-center gap-2 text-main font-medium fixed top-6 left-6"
                onClick={() => history.push("/login")}
            >
                <CloseIcon aria-label="Back" />
            </button>
            <h1 className="text-3xl text-center font-semibold mb-6 text-main darkk:text-gray-200">
                {t("Reset Password")}
            </h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                <InputPasswordField
                    label={t("Enter new password")}
                    id="password"
                    showIcon={false}
                    placeholder={t("Enter new password")}
                    error={errors.password?.message}
                    required
                    {...register("password", {
                        required: t("Password is required"),
                        minLength: { value: 8, message: t("At least 8 characters") },
                    })}
                />
                <InputPasswordField
                    label={t("Re-enter new password")}
                    id="confirmPassword"
                    showIcon={false}
                    placeholder={t("Confirm new password")}
                    error={errors.confirmPassword?.message}
                    required
                    {...register("confirmPassword", {
                        required: t("Confirm password is required"),
                        validate: (value) =>
                            value === watch("password") || t("Passwords do not match"),
                    })}
                />

                <MainButton type="submit" className="mt-4" disabled={isLoading}>
                    {t("Submit")}
                </MainButton>
            </form>

            {!isAuthenticated && (
                <div className="mt-6 flex justify-center items-center">
                    <span>{t("Remember your password?")}</span>
                    <a
                        href="/login"
                        className="ml-2 text-main font-semibold hover:underline"
                    >
                        {t("Login")}
                    </a>
                </div>
            )}

            <SocialLoginActions
                dividerText={t("OR")}
                showActions={false}
                showDivider={false}
                bottomLogo={{ icon: LogoIcon, textIcon: LogoTextIcon }}
                showTermsAndPrivacy={false}
            />
        </AuthCardLayout>
    );
};

export default NewPassword;
