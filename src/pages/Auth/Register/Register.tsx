import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import InputTextField from "@/components/input/InputFieldText";
import InputPasswordField from "@/components/input/InputPasswordField";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import MainButton from "@/components/common/MainButton";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useToastStore } from "@/store/zustand/toast-store";
import CustomButton from "@/components/button/CustomButton";
import { registerSimple } from "@/services/auth/auth-service";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";

interface RegisterFormValues {
    firstName: string;
    lastName: string;
    emailOrPhone: string;
    password: string;
}

const Register: React.FC = () => {
    const history = useHistory();
    const setUserAfterRegister = useAuthStore((s) => s.setUserAfterRegister);
    const deviceInfo: { deviceId: string | null, language: string | null } = useDeviceInfo();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<RegisterFormValues>();
    const [loading, setLoading] = React.useState(false);

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        const showToast = useToastStore.getState().showToast;
        try {
            const payload = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.emailOrPhone,
                password: data.password,
                returnUrl: "",
                deviceId: deviceInfo.deviceId || "",
            };
            const res = await registerSimple(payload);
            setUserAfterRegister?.(res.data);
            localStorage.setItem("otpLastSent", Date.now().toString());
            localStorage.setItem("register-email", data.emailOrPhone);
            localStorage.setItem("otpType", "register");
            showToast(t("An OTP has been sent to your email. Please check it."), 2000, "info");
            history.push("/otp");
        } catch (err: any) {
            showToast(
                err?.response?.data?.message ||
                t("Register failed. Please try again."),
                3000, "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCardLayout title={t("Sign Up")}>
            <CustomButton
                icon={<CloseIcon className="w-6 h-6" aria-label={t("Close")} />}
                className="fixed top-10 left-6"
                navigateTo="/home"
            />
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-2 w-full">
                    <InputTextField
                        label={t("First Name")}
                        id="firstName"
                        {...register("firstName", { required: t("First name is required") })}
                        placeholder={t("Enter your first name")}
                        error={errors.firstName?.message}
                        required
                        className="mb-4"
                        inputClassName="text-netural-500"
                    />

                    <InputTextField
                        label={t("Last Name")}
                        id="lastName"
                        {...register("lastName", { required: t("Last name is required") })}
                        placeholder={t("Enter your last name")}
                        error={errors.lastName?.message}
                        className="mb-4"
                        inputClassName="text-netural-500"
                    />
                </div>
                <InputTextField
                    label={t("Email")}
                    id="emailOrPhone"
                    {...register("emailOrPhone", {
                        required: t("Email is required"),
                        validate: (v) =>
                            /^\d+$/.test(v)
                                ? /^(\+84|84|0)?[1-9][0-9]{8,9}$/.test(v.replace(/\s+/g, "")) ||
                                t("Invalid phone")
                                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t("Invalid email"),
                    })}
                    placeholder={t("Enter your email")}
                    error={errors.emailOrPhone?.message}
                    className="mb-4"
                    required
                    inputClassName="text-netural-500"
                />
                <InputPasswordField
                    value={watch("password") || ""}
                    onChange={(e) => setValue("password", e.target.value)}
                    error={errors.password?.message}
                    required
                />
                <div className="flex items-center gap-1 mt-1 text-xs text-main" >
                    <span className="text-lg">ⓘ</span>
                    <span>{t("Password must be at least 8 characters")}</span>
                </div>

                <MainButton type="submit" disabled={loading}>
                    {t("Register")}
                </MainButton>
                <div className="mt-6 flex justify-center items-center">
                    <span>{t("Already have an account?")}</span>
                    <a
                        href="/login"
                        className="ml-2 text-main font-semibold hover:underline"
                    >
                        {t("Login")}
                    </a>
                </div>
                <SocialLoginActions
                    dividerText={t("OR")}
                    bottomLogo={{ icon: LogoIcon, textIcon: LogoTextIcon }}
                />
            </form>
        </AuthCardLayout>
    );
};

export default Register;
