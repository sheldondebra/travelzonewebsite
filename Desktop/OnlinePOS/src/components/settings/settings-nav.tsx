"use client";

import {
  ArrowUpCircle,
  Banknote,
  Building2,
  Coins,
  CreditCard,
  Database,
  FileText,
  Globe,
  LayoutGrid,
  Mail,
  MessageSquare,
  Palette,
  Receipt,
  ScanLine,
  Settings,
  Shield,
  Smartphone,
  Warehouse,
} from "lucide-react";
import { SectionNav } from "@/components/layout/section-nav";

const items = [
  { href: "/dashboard/settings", label: "Overview", icon: Settings, exact: true },
  { href: "/dashboard/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/dashboard/settings/languages", label: "Languages", icon: Globe },
  { href: "/dashboard/settings/payment-methods", label: "Payments", icon: Banknote },
  { href: "/dashboard/settings/sms", label: "SMS", icon: MessageSquare },
  { href: "/dashboard/settings/sms-templates", label: "SMS templates", icon: FileText },
  { href: "/dashboard/settings/mail", label: "Mail", icon: Mail },
  { href: "/dashboard/settings/email-templates", label: "Email templates", icon: Mail },
  { href: "/dashboard/settings/pos", label: "POS", icon: ScanLine },
  { href: "/dashboard/settings/pos-receipt", label: "Receipt", icon: Receipt },
  { href: "/dashboard/settings/modules", label: "Modules", icon: LayoutGrid },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings/upgrade", label: "Upgrade", icon: ArrowUpCircle },
  { href: "/dashboard/settings/payment-gateway", label: "Gateway", icon: CreditCard },
  { href: "/dashboard/settings/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/dashboard/settings/currency", label: "Currency", icon: Coins },
  { href: "/dashboard/settings/backup", label: "Backup", icon: Database },
  { href: "/dashboard/settings/devices", label: "Devices", icon: Smartphone },
  { href: "/dashboard/settings/security", label: "Security", icon: Shield },
  { href: "/dashboard/settings/business", label: "Business", icon: Building2 },
];

export function SettingsNav() {
  return <SectionNav title="System settings" items={items} />;
}
