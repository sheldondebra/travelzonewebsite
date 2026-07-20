"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Info,
  Lock,
  Shield,
  ShoppingCart,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatGhs, getStoreCourseIcon, resolveCartItemIcon } from "@/lib/store-utils";
import { fetchPublicBranding } from "@/services/admin-settings";
import { initializeCheckout } from "@/services/checkout";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

const DEFAULT_PROCESSING_FEE = 15;

const networks = [
  { id: "mtn", label: "MTN MoMo", dot: "#FFCC00" },
  { id: "telecel", label: "Telecel Cash", dot: "#E60000" },
  { id: "airteltigo", label: "Airtel-Tigo Money", dot: "#0066CC" },
] as const;

const checkoutSteps = [
  { id: 1, label: "Cart", href: "/courses/store" },
  { id: 2, label: "Checkout", active: true },
  { id: 3, label: "Payment" },
] as const;

const summaryTrust = [
  { icon: Lock, title: "Encrypted payment", desc: "Your payment is secure and protected." },
  { icon: Zap, title: "Instant course access", desc: "Get immediate access after payment." },
  { icon: Shield, title: "Secure checkout", desc: "Powered by Paystack's secure platform." },
];

function CheckoutSteps() {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2 text-[12px] font-medium">
      {checkoutSteps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          {index > 0 && <span className="text-[#D1D5DB]">/</span>}
          {"href" in step ? (
            <Link href={step.href} className="text-[#6B7280] hover:text-[#0057FF]">
              {step.label}
            </Link>
          ) : (
            <span className={"active" in step && step.active ? "text-[#0057FF]" : "text-[#6B7280]"}>
              {step.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function CourseIcon({ icon }: { icon: string }) {
  const Icon = getStoreCourseIcon(icon);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EBF2FF]">
      <Icon className="h-[18px] w-[18px] text-[#0057FF]" strokeWidth={1.75} />
    </div>
  );
}

function CheckoutCourseRow({
  title,
  price,
  icon,
  onRemove,
}: {
  title: string;
  price: number;
  icon: string;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-[#E5EAF2] py-3 last:border-b-0">
      <CourseIcon icon={icon} />
      <span className="min-w-0 flex-1 text-[13px] text-[#374151]">{title}</span>
      <span className="shrink-0 text-[13px] font-semibold text-[#0057FF]">GHS {formatGhs(price)}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-[#9CA3AF] hover:bg-[#F7F9FC] hover:text-[#374151]"
          aria-label={`Remove ${title}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const { items, removeItem } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<"momo" | "card">("momo");
  const [network, setNetwork] = useState<(typeof networks)[number]["id"]>("mtn");
  const [processingFee, setProcessingFee] = useState(DEFAULT_PROCESSING_FEE);
  const [paystackEnabled, setPaystackEnabled] = useState(false);
  const [paying, setPaying] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicBranding()
      .then((branding) => {
        setProcessingFee(branding.paystack.processing_fee || DEFAULT_PROCESSING_FEE);
        setPaystackEnabled(branding.paystack.enabled);
      })
      .catch(() => {
        setProcessingFee(DEFAULT_PROCESSING_FEE);
        setPaystackEnabled(false);
      });
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const fee = items.length > 0 ? processingFee : 0;
  const total = subtotal + fee;

  async function handlePay() {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }

    if (paymentMethod === "momo" && !phone.trim()) {
      toast.error("Please enter your phone number for Mobile Money.");
      return;
    }

    setPaying(true);
    try {
      const result = await initializeCheckout({
        course_ids: items.map((item) => item.id),
        payment_method: paymentMethod,
        billing: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          network: paymentMethod === "momo" ? network : undefined,
        },
      });

      window.location.href = result.authorization_url;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? "Could not start payment. Please try again.");
      setPaying(false);
    }
  }

  if (!bootstrapped) {
    return <p className="text-center text-[13px] text-[#6B7280]">Loading checkout...</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        <CheckoutSteps />
        <div className="ed-card mx-auto max-w-md py-12 text-center">
          <ShoppingCart className="mx-auto h-14 w-14 text-[#E5EAF2]" strokeWidth={1.25} />
          <h1 className="mt-4 text-[20px] font-bold text-[#002B7F]">Your cart is empty</h1>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            Add courses from the store to continue to checkout.
          </p>
          <Link href="/courses/store" className="ed-btn-primary mt-6 inline-flex gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Course Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/courses/store"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#0057FF]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to store
      </Link>

      <CheckoutSteps />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Checkout</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Review your order and pay securely with Paystack.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FF] px-3 py-1.5 text-[12px] font-semibold text-[#0057FF]">
          <ShoppingCart className="h-3.5 w-3.5" />
          {items.length} course{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {!user && (
        <div className="mb-5 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#1E40AF]">
          Please{" "}
          <Link href="/auth/login?redirect=/checkout" className="font-semibold underline">
            sign in
          </Link>{" "}
          to complete your purchase.
        </div>
      )}

      {!paystackEnabled ? (
        <div className="mb-5 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]">
          Paystack payments are currently disabled. Contact support or try again later.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-5">
          <div className="ed-card overflow-hidden">
            <div className="border-b border-[#E5EAF2] bg-[#F7F9FC] px-5 py-3">
              <h2 className="text-[14px] font-semibold text-[#002B7F]">
                Order items ({items.length})
              </h2>
            </div>
            <ul className="px-5">
              {items.map((item) => (
                <CheckoutCourseRow
                  key={item.id}
                  title={item.title}
                  price={item.price}
                  icon={resolveCartItemIcon(item)}
                  onRemove={() => {
                    removeItem(item.id);
                    toast.info("Course removed from cart");
                  }}
                />
              ))}
            </ul>
          </div>

          <div className="ed-card p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#002B7F]">Pay with</span>
                <span className="text-[18px] font-bold tracking-tight text-[#00C3F7]">paystack</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5EAF2] bg-[#F9FAFB] px-3 py-1 text-[11px] font-medium text-[#6B7280]">
                <Lock className="h-3 w-3" />
                Secured by Paystack
              </span>
            </div>

            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("momo")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-colors sm:flex-none ${
                  paymentMethod === "momo"
                    ? "border-2 border-[#0057FF] bg-white text-[#0057FF] shadow-sm"
                    : "border border-[#E5EAF2] bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-colors sm:flex-none ${
                  paymentMethod === "card"
                    ? "border-2 border-[#0057FF] bg-white text-[#0057FF] shadow-sm"
                    : "border border-[#E5EAF2] bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Bank Card
              </button>
            </div>

            <div className={`grid gap-5 ${paymentMethod === "momo" ? "lg:grid-cols-[1fr_200px]" : ""}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002B7F]">
                    Full Name
                  </label>
                  <input
                    className="ed-input w-full"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002B7F]">
                    Email Address
                  </label>
                  <input
                    className="ed-input w-full"
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-[#6B7280]">
                    Your purchase confirmation will be sent to this email.
                  </p>
                </div>
                {paymentMethod === "momo" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002B7F]">
                        Phone Number
                      </label>
                      <div className="flex overflow-hidden rounded-[10px] border border-[#E5EAF2] bg-white">
                        <span className="flex items-center gap-1 border-r border-[#E5EAF2] bg-[#F9FAFB] px-3 text-[13px] text-[#374151]">
                          🇬🇭 +233
                        </span>
                        <input
                          className="h-[42px] flex-1 px-3 text-sm text-[#374151] outline-none placeholder:text-[#9CA3AF]"
                          placeholder="Phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002B7F]">
                        Select Network
                      </label>
                      <select
                        className="ed-input w-full"
                        value={network}
                        onChange={(e) => setNetwork(e.target.value as typeof network)}
                      >
                        {networks.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {paymentMethod === "momo" && (
                <div className="ed-card h-fit p-4 lg:border lg:shadow-none">
                  <p className="mb-3 text-[12px] font-semibold text-[#002B7F]">Supported Networks</p>
                  <div className="space-y-2">
                    {networks.map((n) => (
                      <label
                        key={n.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-[8px] border px-3 py-2.5 transition-colors ${
                          network === n.id
                            ? "border-[#0057FF] bg-[#EBF2FF]/50"
                            : "border-[#E5EAF2] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="network"
                          value={n.id}
                          checked={network === n.id}
                          onChange={() => setNetwork(n.id)}
                          className="sr-only"
                        />
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: n.dot }}
                        />
                        <span className="text-[12px] font-medium text-[#374151]">{n.label}</span>
                        <span
                          className={`ml-auto h-4 w-4 rounded-full border-2 ${
                            network === n.id
                              ? "border-[#0057FF] bg-[#0057FF]"
                              : "border-[#D1D5DB]"
                          }`}
                        >
                          {network === n.id && (
                            <span className="block h-full w-full scale-[0.4] rounded-full bg-white" />
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Your payment details are encrypted and secure with Paystack.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="ed-card overflow-hidden">
            <div className="bg-[#002B7F] px-5 py-4">
              <h2 className="text-[15px] font-semibold text-white">Order Summary</h2>
              <p className="mt-0.5 text-[12px] text-white/70">{items.length} course{items.length === 1 ? "" : "s"} selected</p>
            </div>
            <div className="p-5">
              <ul className="mb-4 max-h-48 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5">
                    <CourseIcon icon={resolveCartItemIcon(item)} />
                    <span className="min-w-0 flex-1 text-[12px] leading-snug text-[#374151]">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[12px] font-medium text-[#6B7280]">
                      GHS {formatGhs(item.price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-[#E5EAF2] pt-3 text-[13px]">
                <div className="flex justify-between text-[#374151]">
                  <span>Subtotal</span>
                  <span>GHS {formatGhs(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    Processing Fee
                    <Info className="h-3.5 w-3.5" />
                  </span>
                  <span>GHS {formatGhs(fee)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-[#E5EAF2] pt-4">
                <span className="text-[15px] font-semibold text-[#002B7F]">Total</span>
                <span className="text-[20px] font-bold text-[#0057FF]">GHS {formatGhs(total)}</span>
              </div>

              <button
                type="button"
                disabled={!paystackEnabled || paying || !user}
                onClick={handlePay}
                className="ed-btn-primary mt-4 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                {paying ? "Redirecting to Paystack..." : `Pay GHS ${formatGhs(total)}`}
              </button>
              <p className="mt-2 text-center text-[11px] text-[#6B7280]">
                You will be redirected to Paystack to complete payment.
              </p>

              <div className="mt-5 space-y-3 border-t border-[#E5EAF2] pt-4">
                {summaryTrust.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
                    <div>
                      <p className="text-[11px] font-semibold text-[#002B7F]">{title}</p>
                      <p className="text-[10px] leading-snug text-[#6B7280]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
