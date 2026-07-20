import { PageHeader } from "@/components/edamad/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Notification preferences and account settings." />
      <div className="ed-card max-w-lg space-y-4 p-5">
        <label className="flex items-center justify-between text-sm">
          <span>Email notifications</span>
          <input type="checkbox" defaultChecked className="rounded" />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Practice reminders</span>
          <input type="checkbox" defaultChecked className="rounded" />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>Live class alerts</span>
          <input type="checkbox" className="rounded" />
        </label>
      </div>
    </div>
  );
}
