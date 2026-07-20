import { AuthCrestEmblem } from "@/components/edamad/auth-crest";
import { cn } from "@/lib/utils";

export function BrandMark({
  variant = "sidebar",
  className,
}: {
  variant?: "sidebar" | "auth";
  className?: string;
}) {
  const isAuth = variant === "auth";

  if (isAuth) {
    return (
      <div className={cn("text-center text-white", className)}>
        <AuthCrestEmblem className="mx-auto mb-4 h-[72px] w-[72px]" />
        <p className="font-serif text-[26px] font-bold leading-none tracking-tight">ED-AMAD</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/95">
          Learning Consult
        </p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-white/70">
          Learn · Prepare · Succeed
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center px-2 text-center text-white", className)}>
      <AuthCrestEmblem className="mb-3 h-[58px] w-[58px]" />
      <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-[0.04em]">ED-AMAD</p>
      <p className="text-[9px] font-semibold uppercase leading-[1.15] tracking-[0.06em] text-white/95">
        Learning Consult
      </p>
      <p className="mt-2 text-[7px] font-medium uppercase tracking-[0.2em] text-white/60">
        Learn. Prepare. Succeed.
      </p>
    </div>
  );
}
