"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { createBookingAndPay } from "@/app/actions/booking";
import { BookingDetailsSummary } from "@/components/booking/BookingDetailsSummary";
import { CurrencyConverter } from "@/components/booking/CurrencyConverter";
import { TravelDatePicker } from "@/components/booking/TravelDatePicker";
import { TravelerStepper } from "@/components/booking/TravelerStepper";
import { PhoneIcon } from "@/components/ContactIcons";
import { openPaystackCheckout } from "@/lib/open-paystack";
import { isDateSelectable, parseTravelPeriodMonths } from "@/lib/date-utils";
import type { Tour } from "@/lib/tours";
import {
  formatPrice,
  formatTourPrice,
  getTourPaymentTotalGhs,
} from "@/lib/tours";
import { contactInfo } from "@/lib/content";

type BookTourFormProps = {
  tour: Tour;
  paymentsReady?: boolean;
  variant?: "default" | "checkout";
};

type FormFields = {
  fullName: string;
  email: string;
  phone: string;
  travelDate: string;
  specialRequests: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

function fieldClass(hasError: boolean) {
  return `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? "border-brand-red focus:border-brand-red"
      : "border-gray-200 focus:border-brand-red"
  }`;
}

function validateFields(fields: FormFields, tour: Tour): FieldErrors {
  const errors: FieldErrors = {};
  const minDate = new Date().toISOString().split("T")[0];
  const allowedMonths = tour.travelPeriod
    ? parseTravelPeriodMonths(tour.travelPeriod)
    : null;

  if (!fields.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = fields.phone.trim().replace(/[\s-]/g, "");
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^(\+233|0)[2-9]\d{8}$/.test(phone)) {
    errors.phone = "Enter a valid Ghana phone number (e.g. 0244 274 663).";
  }

  if (!fields.travelDate) {
    errors.travelDate = "Please select a travel date.";
  } else if (!isDateSelectable(fields.travelDate, minDate, allowedMonths)) {
    errors.travelDate = `Choose a date within ${tour.travelPeriod}.`;
  }

  return errors;
}

export function BookTourForm({
  tour,
  paymentsReady = false,
  variant = "default",
}: BookTourFormProps) {
  const [step, setStep] = useState<"details" | "review">("details");
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    email: "",
    phone: "",
    travelDate: "",
    specialRequests: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [travelers, setTravelers] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentGhs, setPaymentGhs] = useState(() =>
    getTourPaymentTotalGhs(tour, travelers),
  );
  const [exchangeRate, setExchangeRate] = useState<number | undefined>();

  const packageTotal = tour.price * travelers;
  const isCheckout = variant === "checkout";

  const handleConversionChange = useCallback((ghs: number, rate: number) => {
    setPaymentGhs(ghs);
    setExchangeRate(rate);
  }, []);

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleContinue() {
    const errors = validateFields(fields, tour);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    setStep("review");
  }

  async function handlePay() {
    setError("");
    setSubmitting(true);

    try {
      const result = await createBookingAndPay({
        tourSlug: tour.slug,
        tourTitle: tour.title,
        fullName: fields.fullName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        travelDate: fields.travelDate,
        travelers,
        specialRequests: fields.specialRequests.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      try {
        await openPaystackCheckout({
          accessCode: result.accessCode,
          authorizationUrl: result.authorizationUrl,
          reference: result.reference,
        });
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Could not open the payment window. Please try again.",
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again or call us to book.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${
        isCheckout ? "" : "p-6 lg:p-8"
      }`}
    >
      <div className={isCheckout ? "bg-navy px-6 py-5 lg:px-7" : ""}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              className={`heading-serif text-2xl ${
                isCheckout ? "text-white" : "text-navy"
              }`}
            >
              {step === "details" ? "Your details" : "Confirm & pay"}
            </h2>
            <p
              className={`mt-1 text-sm ${
                isCheckout ? "text-white/65" : "text-text-muted"
              }`}
            >
              {step === "details"
                ? `${tour.title} · ${formatTourPrice(tour)}`
                : "Check everything looks right before payment."}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${
              isCheckout
                ? "bg-white/10 text-white/80"
                : "bg-cream text-text-muted"
            }`}
          >
            Step {step === "details" ? "1" : "2"} of 2
          </span>
        </div>
      </div>

      <div className={isCheckout ? "p-6 lg:p-7" : "mt-6"}>
        {step === "details" ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fields.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="As on passport"
                  className={fieldClass(Boolean(fieldErrors.fullName))}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-brand-red">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={fields.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  className={fieldClass(Boolean(fieldErrors.email))}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-brand-red">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="0244 XXX XXXX"
                  className={fieldClass(Boolean(fieldErrors.phone))}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-brand-red">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-navy">Preferred start date</p>
              <TravelDatePicker
                value={fields.travelDate}
                onChange={(date) => updateField("travelDate", date)}
                travelPeriod={tour.travelPeriod}
                error={fieldErrors.travelDate}
              />
            </div>

            <TravelerStepper value={travelers} onChange={setTravelers} />

            <div>
              <label
                htmlFor="specialRequests"
                className="mb-1.5 block text-sm font-medium text-navy"
              >
                Notes <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                rows={3}
                value={fields.specialRequests}
                onChange={(e) => updateField("specialRequests", e.target.value)}
                placeholder="Room preference, passport details, etc."
                className={`${fieldClass(false)} resize-none`}
              />
            </div>

            <CurrencyConverter
              usdTotal={packageTotal}
              perPersonUsd={tour.currency === "USD" ? tour.price : undefined}
              travelers={travelers}
              tourCurrency={tour.currency}
              onConversionChange={handleConversionChange}
            />

            <button type="button" onClick={handleContinue} className="btn-primary w-full">
              Review booking
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <BookingDetailsSummary
              variant="review"
              fullName={fields.fullName.trim()}
              email={fields.email.trim()}
              phone={fields.phone.trim()}
              tourTitle={tour.title}
              travelDate={fields.travelDate}
              travelers={travelers}
              packageTotalUsd={tour.currency === "USD" ? packageTotal : undefined}
              paymentTotalGhs={paymentGhs}
              exchangeRate={exchangeRate}
            />

            {fields.specialRequests.trim() && (
              <div className="rounded-xl border border-gray-100 bg-cream px-4 py-3 text-sm">
                <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  Notes
                </p>
                <p className="mt-1 text-navy">{fields.specialRequests.trim()}</p>
              </div>
            )}

            <CurrencyConverter
              usdTotal={packageTotal}
              perPersonUsd={tour.currency === "USD" ? tour.price : undefined}
              travelers={travelers}
              tourCurrency={tour.currency}
              compact
              onConversionChange={handleConversionChange}
            />

            {!paymentsReady && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-medium">Online payment is not set up yet.</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Your details are ready — call us to complete this booking.
                </p>
                <a
                  href={`tel:${contactInfo.phoneHrefs[0]}`}
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-navy hover:text-brand-red"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {contactInfo.phones[0]}
                </a>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-navy px-6 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={submitting || !paymentsReady}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Opening Paystack..."
                  : paymentsReady
                    ? `Pay ${formatPrice(paymentGhs)}`
                    : "Payment unavailable"}
              </button>
            </div>

            {paymentsReady && (
              <p className="text-center text-xs text-text-muted">
                Secured by Paystack · MTN MoMo, Telecel Cash, cards
              </p>
            )}

            {!paymentsReady && (
              <p className="text-center text-xs text-text-muted">
                Or{" "}
                <Link href="/contact" className="font-semibold text-navy hover:text-brand-red">
                  send us a message
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
