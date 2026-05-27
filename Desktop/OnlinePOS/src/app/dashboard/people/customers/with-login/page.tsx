import { CustomersList } from "@/components/people/customers-list";

export default function CustomersWithLoginPage() {
  return (
    <CustomersList
      title="Customers with login"
      description="Buyers with portal accounts linked to your store"
      hasLogin={true}
      emptyMessage="No customers with portal login yet"
    />
  );
}
