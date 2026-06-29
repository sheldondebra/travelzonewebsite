"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { submitTicketRequest } from "@/app/actions/ticket-request";
import { AirportSearchInput } from "@/components/tickets/AirportSearchInput";
import { TravelDatePicker } from "@/components/tickets/TravelDatePicker";
import { contactInfo } from "@/lib/content";
import { formatShortDate, getLocalTodayIso } from "@/lib/date-utils";
import {
  cabinClasses,
  getCabinClassLabel,
  getTripTypeLabel,
  tripTypes,
  type CabinClass,
  type TripType,
} from "@/lib/ticket-requests";

type FormState = "idle" | "submitting" | "success";
type Step = "trip" | "contact" | "review";

type FormFields = {
  fullName: string;
  email: string;
  phone: string;
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: string;
  cabinClass: CabinClass;
  flexibleDates: boolean;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const steps: { id: Step; label: string }[] = [
  { id: "trip", label: "Trip" },
  { id: "contact", label: "Contact" },
  { id: "review", label: "Review" },
];

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-7 py-3 text-sm font-semibold text-navy hover:border-brand-red hover:text-brand-red";

const initialFields: FormFields = {
  fullName: "",
  email: "",
  phone: "",
  tripType: "round-trip",
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  passengers: "1",
  cabinClass: "economy",
  flexibleDates: false,
  notes: "",
};

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 ${
    hasError
      ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
      : "border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
  }`;
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-brand-red">
          {error}
        </p>
      ) : null}
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

function validateTripStep(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.origin.trim()) errors.origin = "Select or enter a departure city.";
  if (!fields.destination.trim()) errors.destination = "Select or enter a destination.";
  if (
    fields.origin.trim() &&
    fields.destination.trim() &&
    fields.origin.trim().toLowerCase() === fields.destination.trim().toLowerCase()
  ) {
    errors.destination = "Destination must differ from departure.";
  }
  if (!fields.departureDate) errors.departureDate = "Select a departure date.";
  if (fields.tripType === "round-trip" && !fields.returnDate) {
    errors.returnDate = "Select a return date.";
  }
  if (
    fields.tripType === "round-trip" &&
    fields.departureDate &&
    fields.returnDate &&
    fields.returnDate < fields.departureDate
  ) {
    errors.returnDate = "Return must be on or after departure.";
  }
  const passengers = Number(fields.passengers);
  if (!Number.isFinite(passengers) || passengers < 1 || passengers > 20) {
    errors.passengers = "Enter between 1 and 20 passengers.";
  }

  return errors;
}

function validateContactStep(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.fullName.trim()) errors.fullName = "Full name is required.";
  if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  const phone = fields.phone.trim().replace(/[\s-]/g, "");
  if (!phone) errors.phone = "Phone number is required.";
  else if (!/^(\+233|0)[2-9]\d{8}$/.test(phone)) {
    errors.phone = "Enter a valid Ghana phone number.";
  }

  return errors;
}

function validateForm(fields: FormFields): FormErrors {
  return { ...validateTripStep(fields), ...validateContactStep(fields) };
}

export function TicketRequestForm() {
  const minDate = getLocalTodayIso();
  const [step, setStep] = useState<Step>("trip");
  const [state, setState] = useState<FormState>("idle");
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const stepIndex = steps.findIndex((item) => item.id === step);

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "tripType" && value === "one-way") {
        next.returnDate = "";
      }

      if (key === "departureDate" && typeof value === "string" && next.returnDate && next.returnDate < value) {
        next.returnDate = "";
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError("");
  }

  function goToStep(nextStep: Step) {
    setSubmitError("");
    setStep(nextStep);
  }

  function handleContinueFromTrip() {
    const nextErrors = validateTripStep(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    goToStep("contact");
  }

  function handleContinueFromContact() {
    const nextErrors = { ...validateTripStep(fields), ...validateContactStep(fields) };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.origin || nextErrors.destination || nextErrors.departureDate || nextErrors.returnDate) {
        goToStep("trip");
      }
      return;
    }
    goToStep("review");
  }

  async function handleSubmit() {
    const nextErrors = validateForm(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.origin || nextErrors.destination || nextErrors.departureDate || nextErrors.returnDate) {
        goToStep("trip");
      } else {
        goToStep("contact");
      }
      return;
    }

    setState("submitting");
    setSubmitError("");

    const result = await submitTicketRequest({
      fullName: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      tripType: fields.tripType,
      origin: fields.origin,
      destination: fields.destination,
      departureDate: fields.departureDate,
      returnDate: fields.tripType === "round-trip" ? fields.returnDate : undefined,
      passengers: Number(fields.passengers),
      cabinClass: fields.cabinClass,
      flexibleDates: fields.flexibleDates,
      notes: fields.notes,
    });

    if (!result.success) {
      setState("idle");
      setSubmitError(result.error);
      return;
    }

    setRequestId(result.requestId);
    setState("success");
  }

  if (state === "success" && requestId) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-10 lg:text-left">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10 lg:mx-0">
          <span className="text-2xl text-accent-green">✓</span>
        </div>
        <p className="text-sm font-semibold tracking-wide text-brand-red uppercase">
          Request received
        </p>
        <h2 className="heading-serif mt-2 text-2xl text-navy">We&apos;ll handle your booking</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Reference <strong className="text-navy">{requestId}</strong>. Our consultants will search
          fares and contact you with options — no online payment required.
        </p>
        <div className="mt-6 rounded-xl bg-cream px-5 py-4 text-left text-sm text-navy">
          <p className="font-semibold">
            {fields.origin} → {fields.destination}
          </p>
          <p className="mt-1 text-text-muted">
            {formatShortDate(fields.departureDate)}
            {fields.tripType === "round-trip" && fields.returnDate
              ? ` – ${formatShortDate(fields.returnDate)}`
              : ""}{" "}
            · {fields.passengers} passenger{Number(fields.passengers) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          <Link href="/" className="btn-primary">
            Back to home
          </Link>
          <a href={`tel:${contactInfo.phoneHrefs[0]}`} className="btn-outline">
            Call {contactInfo.phones[0]}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 lg:p-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="heading-serif text-xl text-navy sm:text-2xl">Flight request</h2>
          <p className="mt-1 text-sm text-text-muted">
            Search your route, pick dates, then review before sending.
          </p>
        </div>

        <div
          className="inline-flex shrink-0 rounded-full bg-cream p-1"
          role="group"
          aria-label="Trip type"
        >
          {tripTypes.map((item) => {
            const selected = fields.tripType === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateField("tripType", item.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  selected
                    ? "bg-brand-red text-white shadow-sm"
                    : "text-text-muted hover:text-navy"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="mb-6 flex flex-wrap gap-2">
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

      {step === "trip" ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-cream/70 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <AirportSearchInput
                id="origin"
                label="From"
                value={fields.origin}
                onChange={(value) => updateField("origin", value)}
                placeholder="Accra, Lagos, Dubai…"
                error={errors.origin}
                excludeValue={fields.destination}
              />

              <div className="hidden items-center justify-center pt-8 sm:flex">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-brand-red shadow-sm"
                >
                  →
                </span>
              </div>

              <AirportSearchInput
                id="destination"
                label="To"
                value={fields.destination}
                onChange={(value) => updateField("destination", value)}
                placeholder="London, New York, DXB…"
                error={errors.destination}
                excludeValue={fields.origin}
              />
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              fields.tripType === "round-trip" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            <TravelDatePicker
              id="departureDate"
              label="Departure"
              value={fields.departureDate}
              onChange={(value) => updateField("departureDate", value)}
              minDate={minDate}
              error={errors.departureDate}
            />

            {fields.tripType === "round-trip" ? (
              <TravelDatePicker
                id="returnDate"
                label="Return"
                value={fields.returnDate}
                onChange={(value) => updateField("returnDate", value)}
                minDate={fields.departureDate || minDate}
                error={errors.returnDate}
              />
            ) : null}

            <FormField id="passengers" label="Passengers" error={errors.passengers}>
              <input
                id="passengers"
                type="number"
                min={1}
                max={20}
                value={fields.passengers}
                onChange={(event) => updateField("passengers", event.target.value)}
                aria-invalid={Boolean(errors.passengers)}
                className={fieldClass(Boolean(errors.passengers))}
              />
            </FormField>

            <FormField id="cabinClass" label="Cabin">
              <select
                id="cabinClass"
                value={fields.cabinClass}
                onChange={(event) => updateField("cabinClass", event.target.value as CabinClass)}
                className={fieldClass(false)}
              >
                {cabinClasses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <button
            type="button"
            onClick={() => updateField("flexibleDates", !fields.flexibleDates)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              fields.flexibleDates
                ? "border-brand-red/30 bg-brand-red/5 text-navy"
                : "border-gray-100 bg-gray-50/80 text-text-muted hover:border-gray-200"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                fields.flexibleDates
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-gray-300 bg-white"
              }`}
              aria-hidden
            >
              {fields.flexibleDates ? "✓" : ""}
            </span>
            <span>
              <span className="font-medium text-navy">Flexible dates</span>
              <span className="mt-0.5 block text-xs leading-relaxed">
                Show options a few days before or after if it saves money.
              </span>
            </span>
          </button>

          <button type="button" onClick={handleContinueFromTrip} className="btn-primary">
            Continue to contact details
          </button>
        </div>
      ) : null}

      {step === "contact" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField id="fullName" label="Full name" error={errors.fullName}>
                <input
                  id="fullName"
                  value={fields.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="As on passport"
                  aria-invalid={Boolean(errors.fullName)}
                  className={fieldClass(Boolean(errors.fullName))}
                />
              </FormField>
            </div>

            <FormField id="email" label="Email" error={errors.email}>
              <input
                id="email"
                type="email"
                value={fields.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                className={fieldClass(Boolean(errors.email))}
              />
            </FormField>

            <FormField id="phone" label="Phone" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                value={fields.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="0244 274 663"
                aria-invalid={Boolean(errors.phone)}
                className={fieldClass(Boolean(errors.phone))}
              />
            </FormField>
          </div>

          <FormField id="notes" label="Notes (optional)">
            <textarea
              id="notes"
              rows={3}
              value={fields.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Preferred airline, baggage, child ages…"
              className={`${fieldClass(false)} resize-none`}
            />
          </FormField>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => goToStep("trip")} className={secondaryButtonClass}>
              Back
            </button>
            <button type="button" onClick={handleContinueFromContact} className="btn-primary">
              Review request
            </button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-100 bg-cream/70 p-5">
            <h3 className="text-sm font-semibold text-navy">Trip summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <ReviewRow label="Route" value={`${fields.origin} → ${fields.destination}`} />
              <ReviewRow label="Trip type" value={getTripTypeLabel(fields.tripType)} />
              <ReviewRow label="Departure" value={formatShortDate(fields.departureDate)} />
              {fields.tripType === "round-trip" && fields.returnDate ? (
                <ReviewRow label="Return" value={formatShortDate(fields.returnDate)} />
              ) : null}
              <ReviewRow
                label="Passengers"
                value={`${fields.passengers} · ${getCabinClassLabel(fields.cabinClass)}`}
              />
              {fields.flexibleDates ? (
                <ReviewRow label="Dates" value="Flexible — show nearby options" />
              ) : null}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-100 bg-cream/70 p-5">
            <h3 className="text-sm font-semibold text-navy">Contact details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <ReviewRow label="Name" value={fields.fullName} />
              <ReviewRow label="Email" value={fields.email} />
              <ReviewRow label="Phone" value={fields.phone} />
              {fields.notes ? <ReviewRow label="Notes" value={fields.notes} /> : null}
            </dl>
          </div>

          <p className="text-xs text-text-muted">
            By submitting, you agree to be contacted by Travel Zone about fare options. No payment
            is taken online.
          </p>

          {submitError ? (
            <p className="rounded-lg bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{submitError}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => goToStep("contact")} className={secondaryButtonClass}>
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={state === "submitting"}
              className="btn-primary disabled:opacity-60"
            >
              {state === "submitting" ? "Submitting…" : "Submit ticket request"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
