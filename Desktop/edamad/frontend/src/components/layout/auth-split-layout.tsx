import { AuthWatermark } from "@/components/edamad/crest-logo";
import { BrandMark } from "@/components/edamad/brand-mark";

export function AuthSplitLayout({
  children,
  description = "High-quality, exam-focused learning designed to help you pass your NMC License Examination with confidence.",
}: {
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="flex min-h-screen">
      {/* PDF: 50/50 split, navy left panel with watermark */}
      <div className="relative hidden w-1/2 shrink-0 flex-col justify-center overflow-hidden bg-[#002B7F] px-12 py-10 text-white lg:flex">
        <AuthWatermark className="pointer-events-none absolute left-1/2 top-1/2 h-[min(420px,80vh)] w-[min(420px,80vh)] -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col items-center">
          <BrandMark variant="auth" />
          <div className="mt-12 max-w-md text-center">
            <p className="text-lg font-medium text-white/95">Your Path to</p>
            <p className="mt-1 font-serif text-[32px] font-bold leading-tight text-[#6EC1FF]">
              Nursing Excellence
            </p>
            <p className="mx-auto mt-5 text-sm leading-relaxed text-white/85">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-1 items-center justify-center bg-white px-8 py-10 lg:px-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
