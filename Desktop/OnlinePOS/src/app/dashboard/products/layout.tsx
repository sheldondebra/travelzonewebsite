import { ProductsSectionLayout } from "@/components/products/products-section-layout";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductsSectionLayout>{children}</ProductsSectionLayout>;
}
