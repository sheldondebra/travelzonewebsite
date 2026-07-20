import { Suspense } from "react";
import { AdminCoursesView } from "@/components/edamad/admin-courses-view";

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<div className="ed-card p-8 text-center text-[#6B7280]">Loading courses...</div>}>
      <AdminCoursesView />
    </Suspense>
  );
}
