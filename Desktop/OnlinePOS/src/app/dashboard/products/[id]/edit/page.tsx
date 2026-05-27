import { ProductForm } from "@/components/products/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
