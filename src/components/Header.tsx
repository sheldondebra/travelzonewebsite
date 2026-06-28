"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Tours", href: "/tours" },
  { label: "What We Do", href: "/what-we-do" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  onClick,
  className = "",
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative py-1 text-[14px] font-medium transition-colors ${className} ${
        active ? "font-semibold text-white" : "text-white/90 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-0.5 left-0 h-0.5 bg-brand-red transition-[width] duration-300 ease-out ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
        aria-hidden
      />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const solid = !isHome || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "bg-navy/95 shadow-lg backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="section-container flex h-[92px] items-center justify-between lg:h-[100px]">
        <Logo size="lg" />

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isNavActive(pathname, link.href)}
            />
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link href="/consultation" className="btn-primary px-6 py-2.5 text-[13px]">
            Book consultation
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="flex flex-col gap-1.5 lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-navy px-6 py-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isNavActive(pathname, link.href)}
                className="text-[15px]"
                onClick={() => setMenuOpen(false)}
              />
            ))}
            <Link
              href="/consultation"
              className="btn-primary mt-2 w-fit"
              onClick={() => setMenuOpen(false)}
            >
              Book consultation
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
