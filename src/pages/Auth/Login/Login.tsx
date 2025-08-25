import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import InputTextField from "@/components/input/InputFieldText";
import InputPasswordField from "@/components/input/InputPasswordField";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import MainButton from "@/components/common/MainButton";
import { useGoogleLogin, useLogin } from "../hooks/useAuth";
import CustomButton from "@/components/button/CustomButton";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";
import { useTranslation } from "react-i18next";

interface LoginFormValues {
    emailOrPhone: string;
    password: string;
    deviceId: string | null;
    firebaseToken?: string;
}

const Login: React.FC = () => {
    const deviceInfo: { deviceId: string | null } = useDeviceInfo();
    const { t } = useTranslation()
    const { mutate: loginMutate, isLoading, error } = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<LoginFormValues>();

    const onSubmit = (data: LoginFormValues) => {
        loginMutate(
            { email: data.emailOrPhone, password: data.password, deviceId: deviceInfo.deviceId },
        );
    };

    const emailOrPhoneValue = watch("emailOrPhone");

    return (
        <AuthCardLayout className="h-screen flex flex-col justify-between">
            <CustomButton
                icon={<CloseIcon aria-label={t("Close")} />}
                className=" h-[50%]"
                navigateTo="/home"
            />
            <div>
                <h1 className="text-3xl text-center font-semibold mb-6 text-main darkk:text-gray-200">
                    {t("Sign In")}
                </h1>
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
                        className="mb-4"
                        inputClassName="text-netural-500"
                    />
                    <InputPasswordField
                        value={watch("password") || ""}
                        onChange={(e) => setValue("password", e.target.value)}
                        error={errors.password?.message}
                        showIcon={false}

                        required
                    />
                    <div className="flex items-center justify-between mt-1">
                        <a href="/forgot-password" className="text-main font-semibold">
                            {t("Forgot password?")}
                        </a>
                    </div>
                    <MainButton type="submit" disabled={isLoading}>
                        {t("Login")}
                    </MainButton>
                </form>
                <div className="mt-6 flex justify-center items-center">
                    <span>{t("Don't have an account?")}</span>
                    <a
                        href="/register"
                        className="ml-2 text-main font-semibold hover:underline"
                    >
                        {t("Sign Up")}
                    </a>
                </div>
            </div>
            <SocialLoginActions
                dividerText={t("OR")}
                bottomLogo={{ icon: LogoIcon, textIcon: LogoTextIcon }}
            />
        </AuthCardLayout>
    );
};

export default Login;
