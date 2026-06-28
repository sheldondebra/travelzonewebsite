import { NextResponse } from "next/server";
import { finalizeSuccessfulPayment } from "@/lib/payment-finalize";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!(await verifyPaystackWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; status?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await finalizeSuccessfulPayment(event.data.reference);
    } catch (error) {
      console.error("Paystack webhook finalize failed:", error);
      return NextResponse.json({ error: "Finalize failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
