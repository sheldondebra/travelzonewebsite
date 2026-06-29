"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bookConsultation } from "@/app/actions/consultation";
import { ConsultationDatePicker } from "@/components/consultation/ConsultationDatePicker";
import {
  ConsultationSummary,
  ModeToggle,
} from "@/components/consultation/ConsultationSummary";
import { contactInfo } from "@/lib/content";
import {
  consultationTopics,
  getAvailableTimeSlots,
  getModeLabel,
  getNextAvailableConsultationDate,
  getTimeSlotLabel,
  getTopicLabel,
  isConsultationDateSelectable,
  type ConsultationInput,
  type ConsultationMode,
  type ConsultationTimeSlot,
  type ConsultationTopic,
} from "@/lib/consultations";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import { formatShortDate, getLocalTodayIso } from "@/lib/date-utils";

type Step = "schedule" | "details" | "review";

type FormFields = {
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: ConsultationTimeSlot | "";
  topic: ConsultationTopic | "";
  mode: ConsultationMode;
  notes: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

const minDate = getLocalTodayIso();

const steps: { id: Step; label: string }[] = [
  { id: "schedule", label: "Schedule" },
  { id: "details", label: "Your details" },
  { id: "review", label: "Review" },
];

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-7 py-3 text-sm font-semibold text-navy hover:border-brand-red hover:text-brand-red";

function fieldClass(hasError: boolean) {
  return `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? "border-brand-red focus:border-brand-red"
      : "border-gray-200 focus:border-brand-red"
  }`;
}

function validateSchedule(
  fields: FormFields,
  availability: ConsultationAvailabilitySettings,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.preferredDate) {
    errors.preferredDate = "Please select a date.";
  } else if (!isConsultationDateSelectable(fields.preferredDate, availability, minDate)) {
    errors.preferredDate = "That date is not available. Choose another day.";
  }

  if (!fields.preferredTime) {
    errors.preferredTime = "Please select a time slot.";
  } else if (
    fields.preferredDate &&
    getAvailableTimeSlots(fields.preferredDate, availability).every(
      (slot) => slot.value !== fields.preferredTime,
    )
  ) {
    errors.preferredTime = "That time is no longer available. Pick another slot.";
  }

  if (!fields.mode) {
    errors.mode = "Please choose how you would like to meet.";
  }

  return errors;
}

function validateDetails(fields: FormFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (
    !fields.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
  ) {
    errors.email = "Enter a valid email address.";
  }

  const phone = fields.phone.trim().replace(/[\s-]/g, "");
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^(\+233|0)[2-9]\d{8}$/.test(phone)) {
    errors.phone = "Enter a valid Ghana phone number (e.g. 0244 274 663).";
  }

  if (!fields.topic) {
    errors.topic = "Please select a topic.";
  }

  return errors;
}

