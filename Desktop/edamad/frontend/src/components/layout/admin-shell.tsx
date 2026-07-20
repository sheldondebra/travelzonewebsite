"use client";

import { createContext, useContext, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

const AdminSearchContext = createContext<{
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}>({ searchQuery: "", setSearchQuery: () => {} });

export function useAdminSearch() {
  return useContext(AdminSearchContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AdminSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <main className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </AdminSearchContext.Provider>
  );
}
