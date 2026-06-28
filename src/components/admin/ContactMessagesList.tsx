"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ContactMessage } from "@/lib/contact-messages";
import { getContactSubjectLabel } from "@/lib/contact-messages";
import {
  formatContactMessageDateTime,
  getContactMessageStats,
  matchesContactMessageFilter,
  matchesContactMessageSearch,
  type ContactMessageFilter,
} from "@/lib/contact-admin";

type Props = {
  messages: ContactMessage[];
};

const filters: { id: ContactMessageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "read", label: "Read" },
  { id: "archived", label: "Archived" },
];

export function ContactMessagesList({ messages }: Props) {
  const [filter, setFilter] = useState<ContactMessageFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      messages.filter(
        (message) =>
          matchesContactMessageFilter(message, filter) &&
          matchesContactMessageSearch(message, query),
      ),
    [messages, filter, query],
  );

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ul className="admin-subsubsub">
          {filters.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={filter === item.id ? "current" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search messages"
          className="admin-input max-w-xs"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Sender</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-[#646970]">
                  {messages.length === 0
                    ? "No contact messages yet."
                    : "No messages match your filter."}
                </td>
              </tr>
            ) : (
              filtered.map((message) => (
                <tr key={message.id}>
                  <td>
                    <Link
                      href={`/admin/messages/${message.id}`}
                      className="admin-row-title"
                    >
                      {message.id}
                    </Link>
                    <div className="admin-row-actions text-[#646970]">
                      {formatContactMessageDateTime(message.createdAt)}
                    </div>
                  </td>
                  <td>
                    <strong>{message.fullName}</strong>
                    <div className="text-[#646970]">{message.email}</div>
                  </td>
                  <td>{getContactSubjectLabel(message.subject)}</td>
                  <td className="max-w-xs truncate text-[#646970]">{message.message}</td>
                  <td>
                    <StatusBadge status={message.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ContactMessagesSummary({ messages }: Props) {
  const stats = getContactMessageStats(messages);

  return (
    <ul className="admin-glance-list">
      <li>
        <strong>{stats.total}</strong> total messages
      </li>
      <li>
        <strong>{stats.pending}</strong> pending
      </li>
      <li>
        <strong>{stats.read}</strong> read
      </li>
      <li>
        <strong>{stats.archived}</strong> archived
      </li>
    </ul>
  );
}
