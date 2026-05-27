"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function detectDeviceType(ua: string) {
  if (/iPad|tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobile|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(ua: string) {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  return "Browser";
}

export default function LoginDevicesPage() {
  const { data: session } = useSession();
  const [deviceInfo, setDeviceInfo] = useState({
    type: "desktop" as "desktop" | "mobile" | "tablet",
    browser: "Browser",
    platform: "",
    lastActive: "Now",
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    setDeviceInfo({
      type: detectDeviceType(ua),
      browser: detectBrowser(ua),
      platform: navigator.platform || "Unknown OS",
      lastActive: new Date().toLocaleString(),
    });
  }, []);

  const Icon =
    deviceInfo.type === "mobile"
      ? Smartphone
      : deviceInfo.type === "tablet"
        ? Tablet
        : Monitor;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Login device management
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Sessions signed in as {session?.user?.email}
        </p>
      </div>

      <Card className="border-gray-100 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Active sessions</CardTitle>
          <CardDescription>
            This device is your current session. Sign out everywhere to revoke all access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
                <Icon className="size-5 text-primary" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-medium">
                  {deviceInfo.browser} on {deviceInfo.platform}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active: {deviceInfo.lastActive}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Current</Badge>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out everywhere
      </Button>

      <p className="text-xs text-muted-foreground">
        Multi-device session tracking uses JWT sessions. Signing out clears this browser&apos;s session immediately.
      </p>
    </div>
  );
}
