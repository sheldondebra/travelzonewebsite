import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingDetailsSummary } from "@/components/booking/BookingDetailsSummary";
import { PhoneIcon } from "@/components/ContactIcons";
import {
  canViewBookingDetails,
  getBookingForConfirmation,
} from "@/lib/booking-access";
import { contactInfo } from "@/lib/content";
import { createMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

type Props = {
  searchParams: Promise<{ reference?: string; ref?: string; paid?: string }>;
};

export default async function BookingConfirmationPage({ searchParams }: Props) {
  const { reference, paid } = await searchParams;
  const booking = await getBookingForConfirmation(reference);
  const canViewDetails = canViewBookingDetails(booking, reference);
  const isPaid = paid === "1" || booking?.paymentStatus === "paid";
  const settings = await getSiteSettings();
  const smsReady =
    settings.splitsms.enabled &&
    Boolean(settings.splitsms.apiKey.trim()) &&
    settings.notifications.smsCustomerOnBookingPaid;
  const emailReady =
    settings.smtp.enabled &&
    Boolean(settings.smtp.host.trim()) &&
    settings.notifications.emailCustomerOnBookingPaid;

  const confirmationNote = isPaid
    ? smsReady && emailReady
      ? "Your booking is confirmed. We sent a confirmation by SMS and email."
      : smsReady
        ? "Your booking is confirmed. We sent a confirmation SMS to your phone."
        : emailReady
          ? "Your booking is confirmed. We sent a confirmation email with your receipt."
          : "Your booking is confirmed. Our team will contact you within one business day."
    : "Your payment did not go through. Your details are below if you want to try again or call us.";

  return (
    <>
      <Header />
      <main className="bg-cream py-24 lg:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-center">
              <div
                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
                  isPaid ? "bg-accent-green/10" : "bg-brand-red/10"
                }`}
              >
                <span
                  className={`text-3xl ${isPaid ? "text-accent-green" : "text-brand-red"}`}
                >
                  {isPaid ? "✓" : "!"}
                </span>
              </div>
              <h1 className="heading-serif text-3xl text-navy lg:text-4xl">
                {isPaid ? "You're all set" : "Payment not completed"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {confirmationNote}
              </p>
            </div>

            {canViewDetails && booking ? (
              <BookingDetailsSummary
                variant={isPaid ? "confirmed" : "failed"}
                bookingId={booking.id}
                fullName={booking.fullName}
                email={booking.email}
                phone={booking.phone}
                tourTitle={booking.tourTitle}
                travelDate={booking.travelDate}
                travelers={booking.travelers}
                packageTotalUsd={undefined}
                paidAmountGhs={isPaid ? booking.paidAmount ?? booking.estimatedTotal : undefined}
                paymentTotalGhs={!isPaid ? booking.estimatedTotal : undefined}
                paystackReference={reference ?? booking.paystackReference}
              />
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-8 text-center text-sm text-text-muted">
                {reference ? (
                  <>
                    <p>
                      {isPaid
                        ? "Your payment was received. Use the payment reference from your SMS or email to view full booking details."
                        : "We could not verify this payment reference."}
                    </p>
                    <p className="mt-2 font-mono text-xs text-navy">{reference}</p>
                  </>
                ) : (
                  <p>No payment reference was provided.</p>
                )}
              </div>
            )}

            {canViewDetails && booking?.specialRequests && (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-6 py-4">
                <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  Your notes
                </p>
                <p className="mt-2 text-sm text-navy">{booking.specialRequests}</p>
              </div>
            )}

            {isPaid && canViewDetails && booking && (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-sm text-text-muted">
                <p className="font-semibold text-navy">What happens next</p>
                <ul className="mt-3 space-y-2">
                  <li>· Our team reviews your booking within one business day.</li>
                  <li>· We contact you if passport or visa documents are needed.</li>
                  <li>· Your full itinerary is shared before departure.</li>
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {canViewDetails && booking?.tourSlug && !isPaid && (
                <Link
                  href={`/book?tour=${booking.tourSlug}`}
                  className="btn-primary flex-1 text-center"
                >
                  Try payment again
                </Link>
              )}
              <Link
                href="/tours"
                className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-navy px-6 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
              >
                Browse tours
              </Link>
              <a
                href={`tel:${contactInfo.phoneHrefs[0]}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
              >
                <PhoneIcon className="h-4 w-4" />
                Call us
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata() {
  return createMetadata({
    title: "Booking Confirmation",
    description: "Your Travel Zone booking payment status.",
    path: "/booking/confirmation",
    noIndex: true,
  });
}
