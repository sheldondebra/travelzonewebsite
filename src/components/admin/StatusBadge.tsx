type Props = {
  status: string;
};

const styles: Record<string, string> = {
  published: "bg-[#edfaef] text-[#007017]",
  draft: "bg-[#f3efe8] text-text-muted",
  pending: "bg-[#fcf9e8] text-[#996800]",
  confirmed: "bg-[#edfaef] text-[#007017]",
  cancelled: "bg-[#f9e4e8] text-brand-red",
  completed: "bg-[#edfaef] text-[#007017]",
  read: "bg-[#edfaef] text-[#007017]",
  archived: "bg-[#f3efe8] text-text-muted",
  paid: "bg-[#edfaef] text-[#007017]",
  unpaid: "bg-[#f3efe8] text-text-muted",
  failed: "bg-[#f9e4e8] text-brand-red",
  quoted: "bg-cream text-navy",
  booked: "bg-[#edfaef] text-[#007017]",
};

export function StatusBadge({ status }: Props) {
  const style = styles[status] ?? "bg-[#f3efe8] text-text-muted";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${style}`}
    >
      {status}
    </span>
  );
}
