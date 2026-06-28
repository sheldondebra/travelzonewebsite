import Link from "next/link";
import { SocialLinksDark, SocialProfileList } from "@/components/SocialLinks";
import { socialLinks } from "@/lib/social";

export function SocialFollow() {
  return (
    <section className="py-16 lg:py-20">
      <div className="section-container">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="heading-serif text-2xl text-navy lg:text-3xl">
              Follow {socialLinks.instagram.handle}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
              We post tour dates, flight deals, and photos from trips on
              Instagram and TikTok. Facebook too if that&apos;s your thing.
            </p>
            <SocialLinksDark className="mt-6" />
          </div>
          <SocialProfileList />
        </div>
      </div>
    </section>
  );
}
