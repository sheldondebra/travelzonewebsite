import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { authOptions } from "@/lib/auth-options";
import { getPostLoginPath } from "@/lib/auth/redirect";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(getPostLoginPath(session.user));
  }

  return <LandingPage />;
}