export function BookConsultationForm({
  availability,
}: {
  availability: ConsultationAvailabilitySettings;
}) {
  const defaultDate = getNextAvailableConsultationDate(availability);
  const [step, setStep] = useState<Step>("schedule");
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    email: "",
    phone: "",
    preferredDate: defaultDate,
    preferredTime: "",
    topic: "",
    mode: "in-office",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const availableTimeSlots = useMemo(
    () => getAvailableTimeSlots(fields.preferredDate, availability),
    [availability, fields.preferredDate],
  );

  const stepIndex = steps.findIndex((item) => item.id === step);

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "preferredDate") {
        const slots = getAvailableTimeSlots(String(value), availability);
        if (
          prev.preferredTime &&
          !slots.some((slot) => slot.value === prev.preferredTime)
        ) {
          next.preferredTime = "";
        }
      }

      return next;
    });

    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function goToStep(nextStep: Step) {
    setError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleContinueFromSchedule() {
    const errors = validateSchedule(fields, availability);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    goToStep("details");
  }

  function handleContinueFromDetails() {
    const scheduleErrors = validateSchedule(fields, availability);
    const detailErrors = validateDetails(fields);
    const errors = { ...scheduleErrors, ...detailErrors };
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    goToStep("review");
  }

  async function handleSubmit() {
    setError("");

    const errors = {
      ...validateSchedule(fields, availability),
      ...validateDetails(fields),
    };
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.preferredDate || errors.preferredTime || errors.mode) {
        goToStep("schedule");
      } else {
        goToStep("details");
      }
      return;
    }

    setSubmitting(true);

    try {
      const input: ConsultationInput = {
        fullName: fields.fullName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        preferredDate: fields.preferredDate,
        preferredTime: fields.preferredTime as ConsultationTimeSlot,
        topic: fields.topic as ConsultationTopic,
        mode: fields.mode,
        notes: fields.notes.trim() || undefined,
      };

      const result = await bookConsultation(input);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setBookingId(result.bookingId);
    } catch {
      setError("Something went wrong. Please try again or call us to book.");
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingId) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm lg:text-left">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10 lg:mx-0">
            <span className="text-2xl text-accent-green">✓</span>
          </div>
          <h3 className="heading-serif text-2xl text-navy">Consultation requested</h3>
          <p className="mt-3 text-[15px] text-text-muted">
            Thank you, {fields.fullName.split(" ")[0]}. Your reference is{" "}
            <strong className="text-navy">{bookingId}</strong>. We&apos;ll confirm your
            appointment by phone or email within one business day.
          </p>
          <div className="mt-6 rounded-xl bg-cream px-5 py-4 text-left text-sm text-navy">
            <p className="font-semibold">{formatShortDate(fields.preferredDate)}</p>
            <p className="mt-1 text-text-muted">
              {getTimeSlotLabel(fields.preferredTime as ConsultationTimeSlot, availability)} ·{" "}
              {getModeLabel(fields.mode)} · {getTopicLabel(fields.topic as ConsultationTopic)}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/tours" className="btn-primary">
              Browse tour packages
            </Link>
            <button
              type="button"
              onClick={() => {
                setBookingId(null);
                setStep("schedule");
                setFields({
                  fullName: "",
                  email: "",
                  phone: "",
                  preferredDate: defaultDate,
                  preferredTime: "",
                  topic: "",
                  mode: "in-office",
                  notes: "",
                });
              }}
              className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-7 py-3 text-sm font-semibold text-navy hover:border-brand-red hover:text-brand-red"
            >
              Book another
            </button>
          </div>
        </div>

        <ConsultationSummary
          availability={availability}
          preferredDate={fields.preferredDate}
          preferredTime={fields.preferredTime}
          topic={fields.topic}
          mode={fields.mode}
          fullName={fields.fullName}
          bookingId={bookingId}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="mb-8">
          <h2 className="heading-serif text-2xl text-brand-red">Book a Consultation</h2>
          <p className="mt-2 text-sm text-text-muted">
            Free and no obligation. Choose a time, tell us what you need, and our team
            will prepare before you arrive or call.
          </p>
        </div>

        <ol className="mb-8 flex flex-wrap gap-2">
          {steps.map((item, index) => {
            const active = item.id === step;
            const complete = index < stepIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (complete) goToStep(item.id);
                  }}
                  disabled={!complete && !active}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-brand-red text-white"
                      : complete
                        ? "bg-cream text-navy hover:bg-brand-red/10"
                        : "bg-gray-100 text-text-muted"
                  }`}
                >
                  <span>{index + 1}</span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>

        {step === "schedule" ? (
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-medium text-navy">Pick a date</p>
              {defaultDate !== minDate ? (
                <p className="mb-3 rounded-xl bg-cream px-4 py-3 text-xs text-text-muted">
                  Next available day:{" "}
                  <span className="font-semibold text-navy">{formatShortDate(defaultDate)}</span>
                </p>
              ) : null}
              <ConsultationDatePicker
                availability={availability}
                value={fields.preferredDate}
                onChange={(date) => updateField("preferredDate", date)}
                error={fieldErrors.preferredDate}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-navy">Available times</p>
              {!fields.preferredDate ? (
                <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-text-muted">
                  Select a date first to see open slots.
                </p>
              ) : availableTimeSlots.length === 0 ? (
                <p className="rounded-xl bg-brand-red/10 px-4 py-4 text-sm text-brand-red">
                  No slots left for this date. Try another day or call us on{" "}
                  {contactInfo.phones[0]}.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableTimeSlots.map((slot) => {
                    const selected = fields.preferredTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => updateField("preferredTime", slot.value)}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          selected
                            ? "border-brand-red bg-brand-red text-white"
                            : "border-gray-200 text-navy hover:border-brand-red/40"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {fieldErrors.preferredTime ? (
                <p className="mt-2 text-xs text-brand-red">{fieldErrors.preferredTime}</p>
              ) : null}
            </div>

            <ModeToggle
              value={fields.mode}
              onChange={(mode) => updateField("mode", mode)}
              error={fieldErrors.mode}
            />

            <button type="button" onClick={handleContinueFromSchedule} className="btn-primary">
              Continue
            </button>
          </div>
        ) : null}

        {step === "details" ? (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fields.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Your name"
                  className={fieldClass(Boolean(fieldErrors.fullName))}
                />
                {fieldErrors.fullName ? (
                  <p className="mt-1.5 text-xs text-brand-red">{fieldErrors.fullName}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="0244 XXX XXXX"
                  className={fieldClass(Boolean(fieldErrors.phone))}
                />
                {fieldErrors.phone ? (
                  <p className="mt-1.5 text-xs text-brand-red">{fieldErrors.phone}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={fields.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  className={fieldClass(Boolean(fieldErrors.email))}
                />
                {fieldErrors.email ? (
                  <p className="mt-1.5 text-xs text-brand-red">{fieldErrors.email}</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-navy">What would you like to discuss?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {consultationTopics.map((topic) => {
                  const selected = fields.topic === topic.value;
                  return (
                    <button
                      key={topic.value}
                      type="button"
                      onClick={() => updateField("topic", topic.value)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-brand-red bg-brand-red/5 font-semibold text-navy"
                          : "border-gray-200 text-text-muted hover:border-brand-red/40"
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.topic ? (
                <p className="mt-2 text-xs text-brand-red">{fieldErrors.topic}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-navy">
                Additional notes <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={4}
                value={fields.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Group size, destination ideas, budget, travel dates..."
                className={`${fieldClass(false)} resize-none`}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => goToStep("schedule")} className={secondaryButtonClass}>
                Back
              </button>
              <button type="button" onClick={handleContinueFromDetails} className="btn-primary">
                Review booking
              </button>
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-100 bg-cream/70 p-5">
              <h3 className="text-sm font-semibold text-navy">Appointment summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <ReviewRow label="Date" value={formatShortDate(fields.preferredDate)} />
                <ReviewRow
                  label="Time"
                  value={getTimeSlotLabel(fields.preferredTime as ConsultationTimeSlot, availability)}
                />
                <ReviewRow label="Meeting" value={getModeLabel(fields.mode)} />
                <ReviewRow
                  label="Topic"
                  value={getTopicLabel(fields.topic as ConsultationTopic)}
                />
                <ReviewRow label="Name" value={fields.fullName} />
                <ReviewRow label="Phone" value={fields.phone} />
                <ReviewRow label="Email" value={fields.email} />
                {fields.notes ? <ReviewRow label="Notes" value={fields.notes} /> : null}
              </dl>
            </div>

            {error ? (
              <p className="rounded-xl bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => goToStep("details")} className={secondaryButtonClass}>
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Confirm consultation request"}
              </button>
            </div>

            <p className="text-xs text-text-muted">
              By submitting, you agree to be contacted by Travel Zone about this appointment.
            </p>
          </div>
        ) : null}
      </div>

      <ConsultationSummary
        availability={availability}
        preferredDate={fields.preferredDate}
        preferredTime={fields.preferredTime}
        topic={fields.topic}
        mode={fields.mode}
        fullName={fields.fullName}
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="max-w-[16rem] text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
