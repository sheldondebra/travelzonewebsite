import axios from "axios";
import api, { ensureCsrfCookie, prepareApiRequest } from "@/lib/api";
import type { AuthResponse, User } from "@/types";

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
};

export async function login(email: string, password: string, remember = false) {
  const { data } = await api.post<{ user: User; message: string }>("/login", {
    email,
    password,
    remember,
  });
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<{ user: User; message: string; verification_sent?: boolean }>(
    "/register",
    payload,
  );
  return data;
}

export async function logout() {
  await prepareApiRequest();
  await api.post("/logout");
}

export async function fetchCurrentUser() {
  const { data } = await api.get<User>("/user");
  return data;
}

export async function forgotPassword(email: string) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; debug_note?: string }>("/forgot-password", {
    email,
  });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string }>("/reset-password", payload);
  return data;
}

export async function resendVerificationEmail() {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string }>("/email/verification-notification");
  return data;
}

export async function getVerificationStatus() {
  const { data } = await api.get<{ verified: boolean; email: string }>("/email/verification-status");
  return data;
}

export async function verifyEmailFromLink(signedUrl: string) {
  await ensureCsrfCookie();
  const { data } = await axios.get<{ message: string; verified: boolean }>(signedUrl, {
    withCredentials: true,
    headers: { Accept: "application/json" },
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
  });
  return data;
}

export async function updatePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string }>("/user/password", payload);
  return data;
}


// Legacy type for any remaining token references
export type SessionAuthResponse = AuthResponse;
