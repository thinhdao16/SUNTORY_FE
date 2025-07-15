import React from "react";
import { useForm } from "react-hook-form";
import InputTextField from "@/components/input/InputFieldText";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import MainButton from "@/components/common/MainButton";
import { useHistory } from "react-router";
import { useAuthStore } from "@/store/zustand/auth-store";
import CustomButton from "@/components/button/CustomButton";
import { useResendOtp } from "@/pages/Auth/hooks/useAuth";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import BackIcon from "@/icons/logo/back.svg?react";

interface ForgotPasswordForm {
    emailOrPhone: string;
}

const ForgotPassword: React.FC = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ForgotPasswordForm>();
    const history = useHistory();
    const { mutate: resendOtpMutate, isLoading } = useResendOtp();
    const { isAuthenticated } = useAuthStore();

    const onSubmit = (data: ForgotPasswordForm) => {
        localStorage.setItem("register-email", data.emailOrPhone);
        localStorage.setItem("otpType", "reset-password");
        resendOtpMutate(
            { email: data.emailOrPhone, otpType: "reset-password" },
            {
                onSuccess: () => {
                    history.push("/otp");
                }
            }
        );
    };

    const emailOrPhoneValue = watch("emailOrPhone");

    return (
        <AuthCardLayout title={t("Reset Password")}>
            <CustomButton
                icon={<BackIcon aria-label={t("Back")} />}
                className="fixed top-6 left-6"
                back
            />
            <form onSubmit={handleSubmit(onSubmit)}>
                <InputTextField
                    label={t("Email")}
                    id="emailOrPhone"
                    {...register("emailOrPhone", {
                        required: t("Email is required"),
                        validate: (v) =>
                            /^\d+$/.test(v)
                                ? /^(\+84|84|0)?[1-9][0-9]{8,9}$/.test(v.replace(/\s+/g, "")) || t("Invalid phone")
                                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t("Invalid email"),
                    })}
                    placeholder={t("Enter your email")}
                    error={errors.emailOrPhone?.message}
                    required
                    validateType={/^\d+$/.test(emailOrPhoneValue || "") ? "phone" : "email"}
                />

                <MainButton type="submit">{t("Send Reset Link")}</MainButton>
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

export default ForgotPassword;
