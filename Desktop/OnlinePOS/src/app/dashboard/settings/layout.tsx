import { SettingsSectionLayout } from "@/components/settings/settings-section-layout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsSectionLayout>{children}</SettingsSectionLayout>;
}
