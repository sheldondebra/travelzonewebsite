import Link from "next/link";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import { logoutAction } from "@/app/admin/actions/auth";
import { AdminHeaderSmsBalance } from "@/components/admin/AdminHeaderSmsBalance";
import type { SplitSmsBalance } from "@/lib/splitsms";
import type { StaffRole } from "@/lib/supabase/auth";

type Props = {
  email: string;
  role: StaffRole;
  splitsmsReady: boolean;
  smsBalance: SplitSmsBalance | null;
  smsBalanceError: string | null;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function AdminHeader({
  email,
  role,
  splitsmsReady,
  smsBalance,
  smsBalanceError,
  menuOpen = false,
  onMenuToggle,
}: Props) {
  return (
    <header className="admin-bar">
      <div className="admin-bar-brand">
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
        <Link href="/admin" className="admin-bar-brand-link">
          Travel Zone Ghana
        </Link>
        <Link
          href="/"
          target="_blank"
          className="admin-bar-visit hidden sm:inline-flex"
        >
          Visit site
          <HiArrowTopRightOnSquare className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <AdminHeaderSmsBalance
        role={role}
        splitsmsReady={splitsmsReady}
        initialBalance={smsBalance}
        initialError={smsBalanceError}
      />

      <div className="admin-bar-actions">
        <span className="admin-bar-user" title={email}>
          {email}
        </span>
        <span className="admin-bar-divider" aria-hidden />
        <form action={logoutAction}>
          <button type="submit" className="admin-bar-logout">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
