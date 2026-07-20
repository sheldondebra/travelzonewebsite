import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { design } from "@/lib/design";

export function AppShell({
  children,
  headerSubtitle,
}: {
  children: React.ReactNode;
  headerSubtitle?: string;
}) {
  return (
    <div className="h-screen overflow-hidden bg-[#F7F9FC]">
      <AppSidebar />
      <div
        className="flex h-screen min-h-0 flex-col bg-white"
        style={{ marginLeft: design.layout.sidebarWidth }}
      >
        <AppHeader subtitle={headerSubtitle} />
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-6">
          <div className="mx-auto w-full max-w-[1024px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
