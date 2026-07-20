"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  Baby,
  Bell,
  Bone,
  BookOpen,
  Brain,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Gauge,
  Heart,
  Lock,
  Mail,
  MapPin,
  Medal,
  MoreVertical,
  Pencil,
  Phone,
  Shield,
  Stethoscope,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { AnnouncementsPanel } from "@/components/edamad/announcements-panel";
import {
  profileAchievements,
  profileDefaults,
  progressSummary,
  recentlyAccessedCourses,
} from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";

const courseIcons: Record<string, LucideIcon> = {
  bone: Bone,
  stethoscope: Stethoscope,
  baby: Baby,
  brain: Brain,
  heart: Heart,
};

type ProfileForm = {
  name: string;
  role: string;
  email: string;
  phone: string;
  joined: string;
  location: string;
  about: string;
  avatarUrl: string | null;
};

const PROFILE_STORAGE_KEY = "edamad-profile";

function loadProfile(): ProfileForm {
  if (typeof window === "undefined") {
    return { ...profileDefaults, avatarUrl: null };
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProfileForm;
  } catch {
    /* ignore */
  }
  return { ...profileDefaults, avatarUrl: null };
}

function LearningStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#E5EAF2] p-3.5">
      <div
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}14`, color }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </div>
      <p className="text-[11px] text-[#6B7280]">{label}</p>
      <p className="text-[20px] font-bold leading-tight text-[#002B7F]">{value}</p>
    </div>
  );
}

function EditProfileModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ProfileForm;
  onClose: () => void;
  onSave: (data: ProfileForm) => void;
}) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Edit Profile</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#002B7F]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          {(["name", "role", "email", "phone", "location"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-[12px] font-medium capitalize text-[#374151]">
                {field === "role" ? "Title / Role" : field}
              </label>
              <input
                className="ed-input w-full"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#374151]">About Me</label>
            <textarea
              className="min-h-[96px] w-full rounded-[10px] border border-[#E5EAF2] px-3 py-2 text-sm text-[#374151] focus:border-[#0057FF] focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20"
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="ed-btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" className="ed-btn-primary flex-1">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Change Password</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#002B7F]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage("Password updated successfully.");
            setTimeout(onClose, 1200);
          }}
        >
          {["Current password", "New password", "Confirm new password"].map((label) => (
            <div key={label}>
              <label className="mb-1 block text-[12px] font-medium text-[#374151]">{label}</label>
              <input type="password" className="ed-input w-full" required />
            </div>
          ))}
          {message && <p className="text-[13px] text-[#22C55E]">{message}</p>}
          <button type="submit" className="ed-btn-primary w-full">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export function ProfilePageView() {
  const authUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<ProfileForm>({ ...profileDefaults, avatarUrl: null });
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const displayName = authUser?.name ?? profile.name;
  const displayEmail = authUser?.email ?? profile.email;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function saveProfile(data: ProfileForm) {
    setProfile(data);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    setEditOpen(false);
    showToast("Profile updated successfully.");
  }

  function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = { ...profile, avatarUrl: url };
    setProfile(next);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    showToast("Profile photo updated.");
  }

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-[10px] bg-[#002B7F] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">My Profile</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Manage your profile information and learning preferences.
        </p>
      </div>

      <div className="mb-6">
        <AnnouncementsPanel />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <div className="ed-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-[#E5EAF2]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E5EAF2] text-[22px] font-semibold text-[#6B7280]">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0057FF] text-white shadow-md transition-colors hover:bg-[#0046CC]"
                aria-label="Upload profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#002B7F]">{displayName}</h2>
              <p className="text-[14px] font-medium text-[#0057FF]">{profile.role}</p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 text-[13px] text-[#6B7280]">
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
              {displayEmail}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
              {profile.phone}
            </li>
            <li className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
              Joined on {profile.joined}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
              {profile.location}
            </li>
          </ul>

          <div className="mt-5">
            <p className="text-[13px] font-semibold text-[#002B7F]">About Me</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#374151]">{profile.about}</p>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="ed-btn-outline mt-5 gap-2 text-[13px]"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>

        {/* Learning overview */}
        <div className="ed-card p-5">
          <h3 className="text-[15px] font-semibold text-[#002B7F]">Learning Overview</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LearningStat icon={BookOpen} label="Courses Enrolled" value={progressSummary.coursesEnrolled} color="#0057FF" />
            <LearningStat icon={CheckCircle2} label="Lessons Completed" value={progressSummary.lessonsCompleted} color="#22C55E" />
            <LearningStat icon={Gauge} label="Average Progress" value={`${progressSummary.averageProgress}%`} color="#F59E0B" />
            <LearningStat icon={Award} label="Certificates Earned" value={progressSummary.certificatesEarned} color="#8B5CF6" />
          </div>
          <Link href="/progress" className="ed-btn-outline mt-4 flex w-full items-center justify-center gap-1 text-[13px]">
            View Full Progress
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Recently accessed + update banner */}
        <div className="space-y-4">
          <div className="ed-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[#002B7F]">Recently Accessed Courses</h3>
              <Link href="/dashboard" className="text-[12px] font-medium text-[#0057FF] hover:underline">
                View All Courses
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
              </Link>
            </div>

            <ul className="space-y-4">
              {recentlyAccessedCourses.map((course) => {
                const Icon = courseIcons[course.icon] ?? BookOpen;
                return (
                  <li
                    key={course.slug}
                    className="flex flex-wrap items-center gap-3 border-b border-[#E5EAF2] pb-4 last:border-0 last:pb-0"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: course.iconBg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: course.accent }} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#002B7F]">{course.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ProgressBar value={course.progress} color={course.accent} height={5} className="max-w-[140px] flex-1" />
                        <span className="text-[11px] font-semibold" style={{ color: course.accent }}>
                          {course.progress}%
                        </span>
                        <span className="rounded-md bg-[#EBF2FF] px-2 py-0.5 text-[10px] font-medium text-[#0057FF]">
                          In Progress
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">Last accessed: {course.lastAccessed}</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpen(menuOpen === course.slug ? null : course.slug)}
                        className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F7F9FC] hover:text-[#002B7F]"
                        aria-label="Course options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === course.slug && (
                        <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-[10px] border border-[#E5EAF2] bg-white py-1 shadow-lg">
                          <Link
                            href={`/courses/${course.slug}/lessons/1`}
                            className="block px-3 py-2 text-[12px] text-[#374151] hover:bg-[#F7F9FC]"
                            onClick={() => setMenuOpen(null)}
                          >
                            Continue Learning
                          </Link>
                          <Link
                            href={`/courses/${course.slug}/lessons/1`}
                            className="block px-3 py-2 text-[12px] text-[#374151] hover:bg-[#F7F9FC]"
                            onClick={() => setMenuOpen(null)}
                          >
                            View Course
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#EBF2FF] px-4 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0057FF]/10 text-[#0057FF]">
                <Shield className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#002B7F]">Keep Your Profile Updated</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">
                  Up-to-date information helps us personalize your learning experience.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="ed-btn-outline shrink-0 gap-1 text-[13px]"
            >
              Update Now
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Achievements + quick actions */}
        <div className="space-y-4">
          <div className="ed-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#002B7F]">Achievements</h3>
              <button type="button" className="text-[12px] font-medium text-[#0057FF] hover:underline">
                View All
              </button>
            </div>
            <ul className="space-y-4">
              {profileAchievements.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <Medal className="h-5 w-5" style={{ color: item.accent }} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#002B7F]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B7280]">{item.description}</p>
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">Earned on {item.earned}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="ed-card p-5">
            <h3 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Edit Profile", icon: User, action: () => setEditOpen(true) },
                { label: "Change Password", icon: Lock, action: () => setPasswordOpen(true) },
                { label: "Notification Settings", icon: Bell, href: "/settings" },
                {
                  label: "Download Certificates",
                  icon: Download,
                  action: () => showToast("Certificate download started."),
                },
              ].map(({ label, icon: Icon, action, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    className="flex flex-col items-center gap-2 rounded-[10px] border border-[#E5EAF2] bg-white px-3 py-4 text-center transition-colors hover:border-[#0057FF] hover:bg-[#F7F9FC]"
                  >
                    <Icon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
                    <span className="text-[11px] font-medium leading-snug text-[#374151]">{label}</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="flex flex-col items-center gap-2 rounded-[10px] border border-[#E5EAF2] bg-white px-3 py-4 text-center transition-colors hover:border-[#0057FF] hover:bg-[#F7F9FC]"
                  >
                    <Icon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
                    <span className="text-[11px] font-medium leading-snug text-[#374151]">{label}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        initial={{ ...profile, name: displayName, email: displayEmail }}
        onClose={() => setEditOpen(false)}
        onSave={saveProfile}
      />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[5]"
          aria-label="Close menu"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
