import { LogoutPageView } from "@/components/edamad/logout-page-view";
import { AppShell } from "@/components/layout/app-shell";

export default function LogoutPage() {
  return (
    <AppShell headerSubtitle="Let's keep learning!">
      <LogoutPageView />
    </AppShell>
  );
}
