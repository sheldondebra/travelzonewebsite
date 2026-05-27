import { PeopleNav } from "@/components/people/people-nav";

export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <PeopleNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
