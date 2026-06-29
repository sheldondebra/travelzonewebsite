import Link from "next/link";
import { PhoneIcon } from "@/components/ContactIcons";
import { contactInfo } from "@/lib/content";
import {
  consultationModes,
  getModeLabel,
  getTimeSlotLabel,
  getTopicLabel,
  type ConsultationMode,
  type ConsultationTimeSlot,
  type ConsultationTopic,
} from "@/lib/consultations";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import { formatShortDate } from "@/lib/date-utils";
import { getWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  availability?: ConsultationAvailabilitySettings;
  preferredDate?: string;
  preferredTime?: ConsultationTimeSlot | "";
  topic?: ConsultationTopic | "";
  mode?: ConsultationMode | "";
  fullName?: string;
  bookingId?: string;
};

export function ConsultationSummary({
  availability,
  preferredDate,
  preferredTime,
  topic,
  mode,
  fullName,
  bookingId,
}: Props) {
  const hasSchedule = Boolean(preferredDate && preferredTime);
  const hasDetails = Boolean(topic && mode);

  const whatsappMessage = hasSchedule
    ? `Hello Travel Zone Ghana, I'd like to book a consultation.${
        preferredDate ? `\nPreferred date: ${formatShortDate(preferredDate)}` : ""
      }${
        preferredTime
          ? `\nPreferred time: ${getTimeSlotLabel(preferredTime as ConsultationTimeSlot, availability)}`
          : ""
      }${topic ? `\nTopic: ${getTopicLabel(topic as ConsultationTopic)}` : ""}${
        mode ? `\nMeeting: ${getModeLabel(mode as ConsultationMode)}` : ""
      }${fullName ? `\nName: ${fullName}` : ""}${
        bookingId ? `\nReference: ${bookingId}` : ""
      }`
    : "Hello Travel Zone Ghana, I'd like to book a free travel consultation.";

  return (
    <div className="space-y-5 lg:sticky lg:top-28">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-red uppercase">
          Your appointment
        </p>
        <h3 className="heading-serif mt-2 text-xl text-navy">
          {bookingId ? "Request submitted" : hasSchedule ? "Almost there" : "Pick a time"}
        </h3>

        <dl className="mt-5 space-y-4 text-sm">
          <SummaryRow
            label="Date"
            value={preferredDate ? formatShortDate(preferredDate) : "Choose on the calendar"}
            muted={!preferredDate}
          />
          <SummaryRow
            label="Time"
            value={
              preferredTime
                ? getTimeSlotLabel(preferredTime as ConsultationTimeSlot, availability)
                : "Select an available slot"
            }
            muted={!preferredTime}
          />
          <SummaryRow
            label="Meeting"
            value={mode ? getModeLabel(mode as ConsultationMode) : "Office visit or phone call"}
            muted={!mode}
          />
          <SummaryRow
            label="Topic"
            value={topic ? getTopicLabel(topic as ConsultationTopic) : "What you want to discuss"}
            muted={!topic}
          />
          {bookingId ? (
            <SummaryRow label="Reference" value={bookingId} />
          ) : null}
        </dl>

        {mode === "in-office" ? (
          <p className="mt-5 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-text-muted">
            Visit us at {contactInfo.address}. Walk-ins are welcome, but booking helps us
            prepare for your visit.
          </p>
        ) : null}

        {!hasSchedule || !hasDetails ? (
          <p className="mt-4 text-xs text-text-muted">
            Complete the steps on the left to request your consultation.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-navy p-6 text-white">
        <h4 className="text-sm font-semibold">Need it sooner?</h4>
        <p className="mt-2 text-sm text-white/75">
          Call or WhatsApp us and we&apos;ll fit you in if a slot is open today.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={`tel:${contactInfo.phoneHrefs[0]}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold hover:border-white"
          >
            <PhoneIcon className="h-4 w-4" />
            Call {contactInfo.phones[0]}
          </a>
          <a
            href={getWhatsAppUrl(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            WhatsApp us
          </a>
        </div>
      </div>

      {mode === "in-office" ? (
        <div className="overflow-hidden rounded-2xl shadow-sm">
          <iframe
            title="Travel Zone office location"
            src={`https://maps.google.com/maps?q=${contactInfo.mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            className="h-48 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="bg-white px-4 py-3 text-sm">
            <Link
              href={`https://maps.google.com/?q=${contactInfo.mapQuery}`}
              target="_blank"
              className="font-semibold text-brand-red hover:underline"
            >
              Get directions
            </Link>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-text-muted">{contactInfo.hours}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className={`max-w-[14rem] text-right font-medium ${muted ? "text-text-muted" : "text-navy"}`}>
        {value}
      </dd>
    </div>
  );
}

export function ModeToggle({
  value,
  onChange,
  error,
}: {
  value: ConsultationMode | "";
  onChange: (mode: ConsultationMode) => void;
  error?: string;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-navy">How would you like to meet?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {consultationModes.map((mode) => {
          const selected = value === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                selected
                  ? "border-brand-red bg-brand-red/5"
                  : "border-gray-200 hover:border-brand-red/40"
              }`}
            >
              <span className="block text-sm font-semibold text-navy">{mode.label}</span>
              <span className="mt-1 block text-xs text-text-muted">
                {mode.value === "in-office"
                  ? "Best for brochures, group planning, and detailed itineraries."
                  : "We call you at your chosen time — ideal for quick fare checks."}
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-brand-red">{error}</p> : null}
    </div>
  );
}
