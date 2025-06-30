import httpClient from "@/config/http-client";
import {
    ChangePasswordPayload,
    LoginRequest,
    LoginRequestWithDeviceId,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UpdatePasswordOtpPayload,
} from "./auth-types";

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await httpClient.post<LoginResponse>("/api/v1/auth/login", credentials);
    return response.data;
};
export const getInfo = async () => {
    const response = await httpClient.get<LoginResponse>("/api/v1/account/get-info");
    return response.data;
};
export const registerSimple = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await httpClient.post<RegisterResponse>("/api/v1/auth/register-simple", data);
    return response.data;
};
export const verifyOtp = async (email: string, otp: string) => {
    const res = await httpClient.put("/api/v1/auth/accept-valid-otp", { email, otp });
    return res.data;
};
export const resendOtp = async (email: string) => {
    const res = await httpClient.post("/api/v1/auth/send-otp-email", { email, "isForce": true });
    return res.data;
};
export const updatePasswordOtp = async (payload: UpdatePasswordOtpPayload) => {
    const res = await httpClient.put("/api/v1/auth/update-password-otp", payload);
    return res.data;
};
export const resendOtpResetPassword = async (email: string) => {
    const res = await httpClient.post("/api/v1/auth/forget-password", { email, type: 20 });
    return res.data;
};

export const checkValidOtp = async (email: string, otp: string) => {
    const res = await httpClient.post("/api/v1/auth/check-valid-otp", { email, otp });
    return res.data;
};
export const changePassword = async (payload: ChangePasswordPayload) => {
    const res = await httpClient.post("/api/v1/account/change-password", payload);
    return res.data;
};
export const updateAccountInfo = async (payload: any) => {
    const res = await httpClient.post("/api/v1/account/update-account-simple", payload);
    return res.data;
};
export const loginAuthGoogle = async (payload: LoginRequestWithDeviceId) => {
    const res = await httpClient.post("/api/v1/auth/google-login", payload);
    return res.data;
}
export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("Files", file);
    const res = await httpClient.post("/api/v1/account/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};