import { ProductDetails } from "@/components/products/product-details";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetails productId={id} />;
}
