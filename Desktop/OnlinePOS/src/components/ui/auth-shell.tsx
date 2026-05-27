import { Store } from "lucide-react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen bg-brand-cream">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-rose/40 via-brand-cream to-brand-lavender/30 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary shadow-soft">
            <Store className="size-5 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold">Social Commerce</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl leading-snug">
            Elegant. Premium. Organized.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Inventory, orders, and profit — designed for modern sellers who want
            calm control over their business.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Tecunit Ghana</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
