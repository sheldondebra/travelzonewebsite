import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";
import { CookieSettingsLink } from "@/components/cookies/CookieSettingsLink";
import { contactInfo } from "@/lib/content";
import { socialLinks } from "@/lib/social";
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/ContactIcons";

const quickLinks = [
  { label: "About", href: "/about" },
  { label: "Tours", href: "/tours" },
  { label: "What We Do", href: "/what-we-do" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-sm font-semibold tracking-wide uppercase">
      {children}
      <span className="mt-2 block h-0.5 w-1/2 bg-brand-red" aria-hidden />
    </h4>
  );
}

function ContactItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-brand-red">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function Footer() {
  return (
    <>
      <NewsletterSignup />
      <footer className="bg-navy text-white">
      <div className="section-container py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Logo size="md" />
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Travel and destination management from our East Legon office.
              Flights, hotels, insurance, and tours since 2004.
            </p>
            <SocialLinks className="mt-6" />
          </div>

          <div>
            <FooterHeading>Quick Links</FooterHeading>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Contact</FooterHeading>
            <ul className="mt-5 space-y-4 text-sm text-white/65">
              <ContactItem icon={<MapPinIcon />}>
                {contactInfo.address}
              </ContactItem>
              <ContactItem icon={<PhoneIcon />}>
                <span className="flex flex-col gap-1">
                  {contactInfo.phones.map((phone, i) => (
                    <a
                      key={phone}
                      href={`tel:${contactInfo.phoneHrefs[i]}`}
                      className="hover:text-white"
                    >
                      {phone}
                    </a>
                  ))}
                </span>
              </ContactItem>
              <ContactItem icon={<MailIcon />}>
                <a href={`mailto:${contactInfo.email}`} className="hover:text-white">
                  {contactInfo.email}
                </a>
              </ContactItem>
              <ContactItem icon={<ClockIcon />}>
                <span className="text-xs text-white/45">{contactInfo.hours}</span>
              </ContactItem>
            </ul>
          </div>

          <div>
            <FooterHeading>Visit or call</FooterHeading>
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Walk in during office hours or message us on{" "}
              {socialLinks.instagram.handle} for quick questions.
            </p>
            <Link href="/contact" className="btn-primary mt-5 inline-flex">
              Get directions
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Travel Zone · East Legon, Accra · Developed by{" "}
            <a
              href="https://www.tecunitgh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/65 transition-colors hover:text-white"
            >
              Tecunit
            </a>
            {" · "}
            <CookieSettingsLink className="text-white/65 hover:text-white" />
          </p>
          <Image
            src="/images/paystack-secured.png"
            alt="Secured by Paystack — Visa, Mastercard, MTN MoMo, and more"
            width={320}
            height={48}
            className="h-10 w-auto self-end opacity-90 sm:h-11 sm:self-auto"
          />
        </div>
      </div>
    </footer>
    </>
  );
}
