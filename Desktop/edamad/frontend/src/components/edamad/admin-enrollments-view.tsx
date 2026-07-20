"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { AdminDataTable, AdminLoadingCard, AdminPageHeader } from "@/components/edamad/admin-data-table";
import { fetchAdminEnrollments, type AdminEnrollmentRow } from "@/services/admin-resources";

export function AdminEnrollmentsView() {
  const [rows, setRows] = useState<AdminEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminEnrollments()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminPageHeader title="Enrollments" description="Student course enrollments and progress." />
      {loading ? (
        <AdminLoadingCard />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            { key: "student", header: "Student", render: (r) => <><p className="font-medium text-[#002B7F]">{r.student}</p><p className="text-[11px] text-[#9CA3AF]">{r.email}</p></> },
            { key: "course", header: "Course", render: (r) => r.course },
            {
              key: "progress",
              header: "Progress",
              render: (r) => (
                <div className="min-w-[100px]">
                  <p className="mb-1 text-[12px] font-medium">{r.progress}%</p>
                  <ProgressBar value={r.progress} height={5} />
                </div>
              ),
            },
            { key: "enrolled", header: "Enrolled", render: (r) => r.enrolled_at },
            { key: "completed", header: "Completed", render: (r) => r.completed_at ?? "—" },
          ]}
        />
      )}
    </div>
  );
}
