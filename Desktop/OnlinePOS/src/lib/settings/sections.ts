import type { LucideIcon } from "lucide-react";
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
  Shield,
  Smartphone,
  Warehouse,
} from "lucide-react";

export type SettingsSection = {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
};

export const settingsSections: SettingsSection[] = [
  { href: "/dashboard/settings/appearance", label: "Appearance", icon: Palette, desc: "Brand colors and dashboard look" },
  { href: "/dashboard/settings/languages", label: "Languages", icon: Globe, desc: "Locale and date/time formats" },
  { href: "/dashboard/settings/payment-methods", label: "Payments", icon: Banknote, desc: "POS payment methods" },
  { href: "/dashboard/settings/sms", label: "SMS", icon: MessageSquare, desc: "Balance, Sender ID, and automations" },
  { href: "/dashboard/settings/sms-templates", label: "SMS templates", icon: FileText, desc: "Receipt and notification SMS" },
  { href: "/dashboard/settings/mail", label: "Mail", icon: Mail, desc: "Email delivery settings" },
  { href: "/dashboard/settings/email-templates", label: "Email templates", icon: Mail, desc: "Receipt and welcome emails" },
  { href: "/dashboard/settings/pos", label: "POS", icon: ScanLine, desc: "Checkout defaults and behavior" },
  { href: "/dashboard/settings/pos-receipt", label: "Receipt", icon: Receipt, desc: "Receipt layout and auto-send" },
  { href: "/dashboard/settings/modules", label: "Modules", icon: LayoutGrid, desc: "Enable or disable features" },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard, desc: "Plan, invoices, and subscription payments" },
  { href: "/dashboard/settings/upgrade", label: "Upgrade", icon: ArrowUpCircle, desc: "Subscription plans" },
  { href: "/dashboard/settings/payment-gateway", label: "Gateway", icon: CreditCard, desc: "Online payment keys" },
  { href: "/dashboard/settings/warehouse", label: "Warehouse", icon: Warehouse, desc: "Stock locations and rules" },
  { href: "/dashboard/settings/currency", label: "Currency", icon: Coins, desc: "Price display format" },
  { href: "/dashboard/settings/backup", label: "Backup", icon: Database, desc: "Export configuration" },
  { href: "/dashboard/settings/devices", label: "Devices", icon: Smartphone, desc: "Session management" },
  { href: "/dashboard/settings/security", label: "Security", icon: Shield, desc: "Password and account" },
  { href: "/dashboard/settings/business", label: "Business", icon: Building2, desc: "Store profile and tax" },
];
