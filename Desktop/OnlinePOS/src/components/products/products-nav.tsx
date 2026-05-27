"use client";

import {
  Boxes,
  ClipboardList,
  FolderTree,
  Layers,
  PackagePlus,
  Printer,
  Ruler,
  Sparkles,
  Tag,
  TrendingUp,
  Upload,
  Warehouse,
  HardDrive,
} from "lucide-react";
import { SectionNav } from "@/components/layout/section-nav";

const items = [
  { href: "/dashboard/products/new", label: "Create", icon: PackagePlus },
  { href: "/dashboard/products", label: "All products", icon: Boxes, exact: true },
  { href: "/dashboard/products/import", label: "Import", icon: Upload },
  { href: "/dashboard/products/bulk-pricing", label: "Bulk pricing", icon: TrendingUp },
  { href: "/dashboard/products/database-import", label: "DB import", icon: HardDrive },
  { href: "/dashboard/products/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/dashboard/products/opening-stock", label: "Opening stock", icon: ClipboardList },
  { href: "/dashboard/products/labels", label: "Labels", icon: Printer },
  { href: "/dashboard/products/stock-count", label: "Count stock", icon: Tag },
  { href: "/dashboard/products/categories", label: "Category", icon: FolderTree },
  { href: "/dashboard/products/sub-categories", label: "Sub category", icon: Layers },
  { href: "/dashboard/products/brands", label: "Brand", icon: Sparkles },
  { href: "/dashboard/products/units", label: "Unit", icon: Ruler },
];

export function ProductsNav() {
  return <SectionNav title="Products" items={items} />;
}
