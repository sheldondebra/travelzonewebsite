import Image from "next/image";

type PageHeroProps = {
  label: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
};

export function PageHero({
  label,
  title,
  description,
  image,
  imageAlt,
}: PageHeroProps) {
  return (
    <section className="relative flex min-h-[50vh] items-end overflow-hidden bg-navy pb-16 pt-32 lg:min-h-[55vh] lg:pb-20 lg:pt-40">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />

      <div className="relative section-container">
        <p className="text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
          {label}
        </p>
        <h1 className="heading-serif mt-3 max-w-3xl text-4xl leading-tight text-white lg:text-[3.25rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
