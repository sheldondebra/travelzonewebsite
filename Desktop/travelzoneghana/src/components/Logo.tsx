import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark" | "color";
  size?: "sm" | "md" | "lg" | "xl";
  linkLabel?: string;
};

const sizes = {
  sm: "h-10 w-auto",
  md: "h-[4.5rem] w-auto sm:h-20",
  lg: "h-[4.5rem] w-auto sm:h-20 lg:h-[5.5rem]",
  xl: "h-24 w-auto sm:h-28",
};

export function Logo({
  className = "",
  variant = "light",
  size = "lg",
  linkLabel,
}: LogoProps) {
  const src =
    variant === "color" ? "/logo-color.png" : "/logo.png";
  const imageClass = `${sizes[size]} max-w-full ${variant === "dark" ? "brightness-0" : ""}`;

  return (
    <Link
      href="/"
      className={`inline-block shrink-0 ${className}`}
      aria-label={linkLabel}
    >
      <Image
        src={src}
        alt="Travel Zone"
        width={320}
        height={96}
        className={imageClass}
        priority
      />
    </Link>
  );
}
