import { CatalogManager } from "@/components/products/catalog-manager";

export default function UnitsPage() {
  return (
    <CatalogManager
      title="Units"
      description="Pieces, kg, liters, boxes — how you sell and count stock"
      type="units"
    />
  );
}
