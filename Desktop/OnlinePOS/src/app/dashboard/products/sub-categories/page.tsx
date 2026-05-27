import { CatalogManager } from "@/components/products/catalog-manager";

export default function SubCategoriesPage() {
  return (
    <CatalogManager
      title="Sub categories"
      description="Nested groups under each category"
      type="sub-categories"
    />
  );
}
