import { AuthCrestEmblem, AuthLaurelWatermark } from "@/components/edamad/auth-crest";
import { authDesign } from "@/lib/auth-design";

export function AuthBrandPanel() {
  return (
    <div
      className="relative hidden min-h-screen w-[45%] shrink-0 flex-col items-center justify-center overflow-hidden px-10 py-12 md:flex"
      style={{ backgroundColor: authDesign.panelNavy }}
    >
      <AuthLaurelWatermark className="pointer-events-none absolute left-1/2 top-1/2 h-[min(560px,90vh)] w-[min(560px,90vh)] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 flex max-w-[400px] flex-col items-center text-center text-white">
        <AuthCrestEmblem className="mb-6 h-[110px] w-[110px]" />

        <h2 className="font-serif text-[36px] font-bold leading-none tracking-tight text-white">
          ED-AMAD
        </h2>
        <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
          Learning Consult
        </p>
        <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.3em] text-white/80">
          Learn. Prepare. Succeed.
        </p>

        <div className="mt-12 w-full">
          <p className="text-[20px] font-normal leading-snug text-white">Your Path to</p>
          <p
            className="text-[28px] font-bold leading-tight"
            style={{ color: authDesign.highlightBlue }}
          >
            Nursing Excellence
          </p>
          <p className="mx-auto mt-6 max-w-[320px] text-[13px] font-normal leading-[1.7] text-white/90">
            High-quality, exam-focused learning designed to help you pass your NMC License
            Examination with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
