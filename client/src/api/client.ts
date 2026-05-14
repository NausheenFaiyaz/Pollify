import axios from "axios";
import { clearToken, getToken, setToken } from "../auth/oidc";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then((res) => {
        const nextAccessToken = (res.data?.data?.accessToken ?? res.data?.data?.access_token) as string | undefined;
        if (!nextAccessToken) return null;
        setToken(nextAccessToken);
        return nextAccessToken;
      })
      .catch(() => {
        clearToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const tryRefreshAccessToken = async () => refreshAccessToken();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = originalRequest?.url as string | undefined;
    const isRefreshCall = typeof url === "string" && url.includes("/auth/refresh");
    const isAuthExchange = typeof url === "string" && url.includes("/auth/oidc/exchange");
    const isLogout = typeof url === "string" && url.includes("/auth/logout");

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall && !isAuthExchange && !isLogout) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    if (status === 401 && !isRefreshCall) {
      clearToken();
    }

    return Promise.reject(error);
  }
);

export default api;
