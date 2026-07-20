import { Suspense } from "react";
import { CheckoutCallbackView } from "./callback-view";

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-12 text-center">
          <p className="text-[13px] text-[#6B7280]">Verifying payment...</p>
        </div>
      }
    >
      <CheckoutCallbackView />
    </Suspense>
  );
}
