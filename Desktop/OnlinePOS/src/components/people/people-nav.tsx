"use client";

import {
  LogIn,
  LogOut,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { SectionNav } from "@/components/layout/section-nav";

const items = [
  {
    href: "/dashboard/people/customers",
    label: "Customers",
    icon: Users,
    exact: true,
  },
  {
    href: "/dashboard/people/customers/new",
    label: "New customer",
    icon: UserPlus,
  },
  {
    href: "/dashboard/people/customers/import",
    label: "Import customers",
    icon: Upload,
  },
  {
    href: "/dashboard/people/customers/without-login",
    label: "No login",
    icon: LogOut,
  },
  {
    href: "/dashboard/people/customers/with-login",
    label: "With login",
    icon: LogIn,
  },
];

export function PeopleNav() {
  return <SectionNav title="Customers" items={items} />;
}
