import Link from "next/link";
import { logoutAction } from "@/app/admin/actions/auth";

type Props = {
  email: string;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function AdminHeader({ email, menuOpen = false, onMenuToggle }: Props) {
  return (
    <header className="admin-bar">
      <div className="flex items-center gap-3">
        {onMenuToggle ? (
          <button
            type="button"
            className="admin-bar-menu md:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar-nav"
            onClick={onMenuToggle}
          >
            Menu
          </button>
        ) : null}
        <Link href="/admin" className="admin-bar-link font-semibold">
          Travel Zone Ghana
        </Link>
        <Link href="/" target="_blank" className="admin-bar-link hidden sm:inline">
          Visit site
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-[12px] text-[#c3c4c7] sm:inline">{email}</span>
        <form action={logoutAction}>
          <button type="submit" className="admin-bar-link">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
