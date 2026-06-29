import { StaffUserForm } from "@/components/admin/StaffUserForm";

type Props = {
  defaultEmail?: string;
};

export function AddUserForm({ defaultEmail = "" }: Props) {
  return <StaffUserForm defaultEmail={defaultEmail} variant="full" />;
}
