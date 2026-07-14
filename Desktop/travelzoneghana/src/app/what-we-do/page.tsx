import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  WhatWeDoAudiences,
  WhatWeDoCta,
  WhatWeDoHero,
  WhatWeDoHighlights,
  WhatWeDoProcess,
  WhatWeDoServices,
} from "@/components/what-we-do/WhatWeDoSections";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "What We Do",
  description:
    "Airline ticketing, tour packages, corporate travel, group arrangements, and adventure tours — full-service travel management from Travel Zone Ghana.",
  path: "/what-we-do",
});

export default function WhatWeDoPage() {
  return (
    <>
      <Header />
      <main>
        <WhatWeDoHero />
        <WhatWeDoHighlights />
        <WhatWeDoServices />
        <WhatWeDoAudiences />
        <WhatWeDoProcess />
        <WhatWeDoCta />
      </main>
      <Footer />
    </>
  );
}
