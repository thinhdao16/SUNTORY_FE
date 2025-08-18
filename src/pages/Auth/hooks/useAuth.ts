import { useMutation } from "react-query";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useHistory } from "react-router-dom";
import {
    updatePasswordOtp,
    checkValidOtp,
    verifyOtp,
    resendOtpResetPassword,
    resendOtp,
    registerSimple,
    login,
    changePassword,
    loginAuthGoogle,
} from "@/services/auth/auth-service";
import {
    ChangePasswordPayload,
    RegisterRequest,
    RegisterResponse,
    UpdatePasswordOtpPayload,
} from "@/services/auth/auth-types";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { useUpdateNewDevice } from "@/hooks/device/useDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { Preferences } from "@capacitor/preferences";
import { FCM_KEY } from "@/constants/global";

const showToast = useToastStore.getState().showToast;

export const useLogin = () => {
    const setAuthData = useAuthStore((state) => state.setAuthData);
    const history = useHistory();

    return useMutation(
        async (credentials: { email: string; password: string; deviceId: string | null }) => {
            const storedToken = (await Preferences.get({ key: FCM_KEY })).value;
            return login({
                ...credentials,
                firebaseToken: storedToken || undefined,
            });
        },
        {
            onSuccess: (data: any) => {
                const auth = data?.data?.authentication;
                showToast(t("Login successful!"), 1000, "success");
                if (auth?.token && auth?.refreshToken) {
                    const user = {
                        ...data.data,
                        token: auth.token,
                        refreshToken: auth.refreshToken,
                    };
                    setAuthData(user);
                } else {
                    setAuthData(data.data);
                }
                history.push("/social-chat");
            },
            onError: async (error: any, variables) => {
                const message = error?.response?.data?.message;
                if (message === "[OTP Email] Email is unconfirmed, please confirm it first.") {
                    try {
                        await resendOtp(variables.email);
                    } catch (err) { }
                    localStorage.setItem("otpLastSent", Date.now().toString());
                    localStorage.setItem("register-email", variables.email);
                    localStorage.setItem("otpType", "loginOtp");
                    showToast(t("An OTP has been sent to your email. Please check it."), 2000, "info");
                    history.push("/otp");
                } else {
                    showToast(
                        t(message, { ns: "api" }) || t("Login failed. Please try again."),
                        3000,
                        "error"
                    );
                }
            },
        }
    );
};

export const useRegister = () => {
    const setUserAfterRegister = useAuthStore((s) => s.setUserAfterRegister);

    return useMutation(
        (payload: RegisterRequest) => registerSimple(payload),
        {
            onSuccess: (data: RegisterResponse) => {
                setUserAfterRegister?.(data.data);
            },
            onError: (error) => {
                console.error(t("Register error:"), error);
            },
        }
    );
};

export const useUpdatePasswordOtp = () => {
    return useMutation(
        (payload: UpdatePasswordOtpPayload) => updatePasswordOtp(payload),
        {
            onSuccess: () => {
                showToast(t("Password changed successfully!"), 2000, "success");
            },
            onError: (error: any) => {
                showToast(
                    error?.response?.data?.message || t("Password change failed. Please try again."),
                    3000,
                    "error"
                );
            },
        }
    );
};
export const useChangePassword = () => {
    return useMutation(
        (payload: ChangePasswordPayload) => changePassword(payload),
        {
            onSuccess: () => {
                showToast(t("Password changed successfully!"), 2000, "success");
            },
            onError: (error: any) => {
                showToast(
                    t(error?.response?.data?.message, { ns: "api" }) || t("Password change failed. Please try again."),
                    3000,
                    "error"
                );
            },
        }
    );
};
export const useResendOtp = () => {
    const showToast = useToastStore.getState().showToast;

    return useMutation(
        async ({ email, otpType }: { email: string; otpType: string }) => {
            if (otpType === "reset-password") {
                await resendOtpResetPassword(email);
            } else {
                await resendOtp(email);
            }
            localStorage.setItem("otpLastSent", Date.now().toString());
        },
        {
            onSuccess: () => {
                showToast(t("OTP resent!"), 2000, "success");
            },
            onError: (err: any) => {
                showToast(
                    t(err?.response?.data?.message) ||
                    t("Resending OTP failed. Please try again."),
                    3000,
                    "error"
                );
            },
        }
    );
};

export const useCheckValidOtp = () => {
    const showToast = useToastStore.getState().showToast;

    return useMutation(
        ({ email, otp }: { email: string; otp: string }) => checkValidOtp(email, otp),
        {
            onSuccess: () => {
                showToast(t("OTP is valid!"), 2000, "success");
            },
            onError: (err: any) => {
                showToast(
                    t(err?.response?.data?.message, { ns: "api" }) || t("OTP is invalid."),
                    3000,
                    "error"
                );
            },
        }
    );
};

export const useVerifyOtp = () => {
    const showToast = useToastStore.getState().showToast;
    return useMutation(
        ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp),
        {
            onError: (err: any) => {
                showToast(
                    err?.response?.data?.message ||
                    t("OTP verification failed. Please try again."),
                    3000,
                    "error"
                );
            }
        }
    );
};

export const useGoogleLogin = () => {
    const setAuthData = useAuthStore((s) => s.setAuthData);
    const showToast = useToastStore.getState().showToast;
    const isWeb = Capacitor.getPlatform() === "web";
    const updateNewDeviceMutation = useUpdateNewDevice();
    const deviceInfo: { deviceId: string | null } = useDeviceInfo();

    const handleGoogleWebLogin = async (credentialResponse: any) => {
        try {
            const idToken = credentialResponse.credential;
            const data = await loginAuthGoogle({ token: idToken });
            const auth = data?.data;

            if (auth?.token && auth?.refreshToken) {
                setAuthData({
                    ...data.data,
                    token: auth.token,
                    refreshToken: auth.refreshToken,
                });

                const storedToken = (await Preferences.get({ key: FCM_KEY })).value;
                if (storedToken) {
                    updateNewDeviceMutation.mutate({
                        deviceId: deviceInfo.deviceId,
                        fcmToken: storedToken,
                    });
                }
            } else {
                setAuthData(data.data);
            }

            showToast(t("Login successful!"), 2000, "success");
        } catch (err) {
            showToast("Login failed. Please try again.", 3000, "error");
            console.error("Google Web Login Backend Error:", err);
        }
    };

    const nativeLogin = async () => {
        try {
            const user = await GoogleAuth.signIn();
            const data = await loginAuthGoogle({
                token: user.authentication?.idToken,
            });
            const auth = data?.data;

            if (auth?.token && auth?.refreshToken) {
                setAuthData({
                    ...data.data,
                    token: auth.token,
                    refreshToken: auth.refreshToken,
                });

                const storedToken = (await Preferences.get({ key: FCM_KEY })).value;
                if (storedToken) {
                    updateNewDeviceMutation.mutate({
                        deviceId: deviceInfo.deviceId,
                        fcmToken: storedToken,
                    });
                }
            } else {
                setAuthData(data.data);
            }

            showToast(t("Login successful!"), 2000, "success");
            return user;
        } catch (err: any) {
            console.error("Google Native Sign-In Error (FULL):", JSON.stringify(err));
            showToast("Login failed. Please try again.", 3000, "error");
        }
    };

    return { handleGoogleWebLogin, nativeLogin, isWeb };
};