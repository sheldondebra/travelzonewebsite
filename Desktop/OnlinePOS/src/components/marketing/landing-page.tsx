"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Package,
    title: "Inventory that stays calm",
    description:
      "Track stock, cost, and selling price without spreadsheet chaos.",
  },
  {
    icon: ShoppingBag,
    title: "Orders in one place",
    description:
      "Payment and delivery status for every WhatsApp or Instagram sale.",
  },
  {
    icon: Wallet,
    title: "Profit you can trust",
    description: "See margin on every order — not just revenue.",
  },
  {
    icon: BarChart3,
    title: "Dashboard intelligence",
    description: "Revenue, best sellers, and low-stock alerts at a glance.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="glass-light sticky top-0 z-50 border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
              <Store className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Social Commerce</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground hidden sm:inline-flex",
              )}
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground hidden sm:inline-flex",
              )}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-muted-foreground",
              )}
            >
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "h-11 px-6")}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center md:pt-24">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-rose/60 px-4 py-1.5 text-sm text-foreground">
              <Sparkles className="size-4 text-primary" />
              Tecunit Ghana · Premium social commerce
            </p>
            <h1 className="text-4xl leading-tight md:text-5xl">
              Your business, finally under control
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Stripe-meets-Shopify simplicity with soft luxury aesthetics — built
              for fashion, beauty, and lifestyle sellers across Africa.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/register" className={cn(buttonVariants(), "h-12 px-8 text-base")}>
                Start free
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 border-gray-200 bg-white px-8 text-base",
                )}
              >
                View pricing
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mx-auto mt-16 max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-soft md:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Revenue", value: "₵ 24,500", color: "bg-brand-pink" },
                { label: "Profit", value: "₵ 9,200", color: "bg-[#22C55E]/20" },
                { label: "Orders", value: "128", color: "bg-brand-lavender/40" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border border-gray-100 p-5 text-left",
                    stat.color,
                  )}
                >
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-left text-sm text-muted-foreground">
              Dashboard preview — real analytics when you sign in
            </p>
          </motion.div>
        </section>

        <section className="bg-brand-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl">Everything you need, nothing you don&apos;t</h2>
              <p className="mt-3 text-muted-foreground">
                Organized for busy owners who sell on Instagram, WhatsApp, and TikTok
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-rose/50">
                    <Icon className="size-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <Users className="mx-auto size-8 text-primary" strokeWidth={1.5} />
            <h2 className="mt-4 text-3xl">Loved by modern sellers</h2>
            <p className="mt-4 text-lg italic text-muted-foreground">
              &ldquo;My business finally feels organized — like a real brand, not
              scattered DMs.&rdquo;
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              — Fashion & cosmetics sellers using Social Commerce
            </p>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl">Ready to sell with clarity?</h2>
            <p className="mt-3 text-muted-foreground">
              Set up your shop in minutes. No cluttered ERP — just calm, premium tools.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants(), "mt-8 inline-flex h-12 px-10 text-base")}
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-muted-foreground">
        Social Commerce · Tecunit Ghana
      </footer>
    </div>
  );
}
