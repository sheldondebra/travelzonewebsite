import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Package,
  ScanLine,
  Settings,
  ShoppingBag,
  Smartphone,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type ModuleKey = keyof import("@/lib/settings/defaults").BusinessSettings["modules"];

export type NavIconStyle = {
  bg: string;
  text: string;
  activeBg: string;
  activeText: string;
};

export type DashboardNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  moduleKey?: ModuleKey;
  iconStyle: NavIconStyle;
};

export const navIconStyles = {
  overview: {
    bg: "bg-sky-100",
    text: "text-sky-600",
    activeBg: "bg-sky-500",
    activeText: "text-white",
  },
  products: {
    bg: "bg-violet-100",
    text: "text-violet-600",
    activeBg: "bg-violet-500",
    activeText: "text-white",
  },
  pos: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
  },
  orders: {
    bg: "bg-rose-100",
    text: "text-rose-600",
    activeBg: "bg-rose-500",
    activeText: "text-white",
  },
  people: {
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    activeBg: "bg-cyan-500",
    activeText: "text-white",
  },
  suppliers: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    activeBg: "bg-orange-500",
    activeText: "text-white",
  },
  expenses: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    activeBg: "bg-amber-500",
    activeText: "text-white",
  },
  tasks: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    activeBg: "bg-indigo-500",
    activeText: "text-white",
  },
  analytics: {
    bg: "bg-fuchsia-100",
    text: "text-fuchsia-600",
    activeBg: "bg-fuchsia-500",
    activeText: "text-white",
  },
  reports: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    activeBg: "bg-blue-500",
    activeText: "text-white",
  },
  settings: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    activeBg: "bg-slate-600",
    activeText: "text-white",
  },
  platform: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    activeBg: "bg-orange-500",
    activeText: "text-white",
  },
  communications: {
    bg: "bg-teal-100",
    text: "text-teal-600",
    activeBg: "bg-teal-500",
    activeText: "text-white",
  },
} satisfies Record<string, NavIconStyle>;

export const dashboardLinks: DashboardNavLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    iconStyle: navIconStyles.overview,
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
    iconStyle: navIconStyles.products,
  },
  {
    href: "/dashboard/pos",
    label: "POS",
    icon: ScanLine,
    moduleKey: "pos",
    iconStyle: navIconStyles.pos,
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: ShoppingBag,
    iconStyle: navIconStyles.orders,
  },
  {
    href: "/dashboard/people/customers",
    label: "Customers",
    icon: Users,
    iconStyle: navIconStyles.people,
  },
  {
    href: "/dashboard/suppliers",
    label: "Suppliers",
    icon: Truck,
    iconStyle: navIconStyles.suppliers,
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    icon: Wallet,
    iconStyle: navIconStyles.expenses,
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: ClipboardList,
    moduleKey: "tasks",
    iconStyle: navIconStyles.tasks,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    moduleKey: "analytics",
    iconStyle: navIconStyles.analytics,
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: FileText,
    iconStyle: navIconStyles.reports,
  },
  {
    href: "/dashboard/settings",
    label: "System settings",
    icon: Settings,
    iconStyle: navIconStyles.settings,
  },
];

export const platformLinks: DashboardNavLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    iconStyle: navIconStyles.overview,
  },
  {
    href: "/dashboard/platform/users",
    label: "Users",
    icon: Users,
    iconStyle: navIconStyles.people,
  },
  {
    href: "/dashboard/platform/billing",
    label: "Billing",
    icon: CreditCard,
    iconStyle: navIconStyles.platform,
  },
  {
    href: "/dashboard/platform/sms",
    label: "SMS control",
    icon: Smartphone,
    iconStyle: navIconStyles.communications,
  },
  {
    href: "/dashboard/platform/communications",
    label: "Communications",
    icon: MessageSquare,
    iconStyle: navIconStyles.communications,
  },
];

export const mobileTabLinks: DashboardNavLink[] = [
  dashboardLinks[0],
  dashboardLinks[1],
  dashboardLinks[2],
  dashboardLinks[3],
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/products": "Products",
  "/dashboard/pos": "POS",
  "/dashboard/orders": "Orders",
  "/dashboard/people": "People",
  "/dashboard/people/customers": "Customers",
  "/dashboard/people/suppliers": "Suppliers",
  "/dashboard/customers": "Customers",
  "/dashboard/suppliers": "Suppliers",
  "/dashboard/expenses": "Expenses",
  "/dashboard/tasks": "Tasks",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
  "/dashboard/platform": "General Office",
  "/dashboard/platform/users": "Users",
  "/dashboard/platform/billing": "Billing",
  "/dashboard/platform/sms": "SMS control",
};

export function getDashboardPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];

  const segments = pathname.split("/").filter(Boolean);
  if (pathname.startsWith("/dashboard/people/customers")) return "Customers";
  if (pathname.startsWith("/dashboard/people/suppliers")) return "Suppliers";
  if (pathname.startsWith("/dashboard/suppliers")) return "Suppliers";

  if (segments.length >= 2) {
    const base = `/${segments[0]}/${segments[1]}`;
    if (pageTitles[base]) return pageTitles[base];
  }

  const last = segments[segments.length - 1];
  if (!last) return "Dashboard";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isNavLinkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const productStaticSegments = new Set([
  "new",
  "import",
  "categories",
  "sub-categories",
  "brands",
  "units",
  "warehouses",
  "stock-count",
  "opening-stock",
  "labels",
  "bulk-pricing",
  "database-import",
]);

/** Immersive flows: hide global bottom nav so page-level actions aren't obscured. */
export function isDashboardFocusMode(pathname: string): boolean {
  if (pathname === "/dashboard/products/new") return true;
  if (/\/dashboard\/products\/[^/]+\/edit$/.test(pathname)) return true;

  const productDetail = pathname.match(/^\/dashboard\/products\/([^/]+)$/);
  if (productDetail && !productStaticSegments.has(productDetail[1])) return true;

  if (/^\/dashboard\/orders\/[^/]+$/.test(pathname) && !pathname.endsWith("/receipt")) {
    return true;
  }

  return false;
}
