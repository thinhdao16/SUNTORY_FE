import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuthStore } from "@/store/zustand/auth-store";
import { useToastStore } from "@/store/zustand/toast-store";
import { useCheckValidOtp, useResendOtp, useVerifyOtp } from "../hooks/useAuth";

// ====== CONSTANTS ======
const RESEND_INTERVAL = 300;
const OTP_LENGTH = 6;

// ====== HOOK ======
export function useOtp() {
    // ====== STATE & REF ======
    const history = useHistory();
    const [timer, setTimer] = useState(RESEND_INTERVAL);
    const [canResend, setCanResend] = useState(false);
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const inputs = useRef<Array<HTMLInputElement | null>>([]);
    const email = localStorage.getItem("register-email");
    const setAuthData = useAuthStore((state) => state.setAuthData);

    const { mutateAsync: checkValidOtpAsync } = useCheckValidOtp();
    const { mutateAsync: verifyOtpAsync } = useVerifyOtp();
    // ====== STORE ACTIONS ======
    const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
    const setUser = useAuthStore((s) => s.setUser);
    const showToast = useToastStore((s) => s.showToast);

    const { mutate: resendOtpMutate, isLoading } = useResendOtp();


    // ====== OTP INPUT HANDLERS ======
    const handleChange = (value: string, idx: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[idx] = value;
        setOtp(newOtp);
        if (value && idx < OTP_LENGTH - 1) {
            inputs.current[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    // ====== RESEND OTP ======
    const otpType = localStorage.getItem("otpType") || "register";
    const handleResend = () => {
        resendOtpMutate({ email: email || "", otpType });
    };

    // ====== SUBMIT OTP ======
    const handleSubmitOtp = async () => {
        try {
            const code = otp.join("");
            if (code.length !== OTP_LENGTH) {
                showToast(t("Please enter the full OTP code"), 2000, "warning");
                return false;
            }
            if (otpType === "register") {
                const result = await verifyOtpAsync({ email: email || "", otp: code });
                const auth = result?.data?.authentication;
                if (auth?.token && auth?.refreshToken) {
                    const user = {
                        ...auth, // hoặc ...data.data nếu bạn muốn merge thêm thông tin khác
                        token: auth.token,
                        refreshToken: auth.refreshToken,
                    };
                    setAuthenticated(auth.token, auth.refreshToken);
                    setUser?.(user); // dùng user mới
                    setAuthData?.(user); // nếu bạn có hàm setAuthData
                    history.push("/home");
                    localStorage.removeItem("registerEmail");
                    localStorage.removeItem("otpLastSent");
                    showToast(t("OTP verification successful!"), 2000, "success");
                    return true;
                } else {
                    showToast(t("OTP verification failed. No token received."), 3000, "error");
                    return false;
                }
            } else if (otpType === "loginOtp") {
                const result = await verifyOtpAsync({ email: email || "", otp: code });
                const auth = result?.data?.authentication;
                if (auth?.token && auth?.refreshToken) {
                    setAuthenticated(auth.token, auth.refreshToken);
                    setUser?.(auth);
                    showToast(t("OTP verification successful!"), 2000, "success");
                    localStorage.removeItem("registerEmail");
                    localStorage.removeItem("otpLastSent");
                    history.push("/home");
                    return true;
                } else {
                    showToast(t("OTP verification failed. No token received."), 3000, "error");
                    return false;
                }
            } else {
                try {
                    await checkValidOtpAsync({ email: email || "", otp: code });
                    localStorage.setItem("otp", code);
                    showToast(t("OTP verification successful! Please set a new password."), 2000, "success");
                    history.push("/new-password");
                    return true;
                } catch (err) {
                    return false;
                }
            }
        } catch (err: any) {
            return false;
        }
    };

    // ====== EFFECT: INIT TIMER & REDIRECT IF NEEDED ======
    useEffect(() => {
        const lastSent = localStorage.getItem("otpLastSent");
        if (lastSent) {
            const elapsed = Math.floor((Date.now() - Number(lastSent)) / 1000);
            const remain = RESEND_INTERVAL - elapsed;
            setTimer(remain > 0 ? remain : 0);
            setCanResend(remain <= 0);
        }
        if (!lastSent) {
            history.goBack();
        }
    }, [history]);

    // ====== EFFECT: TIMER COUNTDOWN ======
    useEffect(() => {
        if (timer === 0) {
            setCanResend(true);
            return;
        }
        setCanResend(false);
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);
    // Cleanup: remove otpLastSent khi rời khỏi trang OTP
    useEffect(() => {
        return () => {
            localStorage.removeItem("otpLastSent");
            if (otpType === "register") {
                localStorage.removeItem("register-email");
            }
        };
    }, []);

    // ====== RETURN API ======
    return {
        email,
        otp,
        setOtp,
        inputs,
        timer,
        canResend,
        handleChange,
        handleKeyDown,
        handleResend,
        handleSubmitOtp,
    };
}