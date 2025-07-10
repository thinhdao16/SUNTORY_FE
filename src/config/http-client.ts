/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import ENV from "./env";

const httpClient = axios.create({
    baseURL: ENV.BE,
    headers: {
        "Content-Type": "application/json",
    },
});

httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        } else {
            delete config.headers["Authorization"];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                const accessToken = localStorage.getItem("token");
                const response = await axios.post(`${ENV.BE}/api/v1/auth/refresh-token`, {
                    refreshToken,
                    token: accessToken,
                });
                const { token, refreshToken: newRefreshToken } = response.data.data;
                localStorage.setItem("token", token);
                localStorage.setItem("refreshToken", newRefreshToken);
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return httpClient(originalRequest);
            } catch (refreshError: any) {
                if (
                    refreshError.response?.status === 401 ||
                    refreshError.response?.status === 403 ||
                    refreshError.response?.status === 400
                ) {
                    // alert(t("sessionExpired"));
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    const path = window.location.pathname;
                    if (path !== "/home" && path !== "/") {
                        window.location.href = "/login";
                    }
                }
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                const path = window.location.pathname;
                if (path !== "/home" && path !== "/") {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default httpClient;