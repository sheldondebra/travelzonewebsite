import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isPlatformAdminUser } from "@/lib/platform/is-platform-admin";
import { UnauthorizedError } from "@/server/utils/errors";

export async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user && isPlatformAdminUser(session.user)) {
    return session;
  }
  throw new UnauthorizedError("Platform admin access required");
}
