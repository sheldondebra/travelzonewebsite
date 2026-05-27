import { CatalogManager } from "@/components/products/catalog-manager";

export default function BrandsPage() {
  return (
    <CatalogManager
      title="Brands"
      description="Track product brands for filtering and labels"
      type="brands"
    />
  );
}
