import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { finalizeSuccessfulPayment } from "@/lib/payment-finalize";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Payment Verification",
  description: "Verifying your Travel Zone booking payment.",
  path: "/booking/payment/verify",
  noIndex: true,
});

type Props = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

export default async function PaymentVerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  if (!reference) {
    redirect("/booking/confirmation?paid=0");
  }

  try {
    const result = await finalizeSuccessfulPayment(reference);
    if (result.paid) {
      redirect(`/booking/confirmation?reference=${encodeURIComponent(reference)}&paid=1`);
    }
    redirect(`/booking/confirmation?reference=${reference}&paid=0`);
  } catch {
    redirect(`/booking/confirmation?reference=${reference}&paid=0`);
  }
}
