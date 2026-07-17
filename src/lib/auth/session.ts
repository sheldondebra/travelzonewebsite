import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { StaffRole, StaffSession } from "@/lib/auth/types";

export const SESSION_COOKIE = "tz_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!secret) {
    throw new Error("SESSION_SECRET or DATABASE_URL is required for admin sessions.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: StaffSession) {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "admin" && role !== "editor") return null;

    return { sub, email, role };
  } catch {
    return null;
  }
}

export function readSessionCookieFromRequest(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export async function readSessionCookieFromServer() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = readSessionCookieFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromServer() {
  const token = await readSessionCookieFromServer();
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function setSessionCookieOnServer(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function clearSessionCookieOnServer() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function createResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "editor";
}
