import { formatLongDate } from "@/lib/date-utils";
import { formatExchangeRate } from "@/lib/currency";
import { formatPrice } from "@/lib/tours";

type BookingDetailsSummaryProps = {
  fullName: string;
  email: string;
  phone: string;
  tourTitle: string;
  travelDate: string;
  travelers: number;
  packageTotalUsd?: number;
  paymentTotalGhs?: number;
  exchangeRate?: number;
  bookingId?: string;
  paystackReference?: string;
  paidAmountGhs?: number;
  variant?: "review" | "confirmed" | "failed";
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-medium tracking-wide text-text-muted uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value}</dd>
    </div>
  );
}

export function BookingDetailsSummary({
  fullName,
  email,
  phone,
  tourTitle,
  travelDate,
  travelers,
  packageTotalUsd,
  paymentTotalGhs,
  exchangeRate,
  bookingId,
  paystackReference,
  paidAmountGhs,
  variant = "review",
}: BookingDetailsSummaryProps) {
  const isConfirmed = variant === "confirmed";
  const isFailed = variant === "failed";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div
        className={`px-6 py-5 ${
          isConfirmed ? "bg-accent-green/10" : isFailed ? "bg-brand-red/5" : "bg-navy"
        }`}
      >
        <p
          className={`text-xs font-semibold tracking-wide uppercase ${
            isConfirmed
              ? "text-accent-green"
              : isFailed
                ? "text-brand-red"
                : "text-brand-red"
          }`}
        >
          {isConfirmed
            ? "Booking confirmed"
            : isFailed
              ? "Payment incomplete"
              : "Review your booking"}
        </p>
        <h3
          className={`heading-serif mt-1 text-xl ${
            isConfirmed || isFailed ? "text-navy" : "text-white"
          }`}
        >
          {tourTitle}
        </h3>
      </div>

      <dl className="px-6 py-2">
        {bookingId && <DetailRow label="Booking reference" value={bookingId} />}
        <DetailRow label="Name" value={fullName} />
        <DetailRow label="Email" value={email} />
        <DetailRow label="Phone" value={phone} />
        <DetailRow label="Travel date" value={formatLongDate(travelDate)} />
        <DetailRow
          label="Travelers"
          value={`${travelers} ${travelers === 1 ? "person" : "people"}`}
        />
        {packageTotalUsd !== undefined && (
          <DetailRow label="Package total (USD)" value={formatPrice(packageTotalUsd, "USD")} />
        )}
        {exchangeRate !== undefined && packageTotalUsd !== undefined && (
          <DetailRow label="Exchange rate" value={formatExchangeRate(exchangeRate)} />
        )}
        {(paymentTotalGhs !== undefined || paidAmountGhs !== undefined) && (
          <DetailRow
            label={isConfirmed ? "Amount paid (GHS)" : "Pay in Cedis (GHS)"}
            value={formatPrice(paidAmountGhs ?? paymentTotalGhs ?? 0)}
          />
        )}
        {paystackReference && (
          <DetailRow label="Payment ref" value={paystackReference} />
        )}
      </dl>
    </div>
  );
}
