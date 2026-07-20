"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Download,
  FileText,
  Hand,
  MessageSquare,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  Send,
  Share2,
  Target,
  User,
  Users,
  Video,
  VideoOff,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { RightPanel } from "@/components/edamad/right-panel";
import { getZoomEmbedUrl, instructorDisplayName } from "@/lib/zoom-utils";
import { fetchFeaturedLiveLecture } from "@/services/live-classes";
import type { LiveLecture } from "@/types/live-classes";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${fmt(start)} - ${fmt(end)} WAT`;
}

function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function upcomingDateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

function AvatarInitials({ initials, name }: { initials: string | null; name: string }) {
  const label = initials ?? name.slice(0, 2).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF2FF] text-[11px] font-semibold text-[#0057FF]">
      {label}
    </div>
  );
}

function ZoomControlBar({ attendeeCount }: { attendeeCount: number }) {
  const controls = [
    { icon: MicOff, label: "Unmute" },
    { icon: VideoOff, label: "Start Video" },
    { icon: Users, label: "Participants", badge: attendeeCount },
    { icon: MessageSquare, label: "Chat" },
    { icon: Hand, label: "Raise Hand" },
    { icon: Share2, label: "Share Screen" },
    { icon: MoreHorizontal, label: "More" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 border-t border-white/10 bg-[#0f0f1a] px-3 py-2.5 sm:gap-2">
      {controls.map(({ icon: Icon, label, badge }) => (
        <button
          key={label}
          type="button"
          className="relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="hidden text-[10px] sm:inline">{label}</span>
          {badge !== undefined && (
            <span className="absolute -right-0.5 -top-0.5 rounded bg-[#0057FF] px-1 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </button>
      ))}
      <button
        type="button"
        className="ml-2 flex items-center gap-1.5 rounded-lg bg-[#E11D48] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#be123c]"
      >
        <PhoneOff className="h-4 w-4" />
        Leave
      </button>
    </div>
  );
}

function ZoomSessionPlayer({ lecture }: { lecture: LiveLecture }) {
  const embedUrl = getZoomEmbedUrl(lecture.zoom_link, lecture.meeting_id);
  const instructorLabel = instructorDisplayName(
    lecture.instructor_name,
    lecture.instructor_credentials,
  );

  return (
    <div className="overflow-hidden rounded-xl bg-[#1a1a2e]">
      <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-2">
        <div className="relative flex min-h-[240px] flex-col bg-[#0f0f1a]">
          {lecture.is_live && embedUrl ? (
            <iframe
              title={`Zoom session — ${lecture.topic}`}
              src={embedUrl}
              className="h-full min-h-[240px] w-full flex-1 border-0"
              allow="camera; microphone; fullscreen; display-capture"
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#374151] text-2xl font-semibold text-white/90">
                {lecture.instructor_name
                  .split(" ")
                  .slice(-1)[0]
                  ?.charAt(0) ?? "A"}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">{instructorLabel}</p>
                <p className="mt-1 text-[12px] text-white/70">
                  {lecture.is_live
                    ? "Open Zoom to join this live session."
                    : "This session is not live right now."}
                </p>
              </div>
              {lecture.zoom_link && (
                <a
                  href={lecture.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-btn-primary inline-flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  {lecture.is_live ? "Join in Zoom" : "Open Zoom Link"}
                </a>
              )}
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
            {instructorLabel}
          </span>
        </div>

        <div className="relative flex min-h-[240px] flex-col bg-white p-4 md:border-l md:border-[#E5EAF2]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Presentation</p>
          <h3 className="mt-1 text-[15px] font-bold leading-snug text-[#002B7F]">{lecture.topic}</h3>
          {lecture.slides_url && lecture.slides_url !== "#" ? (
            <iframe
              title={`${lecture.topic} slides`}
              src={lecture.slides_url}
              className="mt-3 min-h-[200px] flex-1 rounded-lg border border-[#E5EAF2] bg-[#F7F9FC]"
            />
          ) : (
            <div className="mt-3 flex flex-1 items-center justify-center rounded-lg bg-[#F7F9FC] p-4 text-center">
              <p className="text-[12px] leading-relaxed text-[#6B7280]">
                Lecture slides will appear here when your instructor uploads them for{" "}
                <span className="font-medium text-[#002B7F]">{lecture.course_title}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
      <ZoomControlBar attendeeCount={lecture.attendee_count} />
    </div>
  );
}

function ClassDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <li className="flex gap-3 text-[13px]">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
      <div>
        <span className="text-[#6B7280]">{label}: </span>
        <span className="font-medium text-[#374151]">{value}</span>
      </div>
    </li>
  );
}

function UpcomingCard({ lecture }: { lecture: LiveLecture }) {
  const { day, month } = upcomingDateParts(lecture.starts_at);
  const time = new Date(lecture.starts_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex gap-3 text-sm">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
        <span className="text-xs font-bold leading-none">{day}</span>
        <span className="text-[10px] font-semibold leading-none">{month}</span>
      </div>
      <div className="min-w-0">
        <p className="font-medium text-[#002B7F]">{lecture.topic}</p>
        <p className="text-xs text-[#6B7280]">
          {formatDate(lecture.starts_at)} · {time} (WAT)
        </p>
      </div>
    </div>
  );
}

export function LiveLectureView() {
  const [panelTab, setPanelTab] = useState<"chat" | "participants">("chat");
  const [chatDraft, setChatDraft] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["live-classes-featured"],
    queryFn: fetchFeaturedLiveLecture,
  });

  if (isLoading) return <p className="text-center text-[#6B7280]">Loading live class...</p>;
  if (isError || !data) {
    return <p className="text-center text-[#EF4444]">Could not load live class.</p>;
  }

  const { lecture, upcoming } = data;
  const instructorLabel = lecture.instructor_credentials
    ? `${lecture.instructor_name}, ${lecture.instructor_credentials}`
    : lecture.instructor_name;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Live Classes", href: "/live-classes" },
          { label: lecture.course_title },
          { label: lecture.title },
        ]}
      />

      <div className="mb-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2FF]">
            <Video className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold text-[#002B7F]">{lecture.title}</h1>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">
              {lecture.course_title} – {lecture.topic}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {lecture.is_live && (
            <span className="rounded bg-[#E11D48] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Live
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#374151]">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#2D8CFF] text-[8px] font-bold text-white">
              Z
            </span>
            on Zoom Workplace
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[13px] text-[#6B7280]">
            <Users className="h-4 w-4" strokeWidth={1.75} />
            {lecture.attendee_count} Attendees
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <ZoomSessionPlayer lecture={lecture} />

          <div className="ed-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
              <h3 className="font-semibold text-[#002B7F]">Today&apos;s Learning Objectives</h3>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-[#374151]">
              {lecture.learning_objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="ed-card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
              <div>
                <h3 className="font-semibold text-[#002B7F]">Lecture Materials</h3>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">
                  Download the slides and resources for this session.
                </p>
              </div>
            </div>
            {lecture.slides_url && (
              <a
                href={lecture.slides_url}
                className="ed-btn-primary inline-flex shrink-0 items-center gap-2 px-4"
              >
                <Download className="h-4 w-4" />
                Download Slides
              </a>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <RightPanel title="Class Details">
            <ul className="space-y-3">
              <ClassDetailRow icon={User} label="Instructor" value={instructorLabel} />
              <ClassDetailRow icon={Calendar} label="Date" value={formatDate(lecture.starts_at)} />
              <ClassDetailRow
                icon={Clock}
                label="Time"
                value={formatTimeRange(lecture.starts_at, lecture.duration_minutes)}
              />
              <ClassDetailRow
                icon={Clock}
                label="Duration"
                value={`${lecture.duration_minutes} Minutes`}
              />
              {lecture.meeting_id && (
                <ClassDetailRow icon={Video} label="Meeting ID" value={lecture.meeting_id} />
              )}
              <ClassDetailRow
                icon={Users}
                label="Enrolled Students"
                value={`${lecture.enrolled_count} Registered`}
              />
            </ul>
            {lecture.zoom_link && (
              <a
                href={lecture.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-btn-primary mt-4 flex w-full items-center justify-center gap-2"
              >
                <Video className="h-4 w-4" />
                Rejoin Session
              </a>
            )}
          </RightPanel>

          <div className="ed-card overflow-hidden p-0">
            <div className="flex border-b border-[#E5EAF2] text-[13px]">
              <button
                type="button"
                onClick={() => setPanelTab("participants")}
                className={`flex-1 px-3 py-2.5 font-medium transition-colors ${
                  panelTab === "participants"
                    ? "border-b-2 border-[#0057FF] text-[#0057FF]"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                Participants ({lecture.attendee_count})
              </button>
              <button
                type="button"
                onClick={() => setPanelTab("chat")}
                className={`flex-1 px-3 py-2.5 font-medium transition-colors ${
                  panelTab === "chat"
                    ? "border-b-2 border-[#0057FF] text-[#0057FF]"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                Class Chat
              </button>
            </div>

            {panelTab === "chat" ? (
              <div className="p-4">
                <div className="mb-3 max-h-48 space-y-3 overflow-y-auto">
                  {(lecture.messages ?? []).map((msg) => (
                    <div key={msg.id} className="flex gap-2.5">
                      <AvatarInitials initials={msg.sender_initials} name={msg.sender_name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12px] font-semibold text-[#002B7F]">
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {formatChatTime(msg.sent_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#374151]">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="ed-input flex-1 text-[13px]"
                    placeholder="Type a message..."
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#0057FF] text-white transition-colors hover:bg-[#0046CC]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto p-4">
                <p className="mb-2 text-[12px] font-medium text-[#6B7280]">
                  {lecture.attendee_count} participants in session
                </p>
                <ul className="space-y-2">
                  {[lecture.instructor_name, ...(lecture.messages ?? []).map((m) => m.sender_name)]
                    .slice(0, 8)
                    .map((name) => (
                      <li key={name} className="flex items-center gap-2 text-[13px] text-[#374151]">
                        <AvatarInitials initials={null} name={name} />
                        {name}
                        {name === lecture.instructor_name && (
                          <span className="rounded bg-[#EBF2FF] px-1.5 py-0.5 text-[10px] font-medium text-[#0057FF]">
                            Host
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <RightPanel
              title="Upcoming Live Lectures"
              action={
                <Link href="/live-classes" className="text-xs font-medium text-[#0057FF] hover:underline">
                  View All
                </Link>
              }
            >
              <div className="space-y-4">
                {upcoming.map((item) => (
                  <UpcomingCard key={item.id} lecture={item} />
                ))}
              </div>
            </RightPanel>
          )}
        </div>
      </div>
    </div>
  );
}
