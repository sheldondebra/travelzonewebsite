import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret",
);

export type CashierTokenPayload = {
  cashierId: string;
  businessId: string;
  name: string | null;
  role: string;
};

export async function signCashierToken(payload: CashierTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyCashierToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as CashierTokenPayload;
}
