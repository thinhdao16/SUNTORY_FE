import axios from "axios";
import ENV from "./env";

const httpClient = axios.create({
    baseURL: ENV.BE,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    },
});


async function clearCachesSilentlyOnce(): Promise<void> {
    try {
        const KEY = '__cc_once__';
        if (sessionStorage.getItem(KEY)) return;
        sessionStorage.setItem(KEY, '1');
        if (typeof caches !== 'undefined' && caches?.keys) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
        if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.update().catch(() => false)));
        }
    } catch {  }
}

let refreshPromise: Promise<string> | null = null;
const REFRESH_FAIL_LIMIT = 3; 
const REFRESH_FAIL_WINDOW_MS = 60_000; 

function markRefreshFailure(): number {
    try {
        const now = Date.now();
        const tsKey = '__rf_ts__';
        const cntKey = '__rf_cnt__';
        const lastTs = Number(sessionStorage.getItem(tsKey)) || 0;
        let cnt = Number(sessionStorage.getItem(cntKey)) || 0;
        if (!lastTs || now - lastTs > REFRESH_FAIL_WINDOW_MS) {
            sessionStorage.setItem(tsKey, String(now));
            cnt = 0;
        }
        cnt += 1;
        sessionStorage.setItem(cntKey, String(cnt));
        return cnt;
    } catch {
        return REFRESH_FAIL_LIMIT;
    }
}

function resetRefreshFailures(): void {
    try {
        sessionStorage.removeItem('__rf_ts__');
        sessionStorage.removeItem('__rf_cnt__');
    } catch { }
}

function forceLogout(): void {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        const path = window.location.pathname || '';
        const isOnLogin = path.startsWith('/login') || path.startsWith('/auth');
        if (!isOnLogin) window.location.href = '/login';
    } catch { }
}

httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const onLoginRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
        const isAuthEndpoint = /\/api\/v1\/auth\//i.test(config?.url || "");
        const isLogoutEndpoint = /\/api\/v1\/auth\/logout/i.test(config?.url || "");

        if (onLoginRoute || (isAuthEndpoint && !isLogoutEndpoint)) {
            delete config.headers["Authorization"];
        } else if (token) {
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

        const status = error?.response?.status;
        const reqUrl: string = originalRequest?.url || "";
        const onLoginRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
        const isAnyAuthEndpoint = /\/api\/v1\/auth\//i.test(reqUrl || "");

        if (status === 426) {
            void clearCachesSilentlyOnce();
        }

        if (onLoginRoute && (status === 401 || status === 426)) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            return Promise.reject(error);
        }

        if (!onLoginRoute && !isAnyAuthEndpoint && (status === 401 || status === 426) && !originalRequest._retry) {
            originalRequest._retry = true;

            const storedRefresh = localStorage.getItem("refreshToken");
            if (!storedRefresh) {
                return Promise.reject(error);
            }

            if (refreshPromise) {
                try {
                    const newToken = await refreshPromise;
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    return httpClient(originalRequest);
                } catch (e) {
                    return Promise.reject(error);
                }
            }

            const authHeader = (originalRequest?.headers?.Authorization || originalRequest?.headers?.authorization) as string | undefined;
            const fromHeader = authHeader?.startsWith('Bearer ')
                ? authHeader.slice('Bearer '.length)
                : undefined;
            const accessTokenBefore = fromHeader || localStorage.getItem("token");
            refreshPromise = (async () => {
                const resp = await axios.post(`${ENV.BE}/api/v1/auth/refresh-token`, {
                    refreshToken: storedRefresh,
                    token: accessTokenBefore,
                });
                const resultCode = resp?.data?.result;
                const msg: string | undefined = resp?.data?.message;
                const payload = resp?.data?.data || {};
                let nextToken: string | undefined = payload?.token ?? payload?.accessToken ?? undefined;
                const newRefreshToken: string | undefined = payload?.refreshToken ?? undefined;

                if (!nextToken) {
                    const tokenStillValid = resultCode === 90 || (typeof msg === 'string' && msg.toLowerCase().includes('token is still valid'));
                    if (tokenStillValid) {
                        nextToken = accessTokenBefore || localStorage.getItem('token') || undefined;
                    }
                }

                if (!nextToken) throw new Error('No token in refresh response');
                localStorage.setItem("token", nextToken);
                if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
                return nextToken as string;
            })();

            try {
                const newToken = await refreshPromise;
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                resetRefreshFailures();
                return httpClient(originalRequest);
            } catch (refreshError: any) {
                const st = refreshError?.response?.status;
                const count = markRefreshFailure();
                if (st === 400 || st === 403 || count >= REFRESH_FAIL_LIMIT) {
                    forceLogout();
                }
                return Promise.reject(refreshError);
            } finally {
                refreshPromise = null;
            }
        }

        return Promise.reject(error);
    }
);

export default httpClient;