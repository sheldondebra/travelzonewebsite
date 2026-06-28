import type { ReactNode } from "react";
import { contactInfo } from "@/lib/content";
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/ContactIcons";

function ContactDetail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-red uppercase">
        <span className="shrink-0">{icon}</span>
        {label}
      </p>
      <div className="mt-2 pl-6">{children}</div>
    </div>
  );
}

export function ContactDetails() {
  return (
    <div className="rounded-2xl bg-cream p-8">
      <h3 className="heading-serif text-xl text-navy">Contact Details</h3>

      <div className="mt-6 space-y-5">
        <ContactDetail icon={<MapPinIcon />} label="Office Address">
          <p className="text-[15px] font-medium text-navy">{contactInfo.address}</p>
        </ContactDetail>

        <ContactDetail icon={<PhoneIcon />} label="Phone">
          <div className="space-y-1">
            {contactInfo.phones.map((phone, i) => (
              <a
                key={phone}
                href={`tel:${contactInfo.phoneHrefs[i]}`}
                className="block text-[15px] font-medium text-navy hover:text-brand-red"
              >
                {phone}
              </a>
            ))}
          </div>
        </ContactDetail>

        <ContactDetail icon={<MailIcon />} label="Email">
          <a
            href={`mailto:${contactInfo.email}`}
            className="block text-[15px] font-medium text-navy hover:text-brand-red"
          >
            {contactInfo.email}
          </a>
        </ContactDetail>

        <ContactDetail icon={<ClockIcon />} label="Office Hours">
          <p className="text-[15px] text-navy">{contactInfo.hours}</p>
        </ContactDetail>
      </div>
    </div>
  );
}
