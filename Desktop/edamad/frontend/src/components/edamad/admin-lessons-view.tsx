"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminDataTable, AdminLoadingCard, AdminPageHeader } from "@/components/edamad/admin-data-table";
import { fetchAdminLessons, formatDuration, type AdminLessonRow } from "@/services/admin-resources";

export function AdminLessonsView() {
  const [rows, setRows] = useState<AdminLessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminLessons()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Lessons"
        description="All lessons across courses."
        action={
          <Link href="/admin/courses/upload" className="ed-btn-primary text-[13px]">
            Upload Video
          </Link>
        }
      />
      {loading ? (
        <AdminLoadingCard />
      ) : (
        <AdminDataTable
          rows={rows}
          emptyMessage="No lessons yet. Upload a video lesson to get started."
          columns={[
            { key: "title", header: "Lesson", render: (r) => <span className="font-medium text-[#002B7F]">{r.title}</span> },
            { key: "course", header: "Course", render: (r) => r.course },
            { key: "module", header: "Module", render: (r) => r.module ?? "—" },
            { key: "duration", header: "Duration", render: (r) => formatDuration(r.duration_seconds) },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${r.status === "published" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
                  {r.status}
                </span>
              ),
            },
            { key: "updated", header: "Updated", render: (r) => r.updated_at },
          ]}
        />
      )}
    </div>
  );
}
