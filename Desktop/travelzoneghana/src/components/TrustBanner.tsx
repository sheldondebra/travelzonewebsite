import { contactInfo } from "@/lib/content";

export function TrustBanner() {
  return (
    <div className="border-b border-white/10 bg-brand-red py-4">
      <div className="section-container flex flex-col gap-2 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          Open now · East Legon, Accra
        </p>
        <p className="text-white/90">
          Flights · hotels · insurance · tours ·{" "}
          <a href={`tel:${contactInfo.phoneHrefs[0]}`} className="underline underline-offset-2">
            {contactInfo.phones[0]}
          </a>
        </p>
      </div>
    </div>
  );
}
