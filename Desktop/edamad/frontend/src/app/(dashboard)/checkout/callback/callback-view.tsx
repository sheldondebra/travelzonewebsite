"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { verifyCheckout } from "@/services/checkout";
import { useCartStore } from "@/store/cart-store";

export function CheckoutCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const clearCart = useCartStore((s) => s.clearCart);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [courses, setCourses] = useState<{ id: number; slug: string; title: string }[]>([]);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }

    verifyCheckout(reference)
      .then((result) => {
        clearCart();
        setCourses(result.courses);
        setStatus("success");
        setMessage("Payment successful! Your courses are now available.");
        toast.success("Purchase complete! Check your email for course details.");
        setTimeout(() => router.replace("/dashboard?purchased=1"), 3000);
      })
      .catch((err: unknown) => {
        const apiMessage =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setStatus("error");
        setMessage(apiMessage ?? "Payment could not be verified. Contact support if you were charged.");
        toast.error(apiMessage ?? "Payment verification failed.");
      });
  }, [reference, clearCart, router]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="ed-card overflow-hidden text-center">
        {status === "loading" && (
          <div className="px-6 py-14">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#0057FF]" />
            <h1 className="mt-4 text-[20px] font-bold text-[#002B7F]">Verifying payment...</h1>
            <p className="mt-2 text-[13px] text-[#6B7280]">Please wait while we confirm your purchase.</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="bg-[#F0FDF4] px-6 py-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#22C55E]" />
              <h1 className="mt-4 text-[20px] font-bold text-[#002B7F]">Payment confirmed</h1>
              <p className="mt-2 text-[13px] text-[#6B7280]">{message}</p>
            </div>
            <div className="px-6 py-5 text-left">
              {courses.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#002B7F]">
                    Unlocked courses
                  </p>
                  <ul className="space-y-2">
                    {courses.map((course) => (
                      <li
                        key={course.id}
                        className="flex items-center gap-2 rounded-[8px] bg-[#F7F9FC] px-3 py-2 text-[13px] text-[#374151]"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                        {course.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-[8px] border border-[#E5EAF2] bg-[#F9FAFB] px-3 py-2.5 text-[12px] text-[#6B7280]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0057FF]" />
                <span>A confirmation email with your course details has been sent to your inbox.</span>
              </div>
              <p className="mt-4 text-center text-[12px] text-[#9CA3AF]">Redirecting to your dashboard...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="px-6 py-14">
            <XCircle className="mx-auto h-12 w-12 text-[#EF4444]" />
            <h1 className="mt-4 text-[20px] font-bold text-[#002B7F]">Payment issue</h1>
            <p className="mt-2 text-[13px] text-[#6B7280]">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/checkout" className="ed-btn-outline">
                Back to Checkout
              </Link>
              <Link href="/support" className="ed-btn-ghost-navy">
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
