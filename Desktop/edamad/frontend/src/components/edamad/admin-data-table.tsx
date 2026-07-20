"use client";

import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type AdminDataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function AdminDataTable<T extends { id: number | string }>({
  columns,
  rows,
  emptyMessage = "No records found.",
}: AdminDataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="ed-card p-8 text-center text-[#6B7280]">{emptyMessage}</div>;
  }

  return (
    <div className="ed-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
              {columns.map((col) => (
                <th key={col.key} className={`px-5 py-3 font-medium first:pl-5 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#E5EAF2] last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3 text-[#374151] ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#002B7F]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminLoadingCard() {
  return <div className="ed-card p-8 text-center text-[#6B7280]">Loading...</div>;
}
