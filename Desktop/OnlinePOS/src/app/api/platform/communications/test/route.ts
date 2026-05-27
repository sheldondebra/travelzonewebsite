import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { logNotification } from "@/server/services/notifications/log-notification";
import {
  sendPlatformTestEmail,
  sendPlatformTestSms,
} from "@/server/services/platform/test-notification";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";
import { z } from "zod";

const schema = z.object({
  channel: z.enum(["sms", "email", "both"]),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "PLATFORM_ADMIN") return session;
  throw new UnauthorizedError("Platform admin access required");
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = schema.parse(await request.json());

    const results: { sms?: string; email?: string } = {};

    if (body.channel === "sms" || body.channel === "both") {
      if (!body.phone) throw new Error("Phone number required for SMS test");
      try {
        await sendPlatformTestSms(body.phone);
        results.sms = "sent";
      } catch (e) {
        const msg = e instanceof Error ? e.message : "SMS test failed";
        await logNotification({
          channel: "sms",
          recipient: body.phone,
          status: "failed",
          message: msg,
          source: "platform_test",
        });
        throw e;
      }
    }

    if (body.channel === "email" || body.channel === "both") {
      if (!body.email) throw new Error("Email address required for email test");
      try {
        await sendPlatformTestEmail(body.email);
        results.email = "sent";
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Email test failed";
        await logNotification({
          channel: "email",
          recipient: body.email,
          status: "failed",
          message: msg,
          source: "platform_test",
        });
        throw e;
      }
    }

    return apiSuccess(results, "Test notification sent");
  } catch (error) {
    return handleApiError(error);
  }
}
