import React from "react";
import { useForm } from "react-hook-form";
import SocialLoginActions from "@/components/common/SocialLoginActions";
import AuthCardLayout from "@/components/layout/AuthCardLayout";
import MainButton from "@/components/common/MainButton";
import { useOtp } from "./useOtp";
import CustomButton from "@/components/button/CustomButton";
import { useToastStore } from "@/store/zustand/toast-store";
import LogoIcon from "@/icons/logo/logo.svg?react";
import LogoTextIcon from "@/icons/logo/logo_text.svg?react";
import CloseIcon from "@/icons/logo/close.svg?react";

const Otp: React.FC = () => {
  const {
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
  } = useOtp();

  const { handleSubmit } = useForm();
  const otpType = localStorage.getItem("otpType") || "register";
  const showToast = useToastStore((s) => s.showToast);

  const handleResendClick = () => {
    if (!canResend) {
      showToast(t("Please wait before resending OTP."), 2000, "warning");
      return;
    }
    handleResend();
  };

  return (
    <AuthCardLayout title={t("OTP Verification")}>
      <CustomButton
        icon={<CloseIcon aria-label={t("Close")} />}
        className="fixed top-6 left-6"
        navigateTo={
          otpType === "register"
            ? "/register"
            : otpType === "loginOtp"
              ? "/login"
              : "/forgot-password"
        }
      />
      <form onSubmit={handleSubmit(handleSubmitOtp)} className="flex flex-col  items-center">
        <span>
          {t("Enter the OTP sent to")}
        </span>
        <div className="font-semibold mb-4">
          {email}
        </div>
        <div className="flex gap-3 justify-center">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(e.target.value, idx)}
              onKeyDown={e => handleKeyDown(e, idx)}
              onPaste={e => {
                const paste = e.clipboardData.getData("text").replace(/\D/g, "");
                if (paste.length === otp.length) {
                  setOtp(paste.split(""));
                  inputs.current[otp.length - 1]?.focus();
                  e.preventDefault();
                }
              }}
              className={`w-12 h-12 rounded-2xl border-2 text-center text-2xl font-semibold outline-none bg-[#f0f0f0]
      ${digit ? "border-main text-main focus:border-blue-200" : " !border-0"}`}
            />
          ))}
        </div>
        <div className="text-center  pt-2" style={{ minHeight: 24 }}>
          {canResend
            ? "\u00A0"
            : `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`}
        </div>
        <MainButton
          type="button"
          onClick={handleResendClick}
          className="bg-success-500 !text-main mb-3 hover:!text-white"
        // disabled={!canResend}
        >
          {t("Resend")}
        </MainButton>
        <MainButton type="submit" className="!mt-0">
          {t("Confirm")}
        </MainButton>
      </form>

      <SocialLoginActions
        dividerText={t("OR")}
        showDivider={false}
        showActions={false}
        bottomLogo={{ icon: LogoIcon, textIcon: LogoTextIcon }}
      />
    </AuthCardLayout>
  );
};

export default Otp;
