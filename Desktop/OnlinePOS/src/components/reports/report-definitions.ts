import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  CreditCard,
  FileText,
  Package,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export const REPORT_IDS = [
  "sales",
  "profit-loss",
  "payments",
  "stock",
  "purchases",
  "products",
  "customers",
  "delivery",
  "expenses",
  "cash-flow",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export type ReportDefinition = {
  id: ReportId;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "sales",
    title: "Sales Report",
    shortTitle: "Sales",
    description: "Orders, revenue, profit, and average order value.",
    icon: ShoppingBag,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "profit-loss",
    title: "Profit & Loss Report",
    shortTitle: "P&L",
    description: "Revenue, gross profit, expenses, margin, and net profit.",
    icon: TrendingUp,
    accent: "bg-blue-100 text-blue-700",
  },
  {
    id: "payments",
    title: "Payments Report",
    shortTitle: "Payments",
    description: "Payment methods, collected money, and outstanding balances.",
    icon: CreditCard,
    accent: "bg-violet-100 text-violet-700",
  },
  {
    id: "stock",
    title: "Stock Report",
    shortTitle: "Stock",
    description: "Units on hand, inventory value, low stock, and movements.",
    icon: Boxes,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    id: "purchases",
    title: "Purchases Report",
    shortTitle: "Purchases",
    description: "Purchase orders, suppliers, ordered units, and received units.",
    icon: Package,
    accent: "bg-orange-100 text-orange-700",
  },
  {
    id: "products",
    title: "Products Report",
    shortTitle: "Products",
    description: "Best sellers, unsold products, stock value, and product revenue.",
    icon: FileText,
    accent: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "customers",
    title: "Customers Report",
    shortTitle: "Customers",
    description: "Top customers, repeat buyers, revenue, and outstanding balances.",
    icon: Users,
    accent: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "delivery",
    title: "Delivery Report",
    shortTitle: "Delivery",
    description: "Delivery status, riders, cities, scheduled orders, and tracking.",
    icon: Truck,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    id: "expenses",
    title: "Expenses Report",
    shortTitle: "Expenses",
    description: "Expenses by category and total operating cost.",
    icon: ReceiptText,
    accent: "bg-red-100 text-red-700",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Report",
    shortTitle: "Cash flow",
    description: "Collected income, expenses, net cash flow, and receivables.",
    icon: ArrowLeftRight,
    accent: "bg-teal-100 text-teal-700",
  },
];

export function getReportDefinition(reportId: string) {
  return REPORT_DEFINITIONS.find((report) => report.id === reportId);
}

export function isReportId(reportId: string): reportId is ReportId {
  return REPORT_IDS.includes(reportId as ReportId);
}

export const REPORT_CENTER_SUMMARY = {
  id: "overview",
  title: "Reports Center",
  shortTitle: "Center",
  description: "Detailed business reports for sales, delivery, stock, finance, customers, and products.",
  icon: Wallet,
  accent: "bg-primary/25 text-foreground",
};
