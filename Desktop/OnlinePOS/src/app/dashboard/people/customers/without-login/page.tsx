import { CustomersList } from "@/components/people/customers-list";

export default function CustomersWithoutLoginPage() {
  return (
    <CustomersList
      title="Customers without login"
      description="Profiles used at POS and orders only — no portal account"
      hasLogin={false}
      emptyMessage="No customers without login"
    />
  );
}
