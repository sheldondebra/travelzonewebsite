import axios, { type InternalAxiosRequestConfig } from "axios";
import { getSanctumCsrfUrl, readCsrfToken } from "@/lib/backend-url";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

export async function ensureCsrfCookie() {
  if (typeof window === "undefined") return;

  await axios.get(getSanctumCsrfUrl(), {
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
  });
}

export async function prepareApiRequest() {
  await ensureCsrfCookie();
}

function attachCsrfHeader(config: InternalAxiosRequestConfig) {
  const token = readCsrfToken();
  if (token) {
    config.headers.set("X-XSRF-TOKEN", token);
  }
  return config;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && config.method !== "get" && config.method !== "head") {
    await ensureCsrfCookie();
    attachCsrfHeader(config);
  }
  return config;
});

export default api;
