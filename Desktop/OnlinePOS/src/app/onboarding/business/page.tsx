import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BusinessSetupForm } from "@/components/auth/business-setup-form";
import { AuthShell } from "@/components/ui/auth-shell";
import { authOptions } from "@/lib/auth-options";

export default async function BusinessOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.businessId) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Set up your business"
      subtitle="Keep your products and orders separate from other sellers"
    >
      <BusinessSetupForm />
    </AuthShell>
  );
}
