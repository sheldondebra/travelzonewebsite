import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { verifyMobileToken } from "@/lib/jwt";

function authSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

export async function getSession() {
  return getServerSession(authOptions);
}

/** JWT from the incoming Request — reliable in App Router route handlers. */
async function getBusinessIdFromJwt(request: Request): Promise<string | null> {
  const token = await getToken({
    req: request as Parameters<typeof getToken>[0]["req"],
    secret: authSecret(),
  });
  const businessId = token?.businessId;
  return typeof businessId === "string" ? businessId : null;
}

export async function getBusinessIdFromRequest(
  request?: Request,
): Promise<string | null> {
  if (request) {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload = await verifyMobileToken(auth.slice(7));
        return payload.businessId;
      } catch {
        return null;
      }
    }

    const fromJwt = await getBusinessIdFromJwt(request);
    if (fromJwt) return fromJwt;
  }

  const session = await getSession();
  if (session?.user?.businessId) {
    return session.user.businessId;
  }

  return null;
}

export async function getSessionBusinessId(request?: Request) {
  return getBusinessIdFromRequest(request);
}

export async function getUserIdFromRequest(
  request?: Request,
): Promise<string | null> {
  if (request) {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      try {
        const payload = await verifyMobileToken(auth.slice(7));
        return payload.userId ?? null;
      } catch {
        return null;
      }
    }

    const token = await getToken({
      req: request as Parameters<typeof getToken>[0]["req"],
      secret: authSecret(),
    });
    if (typeof token?.id === "string") return token.id;
    if (typeof token?.sub === "string") return token.sub;
  }

  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function requireSessionBusinessId(request?: Request): Promise<
  { businessId: string } | { error: Response }
> {
  const businessId = await getBusinessIdFromRequest(request);
  if (!businessId) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { businessId };
}
