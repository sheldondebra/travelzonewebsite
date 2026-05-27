import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret",
);

export type MobileTokenPayload = {
  userId: string;
  businessId: string | null;
  email: string;
};

export async function signMobileToken(payload: MobileTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyMobileToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as MobileTokenPayload;
}
