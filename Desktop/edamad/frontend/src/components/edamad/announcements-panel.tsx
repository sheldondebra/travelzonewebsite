"use client";

import { useEffect, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { fetchAnnouncements, type Announcement } from "@/services/announcements";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type AnnouncementsPanelProps = {
  compact?: boolean;
  className?: string;
};

export function AnnouncementsPanel({ compact = false, className = "" }: AnnouncementsPanelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`ed-card p-5 text-[13px] text-[#6B7280] ${className}`}>
        Loading announcements...
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  const visible = compact ? announcements.slice(0, 2) : announcements;

  return (
    <div className={`ed-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#E5EAF2] bg-[#F7F9FC] px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#002B7F]">Announcements</h2>
          <p className="text-[11px] text-[#6B7280]">Updates from ED-AMAD Learning Consult</p>
        </div>
      </div>
      <ul className="divide-y divide-[#E5EAF2]">
        {visible.map((announcement) => (
          <li key={announcement.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#0057FF]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[#002B7F]">{announcement.title}</p>
                  {announcement.published_at ? (
                    <span className="shrink-0 text-[11px] text-[#9CA3AF]">
                      {formatDate(announcement.published_at)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#6B7280]">
                  {announcement.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
