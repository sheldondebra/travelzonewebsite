"use client";

import { useEffect, useState } from "react";
import { AdminDataTable, AdminLoadingCard, AdminPageHeader } from "@/components/edamad/admin-data-table";
import { fetchAdminCertificates, type AdminCertificateRow } from "@/services/admin-resources";

export function AdminCertificatesView() {
  const [rows, setRows] = useState<AdminCertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminCertificates()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminPageHeader title="Certificates" description="Certificates issued to students who completed courses." />
      {loading ? (
        <AdminLoadingCard />
      ) : (
        <AdminDataTable
          rows={rows}
          emptyMessage="No certificates issued yet."
          columns={[
            { key: "cert", header: "Certificate ID", render: (r) => <span className="font-medium text-[#002B7F]">{r.certificate_id}</span> },
            { key: "student", header: "Student", render: (r) => <><p className="font-medium">{r.student}</p><p className="text-[11px] text-[#9CA3AF]">{r.email}</p></> },
            { key: "course", header: "Course", render: (r) => r.course },
            { key: "issued", header: "Issued", render: (r) => r.issued_at },
          ]}
        />
      )}
    </div>
  );
}
